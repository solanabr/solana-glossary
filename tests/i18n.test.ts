import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getLocalizedTerms } from "../src/i18n";
import { allTerms } from "../src/index";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("getLocalizedTerms", () => {
  it("returns all terms for a valid locale with overrides applied", () => {
    const ptTerms = getLocalizedTerms("pt");
    expect(ptTerms).toHaveLength(allTerms.length);

    // Find a term that has a pt override
    const llmTerm = ptTerms.find((t) => t.id === "llm");
    expect(llmTerm).toBeDefined();
    expect(llmTerm!.term).toContain("Modelo de Linguagem");
  });

  it("falls back to English for a nonexistent locale", () => {
    const terms = getLocalizedTerms("xx-nonexistent");
    expect(terms).toHaveLength(allTerms.length);
    // Should be identical to English allTerms
    expect(terms[0].term).toBe(allTerms[0].term);
  });

  it("preserves original when override only has term but not definition", () => {
    const ptTerms = getLocalizedTerms("pt");
    // pt has overrides for all terms, so we verify the override is applied
    const llmOriginal = allTerms.find((t) => t.id === "llm");
    const llmPt = ptTerms.find((t) => t.id === "llm");
    expect(llmPt).toBeDefined();
    // term should be overridden
    expect(llmPt!.term).not.toBe(llmOriginal!.term);
    // all other fields stay the same
    expect(llmPt!.id).toBe(llmOriginal!.id);
    expect(llmPt!.category).toBe(llmOriginal!.category);
  });

  it("returns same length as allTerms for es locale", () => {
    const esTerms = getLocalizedTerms("es");
    expect(esTerms).toHaveLength(allTerms.length);
  });

  describe("partial overrides", () => {
    const testLocalePath = join(__dirname, "..", "data", "i18n", "test.json");

    beforeAll(() => {
      // Create a test locale with partial overrides:
      // - "pda" has only term (no definition)
      // - "cpi" has only definition (no term)
      // - other terms have no override at all (tests the !o branch)
      const partial: Record<string, { term?: string; definition?: string }> = {
        pda: { term: "PDA Teste" },
        cpi: { definition: "CPI definicao teste" },
      };
      writeFileSync(testLocalePath, JSON.stringify(partial));
    });

    afterAll(() => {
      if (existsSync(testLocalePath)) rmSync(testLocalePath);
    });

    it("uses original definition when override has only term", () => {
      const terms = getLocalizedTerms("test");
      const pda = terms.find((t) => t.id === "pda");
      const original = allTerms.find((t) => t.id === "pda");
      expect(pda!.term).toBe("PDA Teste");
      expect(pda!.definition).toBe(original!.definition);
    });

    it("uses original term when override has only definition", () => {
      const terms = getLocalizedTerms("test");
      const cpi = terms.find((t) => t.id === "cpi");
      const original = allTerms.find((t) => t.id === "cpi");
      expect(cpi!.term).toBe(original!.term);
      expect(cpi!.definition).toBe("CPI definicao teste");
    });

    it("returns original term when no override exists for it", () => {
      const terms = getLocalizedTerms("test");
      // "proof-of-history" has no entry in our test locale
      const poh = terms.find((t) => t.id === "proof-of-history");
      const original = allTerms.find((t) => t.id === "proof-of-history");
      expect(poh!.term).toBe(original!.term);
      expect(poh!.definition).toBe(original!.definition);
    });
  });
});
