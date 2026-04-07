import { describe, expect, it } from "vitest";

import {
  detectConceptsInCode,
  detectConceptsInText,
  detectDebugTerms,
  detectPlannerTerms,
  resolveTermHint,
} from "@/lib/copilot/concept-detector";

import { CODE_SAMPLES } from "../../fixtures/code-samples";

function ids(terms: Array<{ id: string }>) {
  return terms.map((term) => term.id);
}

describe("concept-detector", () => {
  describe("detectConceptsInCode", () => {
    it("detects anchor primitives from Anchor account syntax", () => {
      const detected = ids(detectConceptsInCode(CODE_SAMPLES.anchorBasic));
      expect(detected).toContain("anchor");
      expect(detected).toContain("account");
      expect(detected).toContain("instruction");
      expect(detected).toContain("program");
      expect(detected).toContain("signer");
    });

    it("detects PDA-related terms from find_program_address usage", () => {
      const detected = ids(detectConceptsInCode(CODE_SAMPLES.pdaDerivation));
      expect(detected).toContain("pda");
      expect(detected).toContain("seeds");
      expect(detected).toContain("bump");
    });

    it("detects CPI-oriented terms from a CPI snippet", () => {
      const detected = ids(detectConceptsInCode(CODE_SAMPLES.cpiExample));
      expect(detected).toContain("cpi");
      expect(detected).toContain("program");
    });

    it("returns no concepts for empty input", () => {
      expect(detectConceptsInCode("")).toEqual([]);
    });

    it("does not return duplicate term ids", () => {
      const duplicated = `${CODE_SAMPLES.anchorBasic}\n${CODE_SAMPLES.anchorBasic}`;
      const detected = ids(detectConceptsInCode(duplicated));
      expect(new Set(detected).size).toBe(detected.length);
    });

    it("handles code with regex characters safely", () => {
      expect(() => detectConceptsInCode("let x = /.*+?^$/;")).not.toThrow();
    });
  });

  describe("detectConceptsInText", () => {
    it("detects glossary concepts from natural language", () => {
      const detected = ids(
        detectConceptsInText("I want to create a PDA that stores user data with rent exemption."),
      );
      expect(detected).toContain("pda");
      expect(detected).toContain("rent");
    });

    it("is case-insensitive", () => {
      const lower = ids(detectConceptsInText("anchor framework program"));
      const upper = ids(detectConceptsInText("ANCHOR FRAMEWORK PROGRAM"));
      expect(lower.sort()).toEqual(upper.sort());
    });
  });

  describe("detectDebugTerms", () => {
    it("detects PDA and seeds signals from constraint failures", () => {
      const detected = ids(
        detectDebugTerms("ConstraintSeeds failed because provided seeds do not result in a valid address."),
      );
      expect(detected).toContain("pda");
      expect(detected).toContain("seeds");
    });
  });

  describe("detectPlannerTerms", () => {
    it("expands a DeFi goal into a broader learning cluster", () => {
      const detected = ids(detectPlannerTerms("I want to build a Solana DeFi app with swaps."));
      expect(detected).toContain("amm");
      expect(detected).toContain("liquidity-pool");
      expect(detected).toContain("swap");
    });
  });

  describe("resolveTermHint", () => {
    it("resolves by id, title, and alias", () => {
      expect(resolveTermHint("pda", "en")?.id).toBe("pda");
      expect(resolveTermHint("Program Derived Address (PDA)", "en")?.id).toBe("pda");
      expect(resolveTermHint("TX", "en")?.id).toBe("transaction");
    });
  });
});
