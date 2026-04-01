import { describe, it, expect } from "vitest";
import {
  getAllTerms,
  getTermById,
  getTermsByCategory,
  searchTerms,
  getAllCategories,
} from "../lib/glossary";

describe("glossary", () => {
  it("returns 1001 terms in EN", () => {
    expect(getAllTerms("en").length).toBe(1001);
  });
  it("finds term by id", () => {
    const term = getTermById("pda", "en");
    expect(term).toBeDefined();
    expect(term?.id).toBe("pda");
  });
  it("finds term by alias", () => {
    const term = getTermById("PDA", "en");
    expect(term?.id).toBe("pda");
  });
  it("returns terms by category", () => {
    const terms = getTermsByCategory("defi", "en");
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => t.category === "defi")).toBe(true);
  });
  it("searches terms", () => {
    const results = searchTerms("account", "en");
    expect(results.length).toBeGreaterThan(0);
  });
  it("returns 14 categories", () => {
    expect(getAllCategories()).toHaveLength(14);
  });
  it("returns localized terms in PT", () => {
    const terms = getAllTerms("pt");
    expect(terms.length).toBeGreaterThan(0);
  });
});
