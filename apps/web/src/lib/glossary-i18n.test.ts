import { describe, it, expect } from "vitest";
import {
  allTerms,
  getCategories,
  getTermsByCategory,
} from "@stbr/solana-glossary";
import {
  getLocalizedTerms,
  localizeTerm,
  findLocalizedTermByText,
  preloadLocale,
} from "@/lib/glossary-i18n";

// Runtime verification of the SDK rewire: tsc proves the imports resolve,
// but only running the code proves the real data flows through the relocated
// localization layer (the trickiest part of killing the vendored fork).
describe("glossary-i18n × @stbr/solana-glossary", () => {
  it("exposes the full SDK corpus in English", () => {
    expect(allTerms.length).toBeGreaterThanOrEqual(1059);
    expect(getLocalizedTerms("en")).toHaveLength(allTerms.length);
  });

  it("wires pt & es locale data from the package (definitions actually differ)", async () => {
    for (const locale of ["pt", "es"] as const) {
      // Locale data is code-split and loaded on demand; preload before asserting.
      await preloadLocale(locale);
      const localized = getLocalizedTerms(locale);
      expect(localized).toHaveLength(allTerms.length);
      const differing = localized.filter(
        (lt, i) => lt.definition !== allTerms[i].definition,
      );
      expect(differing.length).toBeGreaterThan(0);
    }
  });

  it("gained depth + tags from the real SDK (the vendored fork lacked both)", () => {
    expect(allTerms.every((t) => typeof t.depth === "number")).toBe(true);
    expect(
      allTerms.some((t) => Array.isArray(t.tags) && (t.tags?.length ?? 0) > 0),
    ).toBe(true);
  });

  it("localizeTerm is identity for en and preserves id across locales", () => {
    const sample = allTerms[0];
    expect(localizeTerm(sample, "en")).toBe(sample);
    expect(localizeTerm(sample, "pt").id).toBe(sample.id);
  });

  it("findLocalizedTermByText resolves a known term by its display name", () => {
    const sample = allTerms[0];
    expect(findLocalizedTermByText(sample.term, "en")?.id).toBe(sample.id);
  });

  it("every category resolves to at least one term via the SDK", () => {
    for (const c of getCategories()) {
      expect(getTermsByCategory(c).length).toBeGreaterThan(0);
    }
  });
});
