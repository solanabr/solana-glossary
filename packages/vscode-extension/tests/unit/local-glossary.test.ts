import { beforeAll, describe, expect, it } from "vitest";

import {
  detectAnchorTermFromText,
  getLocalTerm,
  getRelatedLocalTerms,
  initializeLocalGlossary,
  searchLocalGlossary,
} from "../../src/api/local-glossary";

describe("local glossary bundle", () => {
  beforeAll(async () => {
    await initializeLocalGlossary("");
  });

  it("resolves aliases like PDA", () => {
    expect(getLocalTerm("PDA")?.id).toBe("pda");
  });

  it("searches by term definition and id", () => {
    const matches = searchLocalGlossary("invoke-signed", 10);
    expect(matches.some((term) => term.id === "invoke-signed")).toBe(true);
  });

  it("returns related terms when mappings exist", () => {
    const term = getLocalTerm("account");
    expect(term).toBeDefined();
    expect(getRelatedLocalTerms(term!, 3).length).toBeGreaterThan(0);
  });

  it("detects anchor terms from mixed code and prose", () => {
    const term = detectAnchorTermFromText(
      "Explain this Anchor code with PDA seeds, bump, and invoke_signed",
      "account",
    );
    expect(["pda", "seeds", "invoke-signed", "anchor"]).toContain(term.id);
  });
});
