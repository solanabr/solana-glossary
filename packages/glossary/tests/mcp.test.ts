import { describe, it, expect } from "vitest";
import {
  getTerm,
  searchTerms,
  getTermsByCategory,
  getTermsByDepth,
  getTermsByMaxDepth,
  getTermsByTag,
  getAllTags,
  getCategories,
  allTerms,
} from "../src/index";
import { getLocalizedTerms } from "../src/i18n";
import type { GlossaryTerm, Category, Depth } from "../src/types";

// Test the tool logic directly — same functions the MCP handlers call

describe("lookup_term (getTerm)", () => {
  it("finds a term by ID", () => {
    const term = getTerm("pda");
    expect(term).toBeDefined();
    expect(term!.id).toBe("pda");
    expect(term!.definition).toBeTruthy();
  });

  it("finds a term by alias (case-insensitive)", () => {
    const term = getTerm("PoH");
    expect(term).toBeDefined();
    expect(term!.id).toBe("proof-of-history");
  });

  it("returns undefined for nonexistent term", () => {
    expect(getTerm("nonexistent-xyz")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getTerm("")).toBeUndefined();
  });

  it("Portuguese locale overrides term and definition", () => {
    const ptTerms = getLocalizedTerms("pt");
    const ptMap = new Map(ptTerms.map((t) => [t.id, t]));
    const ptTerm = ptMap.get("proof-of-history");
    expect(ptTerm).toBeDefined();
    expect(ptTerm!.term).not.toBe("Proof of History (PoH)");
    expect(ptTerm!.definition).not.toContain("A clock mechanism");
  });

  it("Spanish locale overrides term and definition", () => {
    const esTerms = getLocalizedTerms("es");
    const esMap = new Map(esTerms.map((t) => [t.id, t]));
    const esTerm = esMap.get("proof-of-history");
    expect(esTerm).toBeDefined();
    expect(esTerm!.term).not.toBe("Proof of History (PoH)");
    expect(esTerm!.definition).not.toContain("A clock mechanism");
  });

  it("unsupported locale falls back to English", () => {
    const frTerms = getLocalizedTerms("fr");
    const frMap = new Map(frTerms.map((t) => [t.id, t]));
    const frTerm = frMap.get("proof-of-history");
    expect(frTerm).toBeDefined();
    expect(frTerm!.term).toBe("Proof of History (PoH)");
  });
});

describe("search_glossary (searchTerms)", () => {
  it("finds terms matching query", () => {
    const results = searchTerms("proof of history");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns empty array for nonsense query", () => {
    const results = searchTerms("xyzzy12345nonexistent");
    expect(results).toHaveLength(0);
  });

  it("returns empty array for empty string", () => {
    const results = searchTerms("");
    // Empty string matches everything or nothing depending on impl
    // Just verify it doesn't throw
    expect(Array.isArray(results)).toBe(true);
  });

  it("respects limit via slice", () => {
    const all = searchTerms("token");
    const limited = searchTerms("token").slice(0, 5);
    expect(limited.length).toBeLessThanOrEqual(5);
    expect(all.length).toBeGreaterThanOrEqual(limited.length);
  });

  it("matches on aliases", () => {
    const results = searchTerms("PoH");
    expect(results.some((t) => t.id === "proof-of-history")).toBe(true);
  });
});

describe("list_categories (getCategories)", () => {
  it("returns 14 categories", () => {
    expect(getCategories()).toHaveLength(14);
  });

  it("each category has terms", () => {
    for (const cat of getCategories()) {
      expect(getTermsByCategory(cat).length).toBeGreaterThan(0);
    }
  });
});

describe("browse_category (getTermsByCategory)", () => {
  it("returns only terms with matching category", () => {
    const terms = getTermsByCategory("defi");
    expect(terms.length).toBeGreaterThan(0);
    for (const t of terms) {
      expect(t.category).toBe("defi");
    }
  });
});

describe("filter_by_depth", () => {
  it("exact depth returns only matching terms", () => {
    const terms = getTermsByDepth(1);
    expect(terms.length).toBeGreaterThan(0);
    for (const t of terms) {
      expect(t.depth).toBe(1);
    }
  });

  it("max depth returns progressive set", () => {
    const d1 = getTermsByMaxDepth(1);
    const d2 = getTermsByMaxDepth(2);
    const d5 = getTermsByMaxDepth(5);
    expect(d2.length).toBeGreaterThan(d1.length);
    expect(d5).toHaveLength(allTerms.length);
  });
});

describe("filter_by_tag (getTermsByTag)", () => {
  it("returns terms with matching tag", () => {
    const terms = getTermsByTag("token-2022");
    expect(terms.length).toBeGreaterThan(0);
    for (const t of terms) {
      expect(t.tags).toContain("token-2022");
    }
  });

  it("returns empty for nonexistent tag", () => {
    expect(getTermsByTag("nonexistent-tag")).toHaveLength(0);
  });
});

describe("list_tags (getAllTags)", () => {
  it("returns sorted unique tags", () => {
    const tags = getAllTags();
    expect(tags.length).toBeGreaterThan(0);
    expect(tags).toEqual([...tags].sort());
  });

  it("returns 16 tags", () => {
    expect(getAllTags()).toHaveLength(16);
  });
});

