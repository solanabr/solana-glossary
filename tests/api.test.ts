import { describe, it, expect } from "vitest";
import {
  getTerm,
  getTermsByCategory,
  searchTerms,
  getCategories,
  allTerms,
} from "../src/index";

describe("getTerm", () => {
  it('returns a term with id "pda"', () => {
    const term = getTerm("pda");
    expect(term).toBeDefined();
    expect(term!.id).toBe("pda");
  });

  it('resolves alias "PDA" to the pda term', () => {
    const term = getTerm("PDA");
    expect(term).toBeDefined();
    expect(term!.id).toBe("pda");
  });

  it("returns undefined for a nonexistent term", () => {
    const term = getTerm("nonexistent-xyz-term");
    expect(term).toBeUndefined();
  });
});

describe("getTermsByCategory", () => {
  it('returns a non-empty array where all items have category "core-protocol"', () => {
    const terms = getTermsByCategory("core-protocol");
    expect(terms.length).toBeGreaterThan(0);
    for (const t of terms) {
      expect(t.category).toBe("core-protocol");
    }
  });
});

describe("searchTerms", () => {
  it('finds at least one match for "proof of history"', () => {
    const results = searchTerms("proof of history");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});

describe("getCategories", () => {
  it("returns exactly 14 categories", () => {
    const categories = getCategories();
    expect(categories).toHaveLength(14);
  });
});

describe("allTerms", () => {
  it("contains exactly 1001 terms", () => {
    expect(allTerms).toHaveLength(1001);
  });
});
