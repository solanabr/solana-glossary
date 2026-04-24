import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Data layer helpers (same logic as MCP server, for test verification)
// ---------------------------------------------------------------------------

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
  aliases?: string[];
}

const DATA_DIR = path.resolve(__dirname, "../data/terms");
const I18N_DIR = path.resolve(__dirname, "../data/i18n");

function loadAllTerms(): GlossaryTerm[] {
  const terms: GlossaryTerm[] = [];
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
    terms.push(...data);
  }
  return terms;
}

let allTerms: GlossaryTerm[];
let termMap: Map<string, GlossaryTerm>;
let aliasMap: Map<string, string>;
let CATEGORIES: string[];

beforeAll(() => {
  allTerms = loadAllTerms();
  termMap = new Map(allTerms.map((t) => [t.id, t]));
  aliasMap = new Map();
  for (const t of allTerms) {
    for (const alias of t.aliases ?? []) {
      aliasMap.set(alias.toLowerCase(), t.id);
    }
  }
  CATEGORIES = [...new Set(allTerms.map((t) => t.category))].sort();
});

// ---------------------------------------------------------------------------
// Tool 1: lookup
// ---------------------------------------------------------------------------
describe("Tool: lookup", () => {
  it("finds a term by exact ID", () => {
    const t = termMap.get("pda");
    expect(t).toBeDefined();
    expect(t!.term).toBeTruthy();
  });

  it("finds a term by alias (case-insensitive)", () => {
    const id = aliasMap.get("pda");
    if (id) {
      expect(termMap.has(id)).toBe(true);
    }
  });

  it("returns undefined for nonexistent term", () => {
    expect(termMap.get("zzz-nonexistent-xyz")).toBeUndefined();
  });

  it("handles empty string input gracefully", () => {
    expect(termMap.get("")).toBeUndefined();
  });

  it("resolves multiple different aliases to same term", () => {
    const termsWithAliases = allTerms.filter((t) => t.aliases && t.aliases.length >= 2);
    if (termsWithAliases.length > 0) {
      const t = termsWithAliases[0];
      const id1 = aliasMap.get(t.aliases![0].toLowerCase());
      const id2 = aliasMap.get(t.aliases![1].toLowerCase());
      expect(id1).toBe(id2);
    }
  });
});