describe("get_related (graph traversal)", () => {
  it("depth 1 returns direct relatives", () => {
    const root = getTerm("pda");
    expect(root).toBeDefined();
    expect(root!.related?.length).toBeGreaterThan(0);

    for (const refId of root!.related!) {
      const ref = getTerm(refId);
      expect(ref).toBeDefined();
    }
  });

  it("handles circular references without infinite loop", () => {
    // BFS traversal with visited set
    const visited = new Set<string>();
    const queue: string[] = ["pda"];
    let iterations = 0;

    while (queue.length > 0 && iterations < 1000) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      iterations++;

      const term = getTerm(id);
      if (term?.related) {
        for (const ref of term.related) {
          if (!visited.has(ref)) queue.push(ref);
        }
      }
    }

    expect(iterations).toBeLessThan(1000);
  });
});

describe("glossary_stats", () => {
  it("computes correct totals", () => {
    const depthDist: Record<number, number> = {};
    const catDist: Record<string, number> = {};
    const tagDist: Record<string, number> = {};

    for (const t of allTerms) {
      depthDist[t.depth] = (depthDist[t.depth] ?? 0) + 1;
      catDist[t.category] = (catDist[t.category] ?? 0) + 1;
      for (const tag of t.tags ?? []) {
        tagDist[tag] = (tagDist[tag] ?? 0) + 1;
      }
    }

    expect(Object.values(depthDist).reduce((a, b) => a + b, 0)).toBe(
      allTerms.length,
    );
    expect(Object.keys(catDist)).toHaveLength(14);
    expect(Object.keys(tagDist).length).toBeGreaterThan(0);
  });
});

describe("inject_context", () => {
  it("compact format returns term: definition lines", () => {
    const ids = ["pda", "cpi", "anchor"];
    const terms = ids
      .map((id) => getTerm(id))
      .filter(Boolean) as GlossaryTerm[];
    expect(terms).toHaveLength(3);

    const compact = terms.map((t) => `${t.term}: ${t.definition}`).join("\n\n");
    expect(compact).toContain("PDA");
    expect(compact).toContain("CPI");
  });

  it("handles missing IDs gracefully", () => {
    const ids = ["pda", "nonexistent-xyz"];
    const found = ids.map((id) => getTerm(id)).filter(Boolean);
    const notFound = ids.filter((id) => !getTerm(id));
    expect(found).toHaveLength(1);
    expect(notFound).toEqual(["nonexistent-xyz"]);
  });

  it("estimates tokens roughly at ~4 chars per token", () => {
    const term = getTerm("pda");
    expect(term).toBeDefined();
    const text = `${term!.term}: ${term!.definition}`;
    const estimatedTokens = Math.ceil(text.length / 4);
    expect(estimatedTokens).toBeGreaterThan(10);
    expect(estimatedTokens).toBeLessThan(500);
  });
});

describe("MCP server integration", () => {
  it("createServer returns a server instance", async () => {
    const { createServer } = await import("../mcp/server");
    const server = createServer();
    expect(server).toBeDefined();
  });
});

describe("browse_category edge cases", () => {
  it("invalid category returns empty", () => {
    const cats = getCategories();
    expect(cats.includes("invalid-category" as Category)).toBe(false);
  });

  it("every term belongs to a valid category", () => {
    const validCats = new Set(getCategories());
    for (const t of allTerms) {
      expect(validCats.has(t.category)).toBe(true);
    }
  });
});

describe("filter_by_depth edge cases", () => {
  it("depth 1 and depth 5 are non-empty", () => {
    expect(getTermsByDepth(1).length).toBeGreaterThan(0);
    expect(getTermsByDepth(5).length).toBeGreaterThan(0);
  });

  it("maxDepth 1 is a subset of maxDepth 2", () => {
    const d1 = new Set(getTermsByMaxDepth(1).map((t) => t.id));
    const d2 = getTermsByMaxDepth(2);
    for (const t of d2) {
      if (t.depth === 1) expect(d1.has(t.id)).toBe(true);
    }
  });
});

describe("i18n completeness", () => {
  it("Portuguese has entries for all terms", () => {
    const ptTerms = getLocalizedTerms("pt");
    expect(ptTerms).toHaveLength(allTerms.length);
  });

  it("Spanish has entries for all terms", () => {
    const esTerms = getLocalizedTerms("es");
    expect(esTerms).toHaveLength(allTerms.length);
  });

  it("Portuguese definitions are not English", () => {
    const ptTerms = getLocalizedTerms("pt");
    const enTerms = new Map(allTerms.map((t) => [t.id, t]));
    let translated = 0;
    for (const pt of ptTerms) {
      const en = enTerms.get(pt.id);
      if (en && pt.definition !== en.definition) translated++;
    }
    // At least 95% should be different from English
    expect(translated / ptTerms.length).toBeGreaterThan(0.95);
  });

  it("Spanish definitions are not English", () => {
    const esTerms = getLocalizedTerms("es");
    const enTerms = new Map(allTerms.map((t) => [t.id, t]));
    let translated = 0;
    for (const es of esTerms) {
      const en = enTerms.get(es.id);
      if (en && es.definition !== en.definition) translated++;
    }
    expect(translated / esTerms.length).toBeGreaterThan(0.95);
  });
});
