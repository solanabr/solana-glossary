// tests/utils/search.test.ts
import { describe, it, expect } from "vitest";
import { findTermsInText, lookupTerm } from "../../src/utils/search.js";

describe("lookupTerm", () => {
  it("finds a term by exact ID", () => {
    const result = lookupTerm("proof-of-history");
    expect(result.type).toBe("found");
    if (result.type === "found") {
      expect(result.term.id).toBe("proof-of-history");
    }
  });

  it("finds a term by alias (case-insensitive)", () => {
    const result = lookupTerm("PoH");
    expect(result.type).toBe("found");
    if (result.type === "found") {
      expect(result.term.id).toBe("proof-of-history");
    }
  });

  it("returns multiple results for a broad query", () => {
    const result = lookupTerm("validator");
    expect(["found", "multiple"]).toContain(result.type);
    if (result.type === "multiple") {
      expect(result.terms.length).toBeGreaterThan(1);
      expect(result.terms.length).toBeLessThanOrEqual(5);
    }
    if (result.type === "found") {
      expect(result.term.id).toBe("validator");
    }
  });

  it("prefers exact display-name matches over weak definition matches", () => {
    const result = lookupTerm("Superteam");
    expect(result.type).toBe("found");
    if (result.type === "found") {
      expect(result.term.id).toBe("superteam");
    }
  });

  it("does not overfit generic aliases into a single result", () => {
    const result = lookupTerm("solana");
    expect(result.type).toBe("multiple");
  });

  it("returns not-found for gibberish", () => {
    const result = lookupTerm("xyzabcnonexistent123");
    expect(result.type).toBe("not-found");
  });

  it("trims whitespace from input", () => {
    const result = lookupTerm("  defi  ");
    expect(result.type).not.toBe("not-found");
  });

  it("returns not-found for empty string", () => {
    const result = lookupTerm("");
    expect(result.type).toBe("not-found");
  });

  it("finds terms in free text in source order", () => {
    const matches = findTermsInText(
      "Proof of History works with Tower BFT for fast consensus.",
    );
    expect(matches.map((term) => term.id)).toEqual([
      "proof-of-history",
      "tower-bft",
    ]);
  });

  it("deduplicates repeated mentions and supports aliases", () => {
    const matches = findTermsInText("PoH, PoH, and validator talk.");
    expect(matches.map((term) => term.id)).toEqual([
      "proof-of-history",
      "validator",
    ]);
  });

  it("handles common plural acronyms used in group chats", () => {
    const matches = findTermsInText("PDAs e CPIs aparecem muito em Solana.");
    expect(matches.map((term) => term.id)).toEqual(["pda", "cpi"]);
  });

  it("handles compact term names with digits", () => {
    const matches = findTermsInText("token2022 precisa de priority fees");
    expect(matches.map((term) => term.id)).toContain("token-2022");
  });
});