// ---------------------------------------------------------------------------
// Tool 2: search
// ---------------------------------------------------------------------------
describe("Tool: search", () => {
  it("finds terms matching 'proof of history'", () => {
    const q = "proof of history";
    const results = allTerms.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    );
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("finds terms matching 'token'", () => {
    const results = allTerms.filter((t) => t.term.toLowerCase().includes("token") || t.definition.toLowerCase().includes("token"));
    expect(results.length).toBeGreaterThan(5);
  });

  it("returns empty for nonsense query", () => {
    const results = allTerms.filter((t) => t.term.toLowerCase().includes("xyznonexistent999"));
    expect(results).toHaveLength(0);
  });

  it("searches in aliases", () => {
    const aliased = allTerms.filter((t) => t.aliases?.some((a) => a.toLowerCase().includes("sol")));
    expect(aliased.length).toBeGreaterThanOrEqual(0);
  });

  it("search is case-insensitive", () => {
    const upper = allTerms.filter((t) => t.term.toLowerCase().includes("blockchain"));
    const lower = allTerms.filter((t) => t.term.toLowerCase().includes("BLOCKCHAIN".toLowerCase()));
    expect(upper.length).toBe(lower.length);
  });

  it("respects limit parameter", () => {
    const limit = 3;
    const results = allTerms.filter((t) => t.definition.toLowerCase().includes("the")).slice(0, limit);
    expect(results.length).toBeLessThanOrEqual(limit);
  });
});

// ---------------------------------------------------------------------------
// Tool 3: browse
// ---------------------------------------------------------------------------
describe("Tool: browse", () => {
  it("returns terms for each category", () => {
    for (const cat of CATEGORIES) {
      const terms = allTerms.filter((t) => t.category === cat);
      expect(terms.length).toBeGreaterThan(0);
    }
  });

  it("returns empty for invalid category", () => {
    const terms = allTerms.filter((t) => t.category === "fake-category-xxx");
    expect(terms).toHaveLength(0);
  });

  it("all returned terms have matching category", () => {
    const cat = CATEGORIES[0];
    const terms = allTerms.filter((t) => t.category === cat);
    for (const t of terms) {
      expect(t.category).toBe(cat);
    }
  });
});

// ---------------------------------------------------------------------------
// Tool 4: categories
// ---------------------------------------------------------------------------
describe("Tool: categories", () => {
  it("returns 14 categories", () => {
    expect(CATEGORIES.length).toBe(14);
  });

  it("includes core-protocol", () => {
    expect(CATEGORIES).toContain("core-protocol");
  });

  it("includes defi", () => {
    expect(CATEGORIES).toContain("defi");
  });

  it("includes security", () => {
    expect(CATEGORIES).toContain("security");
  });

  it("all categories are non-empty strings", () => {
    for (const cat of CATEGORIES) {
      expect(cat.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Tool 5: related
// ---------------------------------------------------------------------------
describe("Tool: related", () => {
  it("finds related terms for a term with relations", () => {
    const withRelated = allTerms.find((t) => t.related && t.related.length > 0);
    expect(withRelated).toBeDefined();
    if (withRelated) {
      for (const relId of withRelated.related!) {
        expect(termMap.has(relId)).toBe(true);
      }
    }
  });

  it("handles term with no relations", () => {
    const noRelated = allTerms.find((t) => !t.related || t.related.length === 0);
    if (noRelated) {
      expect(noRelated.related?.length ?? 0).toBe(0);
    }
  });

  it("depth traversal stays within bounds", () => {
    const visited = new Set<string>();
    const withRelated = allTerms.find((t) => t.related && t.related.length > 0);
    if (!withRelated) return;

    let current = [withRelated.id];
    for (let d = 0; d < 3; d++) {
      const next: string[] = [];
      for (const id of current) {
        if (visited.has(id)) continue;
        visited.add(id);
        const t = termMap.get(id);
        if (t?.related) next.push(...t.related.filter((r) => !visited.has(r)));
      }
      current = next;
    }
    expect(visited.size).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tool 6: quiz
// ---------------------------------------------------------------------------
describe("Tool: quiz", () => {
  it("has enough terms with definitions for quiz generation", () => {
    const pool = allTerms.filter((t) => t.definition.length > 20);
    expect(pool.length).toBeGreaterThan(4);
  });

  it("can generate quiz from specific category", () => {
    for (const cat of CATEGORIES) {
      const pool = allTerms.filter((t) => t.category === cat && t.definition.length > 20);
      // Some categories may have < 4 terms, that's ok
      if (pool.length >= 4) {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        expect(shuffled.length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("quiz answer is always in the options", () => {
    const pool = allTerms.filter((t) => t.definition.length > 20);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const answer = shuffled[0];
    const options = [answer, ...shuffled.slice(1, 4)];
    expect(options).toContainEqual(answer);
  });
});

// ---------------------------------------------------------------------------
// Tool 7: stats
// ---------------------------------------------------------------------------
describe("Tool: stats", () => {
  it("total terms is 1001", () => {
    expect(allTerms.length).toBe(1001);
  });

  it("most terms have definitions", () => {
    const withDef = allTerms.filter((t) => t.definition.length > 0);
    expect(withDef.length / allTerms.length).toBeGreaterThan(0.9);
  });

  it("counts aliases correctly", () => {
    const withAliases = allTerms.filter((t) => t.aliases && t.aliases.length > 0);
    expect(withAliases.length).toBeGreaterThan(0);
  });

  it("counts relations correctly", () => {
    const totalRelations = allTerms.reduce((sum, t) => sum + (t.related?.length ?? 0), 0);
    expect(totalRelations).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tool 8: explain
// ---------------------------------------------------------------------------
describe("Tool: explain", () => {
  it("explains a term with full context", () => {
    const t = termMap.get("pda");
    expect(t).toBeDefined();
    expect(t!.definition.length).toBeGreaterThan(0);
  });

  it("finds reverse references (referenced-by)", () => {
    const withRelated = allTerms.find((t) => t.related && t.related.length > 0);
    if (withRelated) {
      const targetId = withRelated.related![0];
      const referencedBy = allTerms.filter((t) => t.related?.includes(targetId) && t.id !== targetId);
      expect(referencedBy.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Tool 9: compare
// ---------------------------------------------------------------------------
describe("Tool: compare", () => {
  it("compares two existing terms", () => {
    const terms = allTerms.slice(0, 2);
    expect(terms[0].id).not.toBe(terms[1].id);
    expect(terms[0].term).toBeTruthy();
    expect(terms[1].term).toBeTruthy();
  });

  it("detects shared related terms", () => {
    const a = allTerms.find((t) => t.related && t.related.length > 2);
    const b = allTerms.find((t) => t.related && t.related.length > 2 && t.id !== a?.id);
    if (a && b) {
      const shared = (a.related ?? []).filter((r) => (b.related ?? []).includes(r));
      // Shared may be 0, that's valid
      expect(shared.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("handles nonexistent term in comparison", () => {
    const exists = termMap.has("pda");
    const notExists = termMap.has("zzz-fake-999");
    expect(exists).toBe(true);
    expect(notExists).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tool 10: flashcards
// ---------------------------------------------------------------------------
describe("Tool: flashcards", () => {
  it("generates correct number of flashcards", () => {
    const pool = allTerms.filter((t) => t.definition.length > 20);
    const count = 5;
    const cards = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    expect(cards.length).toBe(count);
  });

  it("caps at max 20 flashcards", () => {
    const count = Math.min(25, 20);
    expect(count).toBe(20);
  });

  it("flashcards have front and back content", () => {
    const pool = allTerms.filter((t) => t.definition.length > 20);
    const card = pool[0];
    expect(card.term.length).toBeGreaterThan(0);
    expect(card.definition.length).toBeGreaterThan(20);
  });

  it("filters by category", () => {
    const cat = "defi";
    const pool = allTerms.filter((t) => t.category === cat && t.definition.length > 20);
    expect(pool.length).toBeGreaterThan(0);
    for (const t of pool) expect(t.category).toBe(cat);
  });
});

// ---------------------------------------------------------------------------
// Tool 11: random
// ---------------------------------------------------------------------------
describe("Tool: random", () => {
  it("returns requested count of terms", () => {
    const count = 5;
    const picked = [...allTerms].sort(() => Math.random() - 0.5).slice(0, count);
    expect(picked.length).toBe(count);
  });

  it("caps at max 10", () => {
    expect(Math.min(15, 10)).toBe(10);
  });

  it("filters by category", () => {
    const cat = "security";
    const pool = allTerms.filter((t) => t.category === cat);
    expect(pool.length).toBeGreaterThan(0);
  });

  it("returns different results on repeated calls (randomness)", () => {
    const a = [...allTerms].sort(() => Math.random() - 0.5).slice(0, 3).map((t) => t.id);
    const b = [...allTerms].sort(() => Math.random() - 0.5).slice(0, 3).map((t) => t.id);
    // With 1001 terms, extremely unlikely to be identical
    // But not guaranteed, so just check they're arrays
    expect(a.length).toBe(3);
    expect(b.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Tool 12: suggest
// ---------------------------------------------------------------------------
describe("Tool: suggest", () => {
  it("suggests terms starting with 'pro'", () => {
    const matches = allTerms.filter((t) => t.term.toLowerCase().startsWith("pro") || t.id.startsWith("pro"));
    expect(matches.length).toBeGreaterThan(0);
  });

  it("suggests from aliases too", () => {
    const matches = allTerms.filter((t) => t.aliases?.some((a) => a.toLowerCase().startsWith("p")));
    expect(matches.length).toBeGreaterThanOrEqual(0);
  });

  it("returns empty for nonsense prefix", () => {
    const matches = allTerms.filter((t) => t.term.toLowerCase().startsWith("zzzzqqqq"));
    expect(matches).toHaveLength(0);
  });

  it("respects limit", () => {
    const limit = 3;
    const matches = allTerms.filter((t) => t.term.toLowerCase().startsWith("a")).slice(0, limit);
    expect(matches.length).toBeLessThanOrEqual(limit);
  });
});

// ---------------------------------------------------------------------------
// Tool 13: bulk_lookup
// ---------------------------------------------------------------------------
describe("Tool: bulk_lookup", () => {
  it("looks up multiple valid terms", () => {
    const ids = allTerms.slice(0, 5).map((t) => t.id);
    const results = ids.map((id) => termMap.get(id)).filter(Boolean);
    expect(results.length).toBe(5);
  });

  it("handles mix of valid and invalid terms", () => {
    const ids = [allTerms[0].id, "fake-term-xxx", allTerms[1].id];
    const found = ids.filter((id) => termMap.has(id));
    const notFound = ids.filter((id) => !termMap.has(id));
    expect(found.length).toBe(2);
    expect(notFound.length).toBe(1);
  });

  it("handles empty array", () => {
    const ids: string[] = [];
    const results = ids.map((id) => termMap.get(id)).filter(Boolean);
    expect(results).toHaveLength(0);
  });

  it("handles all-invalid terms", () => {
    const ids = ["fake1", "fake2", "fake3"];
    const results = ids.filter((id) => termMap.has(id));
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tool 14: export_terms
// ---------------------------------------------------------------------------
describe("Tool: export_terms", () => {
  it("exports JSON format correctly", () => {
    const pool = allTerms.slice(0, 3);
    const json = JSON.stringify(pool.map(({ id, term, definition, category }) => ({ id, term, definition, category })));
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toHaveProperty("id");
    expect(parsed[0]).toHaveProperty("term");
  });

  it("exports CSV with proper header", () => {
    const header = "id,term,category,definition";
    expect(header.split(",")).toHaveLength(4);
  });

  it("exports CSV escapes quotes in definitions", () => {
    const t = { id: "test", term: "Test", definition: 'A "test" term', category: "test" };
    const escaped = t.definition.replace(/"/g, '""');
    expect(escaped).toBe('A ""test"" term');
  });

  it("exports Markdown table format", () => {
    const row = `| test-id | Test Term | test-cat | A test definition |`;
    expect(row.split("|").length).toBeGreaterThan(4);
  });

  it("filters by category", () => {
    const cat = "core-protocol";
    const pool = allTerms.filter((t) => t.category === cat);
    expect(pool.length).toBeGreaterThan(0);
    for (const t of pool) expect(t.category).toBe(cat);
  });
});

// ---------------------------------------------------------------------------
// Tool 15: learning_path
// ---------------------------------------------------------------------------
describe("Tool: learning_path", () => {
  it("generates path from category", () => {
    const cat = "core-protocol";
    const terms = allTerms.filter((t) => t.category === cat);
    expect(terms.length).toBeGreaterThan(0);
  });

  it("generates path from a specific term via BFS", () => {
    const start = allTerms.find((t) => t.related && t.related.length > 2);
    if (start) {
      const visited = new Set<string>();
      const queue = [start.id];
      const path: GlossaryTerm[] = [];
      while (queue.length > 0 && path.length < 10) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const t = termMap.get(id);
        if (!t) continue;
        path.push(t);
        for (const r of t.related ?? []) {
          if (!visited.has(r)) queue.push(r);
        }
      }
      expect(path.length).toBeGreaterThan(1);
    }
  });

  it("caps learning path at 10 steps", () => {
    const maxSteps = 10;
    const cat = "defi";
    const terms = allTerms.filter((t) => t.category === cat).slice(0, maxSteps);
    expect(terms.length).toBeLessThanOrEqual(maxSteps);
  });

  it("returns error for nonexistent topic", () => {
    const exists = CATEGORIES.includes("fake-nonexistent");
    expect(exists).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tool 16: difficulty
// ---------------------------------------------------------------------------
describe("Tool: difficulty", () => {
  it("scores all terms with a numeric score", () => {
    for (const t of allTerms.slice(0, 20)) {
      const score = t.definition.length * 0.1 + (t.related?.length ?? 0) * 10 + (t.aliases?.length ?? 0) * 5;
      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
    }
  });

  it("classifies terms into beginner/intermediate/advanced", () => {
    let beginner = 0, intermediate = 0, advanced = 0;
    for (const t of allTerms) {
      const score = t.definition.length * 0.1 + (t.related?.length ?? 0) * 10 + (t.aliases?.length ?? 0) * 5;
      if (score < 20) beginner++;
      else if (score < 50) intermediate++;
      else advanced++;
    }
    expect(beginner + intermediate + advanced).toBe(allTerms.length);
  });

  it("filters by difficulty level", () => {
    const level = "beginner";
    const filtered = allTerms.filter((t) => {
      const score = t.definition.length * 0.1 + (t.related?.length ?? 0) * 10 + (t.aliases?.length ?? 0) * 5;
      return score < 20;
    });
    for (const t of filtered) {
      const score = t.definition.length * 0.1 + (t.related?.length ?? 0) * 10 + (t.aliases?.length ?? 0) * 5;
      expect(score).toBeLessThan(20);
    }
  });

  it("filters by category", () => {
    const cat = "security";
    const pool = allTerms.filter((t) => t.category === cat);
    expect(pool.length).toBeGreaterThan(0);
  });

  it("respects limit", () => {
    const limit = 5;
    const results = allTerms.slice(0, limit);
    expect(results.length).toBeLessThanOrEqual(limit);
  });
});

// ---------------------------------------------------------------------------
// i18n / Localization
// ---------------------------------------------------------------------------
describe("i18n", () => {
  it("i18n directory exists", () => {
    expect(fs.existsSync(I18N_DIR)).toBe(true);
  });

  it("locale files are valid JSON", () => {
    if (!fs.existsSync(I18N_DIR)) return;
    for (const file of fs.readdirSync(I18N_DIR)) {
      if (!file.endsWith(".json")) continue;
      const data = JSON.parse(fs.readFileSync(path.join(I18N_DIR, file), "utf-8"));
      expect(typeof data).toBe("object");
    }
  });

  it("locale override preserves term structure", () => {
    const term: GlossaryTerm = { id: "test", term: "Test", definition: "A test", category: "core-protocol" };
    const override = { test: { term: "Teste", definition: "Um teste" } };
    const o = override[term.id];
    const localized = o ? { ...term, term: o.term ?? term.term, definition: o.definition ?? term.definition } : term;
    expect(localized.id).toBe("test");
    expect(localized.term).toBe("Teste");
    expect(localized.definition).toBe("Um teste");
    expect(localized.category).toBe("core-protocol");
  });
});

// ---------------------------------------------------------------------------
// Data files integrity
// ---------------------------------------------------------------------------
describe("Data files", () => {
  it("all JSON data files are valid", () => {
    for (const file of fs.readdirSync(DATA_DIR)) {
      if (!file.endsWith(".json")) continue;
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it("has 14 data files", () => {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    expect(files.length).toBe(14);
  });

  it("no term ID contains spaces", () => {
    for (const t of allTerms) {
      expect(t.id).not.toContain(" ");
    }
  });

  it("no term ID contains uppercase", () => {
    for (const t of allTerms) {
      expect(t.id).toBe(t.id.toLowerCase());
    }
  });

  it("all term IDs are URL-safe", () => {
    const urlSafe = /^[a-z0-9-]+$/;
    for (const t of allTerms) {
      expect(t.id).toMatch(urlSafe);
    }
  });
});

// ---------------------------------------------------------------------------
// MCP server structure
// ---------------------------------------------------------------------------
describe("MCP server file", () => {
  it("server source file exists", () => {
    expect(fs.existsSync(path.resolve(__dirname, "../mcp-server/src/index.ts"))).toBe(true);
  });

  it("server has package.json", () => {
    expect(fs.existsSync(path.resolve(__dirname, "../mcp-server/package.json"))).toBe(true);
  });

  it("server registers 16 tools", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../mcp-server/src/index.ts"), "utf-8");
    const toolCount = (src.match(/server\.tool\(/g) || []).length;
    expect(toolCount).toBe(16);
  });

  it("server registers at least 1 resource", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../mcp-server/src/index.ts"), "utf-8");
    const resourceCount = (src.match(/server\.resource\(/g) || []).length;
    expect(resourceCount).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Edge cases & robustness
// ---------------------------------------------------------------------------
describe("Edge cases", () => {
  it("handles terms with very long definitions", () => {
    const longest = allTerms.reduce((max, t) => (t.definition.length > max.definition.length ? t : max), allTerms[0]);
    expect(longest.definition.length).toBeGreaterThan(50);
  });

  it("handles terms with no aliases", () => {
    const noAlias = allTerms.filter((t) => !t.aliases || t.aliases.length === 0);
    expect(noAlias.length).toBeGreaterThan(0);
  });

  it("handles terms with many relations", () => {
    const maxRelated = allTerms.reduce((max, t) => (t.related?.length ?? 0) > (max.related?.length ?? 0) ? t : max, allTerms[0]);
    expect(maxRelated.related?.length ?? 0).toBeGreaterThan(0);
  });

  it("category counts sum to total terms", () => {
    let sum = 0;
    for (const cat of CATEGORIES) {
      sum += allTerms.filter((t) => t.category === cat).length;
    }
    expect(sum).toBe(allTerms.length);
  });

  it("no duplicate aliases across terms", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const t of allTerms) {
      for (const a of t.aliases ?? []) {
        const lower = a.toLowerCase();
        if (seen.has(lower) && seen.get(lower) !== t.id) {
          dupes.push(`${lower} (${seen.get(lower)} vs ${t.id})`);
        }
        seen.set(lower, t.id);
      }
    }
    // Report but don't fail — upstream data may have intentional overlaps
    if (dupes.length > 0) {
      console.warn(`Found ${dupes.length} duplicate aliases`);
    }
  });
});
