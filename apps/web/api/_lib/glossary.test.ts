import { describe, it, expect } from "vitest";
import {
  canonicalizePrompt,
  CORPUS_VERSION,
  freeAnswer,
  relatedTermNames,
  searchRag,
} from "./glossary.js";

describe("freeAnswer — zero-LLM deterministic path", () => {
  it("resolves a natural-language question to a real definition", () => {
    const answer = freeAnswer("what is proof of history");
    expect(answer).not.toBeNull();
    expect(answer?.text).toContain("Proof of History");
    // The definition text is carried through verbatim from the SDK.
    expect(answer?.text.toLowerCase()).toContain("clock");
    expect(answer?.fromCache).toBe(false);
  });

  it("resolves an alias", () => {
    expect(freeAnswer("define AMM")?.text).toContain("AMM");
  });

  it("returns null when nothing resolves", () => {
    expect(
      freeAnswer("please tell me a bedtime story about dragons"),
    ).toBeNull();
  });
});

describe("canonicalizePrompt", () => {
  it("maps aliases and lead-ins to the canonical id", () => {
    expect(canonicalizePrompt("AMM").termId).toBe("amm");
    expect(canonicalizePrompt("what is an AMM").norm).toBe("amm");
    expect(canonicalizePrompt("explain Proof of History").termId).toBe(
      "proof-of-history",
    );
  });

  it("falls back to normalized text for non-terms", () => {
    const res = canonicalizePrompt("how does staking economics work");
    expect(res.termId).toBeUndefined();
    expect(res.norm).toBe("how does staking economics work");
  });
});

describe("searchRag", () => {
  it("ranks the exact term first and returns its id", () => {
    const rag = searchRag("proof of history", "en", 6);
    expect(rag.ids).toContain("proof-of-history");
    expect(rag.block).toContain("Proof of History");
  });

  it("respects the K cap", () => {
    const rag = searchRag("program", "en", 3);
    expect(rag.ids.length).toBeLessThanOrEqual(3);
  });

  it("returns empty for a blank query", () => {
    expect(searchRag("   ", "en").ids).toEqual([]);
  });
});

describe("relatedTermNames", () => {
  it("returns related term display names", () => {
    const names = relatedTermNames("proof-of-history");
    expect(names.length).toBeGreaterThan(0);
  });
});

describe("CORPUS_VERSION", () => {
  it("is a short stable hex fingerprint", () => {
    expect(CORPUS_VERSION).toMatch(/^[0-9a-f]{12}$/);
  });
});
