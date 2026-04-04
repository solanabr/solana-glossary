// tests/utils/format.test.ts
import { describe, it, expect } from "vitest";
import {
  formatTermCard,
  formatCategoryName,
  escapeHtml,
} from "../../src/utils/format.js";
import type { GlossaryTerm } from "../../src/glossary/index.js";

const mockT = (key: string) => key;

const sampleTerm: GlossaryTerm = {
  id: "proof-of-history",
  term: "Proof of History (PoH)",
  definition:
    "A cryptographic clock that proves events occurred at specific moments.",
  category: "core-protocol",
  aliases: ["PoH", "poh"],
  related: ["validator", "tower-bft"],
};

describe("formatTermCard", () => {
  it("includes the term name in bold", () => {
    const card = formatTermCard(sampleTerm, mockT);
    expect(card).toContain("<b>Proof of History (PoH)</b>");
  });

  it("includes the definition", () => {
    const card = formatTermCard(sampleTerm, mockT);
    expect(card).toContain("A cryptographic clock");
  });

  it("includes aliases when present", () => {
    const card = formatTermCard(sampleTerm, mockT);
    expect(card).toContain("PoH");
  });

  it("includes related terms when present", () => {
    const card = formatTermCard(sampleTerm, mockT);
    expect(card).toContain("validator");
  });

  it("works for a term with no aliases or related", () => {
    const minimal: GlossaryTerm = {
      id: "foo",
      term: "Foo",
      definition: "Bar.",
      category: "web3",
    };
    const card = formatTermCard(minimal, mockT);
    expect(card).toContain("<b>Foo</b>");
    expect(card).not.toContain("undefined");
  });

  it("escapes HTML special characters in definition", () => {
    const term: GlossaryTerm = {
      id: "test",
      term: "Test",
      definition: "A <script> & other >danger<",
      category: "web3",
    };
    const card = formatTermCard(term, mockT);
    expect(card).not.toContain("<script>");
    expect(card).toContain("&lt;script&gt;");
  });
});

describe("formatCategoryName", () => {
  it("converts kebab-case to Title Case", () => {
    expect(formatCategoryName("core-protocol")).toBe("Core Protocol");
  });

  it("handles known acronyms correctly", () => {
    expect(formatCategoryName("zk-compression")).toBe("ZK Compression");
    expect(formatCategoryName("ai-ml")).toBe("AI ML");
    expect(formatCategoryName("defi")).toBe("DeFi");
  });
});

describe("escapeHtml", () => {
  it("escapes & < >", () => {
    expect(escapeHtml("a & b < c > d")).toBe("a &amp; b &lt; c &gt; d");
  });

  it("returns unchanged string with no special chars", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});
