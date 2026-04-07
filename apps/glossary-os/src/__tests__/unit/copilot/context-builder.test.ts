import { describe, expect, it } from "vitest";

import { getGlossaryContext } from "@/lib/copilot";

describe("copilot context builders", () => {
  it("deduplicates candidate terms across related expansions", () => {
    const context = getGlossaryContext("account", { locale: "en" });
    const candidateIds = context.candidateTerms.map((term) => term.id);
    expect(new Set(candidateIds).size).toBe(candidateIds.length);
  });

  it("throws when the term does not exist", () => {
    expect(() => getGlossaryContext("does-not-exist", { locale: "en" })).toThrow(/was not found/i);
  });

  it("builds focused glossary context for a single term page", () => {
    const context = getGlossaryContext("pda", { locale: "en" });

    expect(context.term.id).toBe("pda");
    expect(context.contextText).toContain("Current Term");
    expect(context.contextText).toContain("Compact Context");
    expect(context.contextText).toContain("Available Glossary Terms For Linking");
    expect(context.candidateTerms.length).toBeGreaterThan(0);
  });

  it("expands glossary context with question and code terms", () => {
    const context = getGlossaryContext("pda", {
      locale: "en",
      question: "How do seeds and bump work?",
      codeSnippet: "invoke_signed(&instruction, &accounts, &[&seeds])?;",
    });

    const candidateIds = context.candidateTerms.map((term) => term.id);
    expect(candidateIds).toContain("seeds");
    expect(candidateIds).toContain("invoke-signed");
    expect(context.mode).toBe("code");
  });

  it("localizes the anchor term when a non-English locale is used", () => {
    const context = getGlossaryContext("pda", { locale: "pt" });
    expect(context.term.term).toContain("Endereço Derivado");
  });
});
