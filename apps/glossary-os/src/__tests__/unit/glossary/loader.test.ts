import { describe, expect, it } from "vitest";

import {
  allTerms,
  getCompactContext,
  getRelatedTerms,
  getTermById,
  getUseCases,
  searchTerms,
} from "@/lib/glossary";

describe("glossary shared utilities", () => {
  it("exposes the full glossary dataset", () => {
    expect(allTerms.length).toBeGreaterThan(1000);
  });

  it("returns localized term overrides", () => {
    expect(getTermById("pda", "pt")?.term).toContain("Endereço Derivado");
    expect(getTermById("anchor", "es")?.term).toContain("Anchor");
  });

  it("finds terms by alias and body text", () => {
    const aliasHits = searchTerms("TX", "en").map((term) => term.id);
    const bodyHits = searchTerms("no corresponding private key", "en").map((term) => term.id);

    expect(aliasHits).toContain("transaction");
    expect(bodyHits).toContain("pda");
  });

  it("resolves related terms from the dataset graph", () => {
    const pda = getTermById("pda", "en");
    expect(pda).toBeDefined();

    const related = getRelatedTerms(pda!, "en").map((term) => term.id);
    expect(related).toContain("seeds");
    expect(related).toContain("bump");
  });

  it("builds compact term context for copying into prompts", () => {
    const term = getTermById("pda", "en");
    const context = getCompactContext(term!, "en");

    expect(context).toContain("Program Derived Address");
    expect(context).toContain("Category:");
    expect(context).toContain("Related:");
  });

  it("localizes use-case navigation copy", () => {
    expect(getUseCases("pt")[0]?.title).toBe("Entender transações");
    expect(getUseCases("es")[0]?.title).toBe("Entender transacciones");
  });
});
