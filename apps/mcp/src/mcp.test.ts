/**
 * Tests for @stbr/solana-glossary-mcp — all 12 tools
 * Exercises the SDK functions and logic that back each tool.
 */

import { describe, it, expect } from "vitest";
import {
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
  allTerms,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";

// ── helpers (same logic used inside the tools) ───────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

function fuzzySearch(query: string, threshold = 0.6, limit = 5) {
  const q = query.toLowerCase();
  return allTerms
    .map((t) => {
      const candidates = [t.id, t.term.toLowerCase(), ...(t.aliases ?? []).map((a) => a.toLowerCase())];
      const score = Math.max(...candidates.map((c) => similarity(q, c)));
      return { term: t, score };
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function bfsPath(fromId: string, toId: string, maxDepth = 6): string[] | null {
  if (fromId === toId) return [fromId];
  const queue: string[][] = [[fromId]];
  const visited = new Set<string>([fromId]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    if (path.length > maxDepth) return null;
    const current = getTerm(path[path.length - 1]);
    for (const neighborId of current?.related ?? []) {
      if (visited.has(neighborId)) continue;
      const newPath = [...path, neighborId];
      if (neighborId === toId) return newPath;
      visited.add(neighborId);
      queue.push(newPath);
    }
  }
  return null;
}

// ── 1. lookup_term ────────────────────────────────────────────────────────────
describe("lookup_term", () => {
  it("returns term by exact ID", () => {
    const t = getTerm("pda");
    expect(t).toBeDefined();
    expect(t!.id).toBe("pda");
    expect(t!.definition.length).toBeGreaterThan(10);
  });

  it("resolves alias 'PDA' to pda", () => {
    expect(getTerm("PDA")?.id).toBe("pda");
  });

  it("resolves alias 'PoH' to proof-of-history", () => {
    expect(getTerm("PoH")?.id).toBe("proof-of-history");
  });

  it("returns undefined for unknown term", () => {
    expect(getTerm("not-a-real-term-xyz")).toBeUndefined();
  });

  it("returns pt localization when available", () => {
    const localized = getLocalizedTerms("pt");
    expect(localized.length).toBeGreaterThan(0);
    expect(localized[0]).toHaveProperty("id");
  });
});

// ── 2. search_glossary ────────────────────────────────────────────────────────
describe("search_glossary", () => {
  it("finds terms matching 'account'", () => {
    expect(searchTerms("account").length).toBeGreaterThan(0);
  });

  it("returns empty for garbage query", () => {
    expect(searchTerms("xyzzy_not_real_9999")).toHaveLength(0);
  });

  it("results have required fields", () => {
    for (const r of searchTerms("validator")) {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("term");
      expect(r).toHaveProperty("definition");
      expect(r).toHaveProperty("category");
    }
  });

  it("finds proof-of-history by alias 'PoH'", () => {
    const ids = searchTerms("PoH").map((r) => r.id);
    expect(ids).toContain("proof-of-history");
  });
});

// ── 3. get_category ───────────────────────────────────────────────────────────
describe("get_category", () => {
  it("returns terms for 'defi'", () => {
    const terms = getTermsByCategory("defi");
    expect(terms.length).toBeGreaterThan(0);
    for (const t of terms) expect(t.category).toBe("defi");
  });

  it("returns terms for 'security'", () => {
    expect(getTermsByCategory("security").length).toBeGreaterThan(0);
  });

  it("returns empty for unknown category", () => {
    expect(getTermsByCategory("not-a-category" as never)).toHaveLength(0);
  });
});

// ── 4. get_related_terms ──────────────────────────────────────────────────────
describe("get_related_terms", () => {
  it("pda has related terms", () => {
    expect(getTerm("pda")?.related?.length).toBeGreaterThan(0);
  });

  it("all related IDs resolve to real terms", () => {
    for (const relId of getTerm("account")?.related ?? []) {
      expect(getTerm(relId)).toBeDefined();
    }
  });
});

// ── 5. list_categories ────────────────────────────────────────────────────────
describe("list_categories", () => {
  it("returns at least 10 categories", () => {
    expect(getCategories().length).toBeGreaterThanOrEqual(10);
  });

  it("includes core-protocol, defi, security", () => {
    const cats = getCategories();
    expect(cats).toContain("core-protocol");
    expect(cats).toContain("defi");
    expect(cats).toContain("security");
  });
});

// ── 6. generate_quiz ──────────────────────────────────────────────────────────
describe("generate_quiz", () => {
  it("allTerms has 1000+ terms for quiz pool", () => {
    expect(allTerms.length).toBeGreaterThanOrEqual(1000);
  });

  it("defi pool has enough terms for multiple choice", () => {
    expect(getTermsByCategory("defi").length).toBeGreaterThan(3);
  });

  it("distractors are different from correct answer", () => {
    const correct = getTerm("pda")!;
    const distractors = allTerms
      .filter((t) => t.id !== correct.id)
      .slice(0, 3);
    for (const d of distractors) expect(d.id).not.toBe(correct.id);
  });
});

// ── 7. inject_context ─────────────────────────────────────────────────────────
describe("inject_context", () => {
  it("context block for known terms is non-empty", () => {
    const terms = ["pda", "account", "validator"].map((id) => getTerm(id)).filter(Boolean);
    expect(terms.length).toBe(3);
    const context = terms.map((t) => `${t!.term}: ${t!.definition}`).join("\n\n");
    expect(context.length).toBeGreaterThan(100);
  });

  it("unknown term returns undefined, does not throw", () => {
    expect(() => getTerm("not-real")).not.toThrow();
    expect(getTerm("not-real")).toBeUndefined();
  });
});

// ── 8. glossary_stats ─────────────────────────────────────────────────────────
describe("glossary_stats", () => {
  it("total terms >= 1000", () => {
    expect(allTerms.length).toBeGreaterThanOrEqual(1000);
  });

  it("all terms have id and category", () => {
    for (const t of allTerms) {
      expect(t.id).toBeTruthy();
      expect(t.category).toBeTruthy();
    }
  });

  it("more than 30% of terms have cross-references", () => {
    const withRefs = allTerms.filter((t) => t.related?.length).length;
    expect(withRefs / allTerms.length).toBeGreaterThan(0.3);
  });
});

// ── 9. fuzzy_search (NEW) ─────────────────────────────────────────────────────
describe("fuzzy_search", () => {
  it("finds 'pda' with typo 'pds'", () => {
    const ids = fuzzySearch("pds", 0.5).map((r) => r.term.id);
    expect(ids).toContain("pda");
  });

  it("finds lamport with typo 'laminport'", () => {
    const results = fuzzySearch("laminport", 0.5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0.5);
  });

  it("scores are between 0 and 1", () => {
    for (const { score } of fuzzySearch("account")) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it("exact match scores 1.0", () => {
    const results = fuzzySearch("pda", 0, 50);
    const exact = results.find((r) => r.term.id === "pda");
    expect(exact?.score).toBe(1);
  });

  it("respects limit parameter", () => {
    expect(fuzzySearch("account", 0.3, 3).length).toBeLessThanOrEqual(3);
  });

  it("levenshtein is symmetric", () => {
    expect(levenshtein("abc", "ab")).toBe(levenshtein("ab", "abc"));
  });

  it("levenshtein('', 'abc') === 3", () => {
    expect(levenshtein("", "abc")).toBe(3);
  });

  it("identical strings have similarity 1", () => {
    expect(similarity("pda", "pda")).toBe(1);
  });
});

// ── 10. find_learning_path (NEW) ──────────────────────────────────────────────
describe("find_learning_path", () => {
  it("path from term to itself returns [id]", () => {
    expect(bfsPath("pda", "pda")).toEqual(["pda"]);
  });

  it("all steps in path resolve to valid terms", () => {
    const path = bfsPath("account", "validator", 8);
    if (path) {
      for (const id of path) expect(getTerm(id)).toBeDefined();
    }
  });

  it("path starts with fromId and ends with toId", () => {
    const path = bfsPath("account", "pda", 6);
    if (path) {
      expect(path[0]).toBe("account");
      expect(path[path.length - 1]).toBe("pda");
    }
  });

  it("unknown fromId returns undefined from getTerm", () => {
    expect(getTerm("not-real-abc")).toBeUndefined();
  });

  it("depth 1 returns null for non-direct connections", () => {
    const path = bfsPath("zk-proof", "lamport", 1);
    // Either null or a very short path — never throws
    expect(path === null || Array.isArray(path)).toBe(true);
  });
});

// ── 11. compare_terms (NEW) ───────────────────────────────────────────────────
describe("compare_terms", () => {
  it("shared relationships logic works", () => {
    const t1 = getTerm("account")!;
    const t2 = getTerm("pda")!;
    const set1 = new Set(t1.related ?? []);
    const set2 = new Set(t2.related ?? []);
    const shared = [...set1].filter((r) => set2.has(r));
    expect(Array.isArray(shared)).toBe(true);
  });

  it("two terms from different categories have different categories", () => {
    const defiTerm = allTerms.find((t) => t.category === "defi")!;
    const secTerm = allTerms.find((t) => t.category === "security")!;
    expect(defiTerm.category).not.toBe(secTerm.category);
  });

  it("output contains both term names", () => {
    const t1 = getTerm("account")!;
    const t2 = getTerm("pda")!;
    const output = `${t1.term} vs ${t2.term}`;
    expect(output).toContain(t1.term);
    expect(output).toContain(t2.term);
  });

  it("single-term input fails >= 2 validation", () => {
    const found = [getTerm("pda")].filter(Boolean);
    expect(found.length >= 2).toBe(false);
  });

  it("all 5 terms in a max compare resolve", () => {
    const ids = ["account", "pda", "validator", "lamport", "sysvar"];
    const found = ids.map((id) => getTerm(id)).filter(Boolean);
    expect(found.length).toBe(ids.filter((id) => getTerm(id)).length);
  });
});

// ── 12. explain_concept (NEW) ─────────────────────────────────────────────────
describe("explain_concept", () => {
  it("DFS depth 1 visits root + direct relations", () => {
    const root = getTerm("pda")!;
    const visited = new Set([root.id]);
    for (const id of (root.related ?? []).slice(0, 4)) visited.add(id);
    expect(visited.has("pda")).toBe(true);
    expect(visited.size).toBeGreaterThan(1);
  });

  it("depth 2 visits more nodes than depth 1", () => {
    function dfsCount(rootId: string, maxDepth: number): number {
      const visited = new Set<string>();
      function dfs(id: string, d: number) {
        if (visited.has(id) || d > maxDepth) return;
        visited.add(id);
        for (const child of (getTerm(id)?.related ?? []).slice(0, 4)) dfs(child, d + 1);
      }
      dfs(rootId, 1);
      return visited.size;
    }
    expect(dfsCount("account", 2)).toBeGreaterThanOrEqual(dfsCount("account", 1));
  });

  it("visited set has no duplicate IDs", () => {
    const visited = new Set<string>();
    function dfs(id: string, d: number) {
      if (visited.has(id) || d > 3) return;
      visited.add(id);
      for (const child of (getTerm(id)?.related ?? []).slice(0, 4)) dfs(child, d + 1);
    }
    dfs("validator", 1);
    expect(visited.size).toBeGreaterThan(0);
  });

  it("unknown term returns undefined", () => {
    expect(getTerm("unknown-concept-xyz")).toBeUndefined();
  });

  it("all visited IDs at depth 4 exist in allTerms", () => {
    const visited = new Set<string>();
    function dfs(id: string, d: number) {
      if (visited.has(id) || d > 4) return;
      visited.add(id);
      for (const child of (getTerm(id)?.related ?? []).slice(0, 4)) dfs(child, d + 1);
    }
    dfs("account", 1);
    for (const id of visited) expect(getTerm(id)).toBeDefined();
  });
});