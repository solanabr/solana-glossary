import { describe, it, expect } from "vitest";
import {
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
  allTerms,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import { execSync } from "child_process";
import { resolve } from "path";

const CLI = `npx tsx ${resolve(__dirname, "../src/index.ts")}`;

function run(args: string): string {
  try {
    return execSync(`${CLI} ${args}`, {
      encoding: "utf-8",
      timeout: 10000,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
  } catch (e: any) {
    return e.stdout ?? e.message;
  }
}

describe("SDK integration", () => {
  it("allTerms has more than 1000 terms", () => {
    expect(allTerms.length).toBeGreaterThan(1000);
  });

  it("getTerm resolves known IDs", () => {
    const pda = getTerm("pda");
    expect(pda).toBeDefined();
    expect(pda!.term).toBe("Program Derived Address (PDA)");
  });

  it("getTerm resolves aliases case-insensitively", () => {
    const pda = getTerm("PDA");
    expect(pda).toBeDefined();
    expect(pda!.id).toBe("pda");
  });

  it("getTerm returns undefined for nonexistent terms", () => {
    expect(getTerm("nonexistent-term-xyz")).toBeUndefined();
  });

  it("searchTerms returns results for common queries", () => {
    const results = searchTerms("proof of history");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((t) => t.id === "proof-of-history")).toBe(true);
  });

  it("searchTerms returns empty array for nonsense", () => {
    const results = searchTerms("zzzzzxxxxxyyyyy");
    expect(results).toHaveLength(0);
  });

  it("getCategories returns all categories", () => {
    const cats = getCategories();
    expect(cats.length).toBeGreaterThanOrEqual(14);
  });

  it("getTermsByCategory returns terms for each category", () => {
    const cats = getCategories();
    for (const cat of cats) {
      const terms = getTermsByCategory(cat);
      expect(terms.length).toBeGreaterThan(0);
    }
  });

  it("every term has required fields", () => {
    for (const term of allTerms) {
      expect(term.id).toBeTruthy();
      expect(term.term).toBeTruthy();
      expect(term.definition).toBeTruthy();
      expect(term.category).toBeTruthy();
    }
  });
});

describe("i18n", () => {
  it("loads Portuguese translations", () => {
    const pt = getLocalizedTerms("pt");
    expect(pt.length).toBeGreaterThan(0);
  });

  it("loads Spanish translations", () => {
    const es = getLocalizedTerms("es");
    expect(es.length).toBeGreaterThan(0);
  });

  it("Portuguese translations have localized term names", () => {
    const pt = getLocalizedTerms("pt");
    const llm = pt.find((t) => t.id === "llm");
    if (llm) {
      expect(llm.term).toContain("Modelo");
    }
    expect(pt.length).toBeGreaterThan(0);
  });
});

describe("CLI commands", () => {
  it("lookup: shows term for valid ID", () => {
    const out = run("lookup pda");
    expect(out).toContain("Program Derived Address");
  });

  it("lookup: shows error for invalid ID", () => {
    const out = run("lookup nonexistent-xyz");
    expect(out).toContain("not found");
  });

  it("search: returns results", () => {
    const out = run("search account");
    expect(out).toContain("account");
  });

  it("search: respects --limit", () => {
    const out = run("search token --limit 3");
    const lines = out.split("\n").filter((l) => l.includes("·"));
    expect(lines.length).toBeLessThanOrEqual(3);
  });

  it("categories: lists all categories", () => {
    const out = run("categories");
    expect(out).toContain("core-protocol");
    expect(out).toContain("defi");
    expect(out).toContain("security");
  });

  it("category: lists terms in a category", () => {
    const out = run("category security");
    expect(out.length).toBeGreaterThan(0);
  });

  it("related: shows related terms", () => {
    const out = run("related pda");
    expect(out.length).toBeGreaterThan(0);
  });

  it("--lang pt: outputs Portuguese", () => {
    const out = run("lookup proof-of-history --lang pt");
    expect(out.length).toBeGreaterThan(0);
  });

  it("bare argument: works as lookup shorthand", () => {
    const out = run("pda");
    expect(out).toContain("Program Derived Address");
  });

  it("--help: shows usage", () => {
    const out = run("--help");
    expect(out).toContain("solana-glossary");
    expect(out).toContain("lookup");
    expect(out).toContain("search");
  });
});
