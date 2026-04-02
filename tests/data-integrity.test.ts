import { describe, it, expect } from "vitest";
import { allTerms, getCategories } from "../src/index";
import type { Category } from "../src/types";

describe("data integrity", () => {
  it("all IDs are unique", () => {
    const ids = allTerms.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all related refs point to existing IDs", () => {
    const idSet = new Set(allTerms.map((t) => t.id));
    const dangling: string[] = [];

    for (const term of allTerms) {
      for (const ref of term.related ?? []) {
        if (!idSet.has(ref)) {
          dangling.push(`${term.id} -> ${ref}`);
        }
      }
    }

    expect(
      dangling,
      `Dangling references: ${dangling.join(", ")}`,
    ).toHaveLength(0);
  });

  it("all terms have non-empty id, term, definition, and category", () => {
    for (const t of allTerms) {
      expect(t.id, `term missing id`).toBeTruthy();
      expect(t.term, `${t.id} missing term`).toBeTruthy();
      expect(t.definition, `${t.id} missing definition`).toBeTruthy();
      expect(t.category, `${t.id} missing category`).toBeTruthy();
    }
  });

  it("all categories are valid Category values", () => {
    const validCategories = new Set<string>(getCategories());

    for (const t of allTerms) {
      expect(
        validCategories.has(t.category),
        `${t.id} has invalid category "${t.category}"`,
      ).toBe(true);
    }
  });

  it("all terms have a valid depth (integer 1-5)", () => {
    const invalid = allTerms.filter(
      (t) => !Number.isInteger(t.depth) || t.depth < 1 || t.depth > 5,
    );
    expect(
      invalid,
      `Terms with invalid depth: ${invalid.map((t) => `${t.id}:${t.depth}`).join(", ")}`,
    ).toHaveLength(0);
  });

  it("depth values are distributed across at least 4 levels", () => {
    const depths = new Set(allTerms.map((t) => t.depth));
    expect(depths.size).toBeGreaterThanOrEqual(4);
  });

  it("no term has an empty aliases array", () => {
    const emptyAliases = allTerms.filter(
      (t) => Array.isArray(t.aliases) && t.aliases.length === 0,
    );
    expect(
      emptyAliases,
      `Terms with empty aliases: ${emptyAliases.map((t) => t.id).join(", ")}`,
    ).toHaveLength(0);
  });
});
