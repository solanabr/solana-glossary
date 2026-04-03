import type { GlossaryTerm } from "./types";
import { allTerms } from "./index";

type LocaleOverride = Record<string, { term?: string; definition?: string }>;

/**
 * Returns all glossary terms with locale-specific overrides applied.
 * Falls back to English for any term without a translation.
 *
 * @param locale - Locale code, e.g. "pt", "es", "zh"
 */
export function getLocalizedTerms(locale: string): GlossaryTerm[] {
  let overrides: LocaleOverride = {};
  try {
    // Dynamic require — locale files live in data/i18n/<locale>.json
    overrides = require(`../data/i18n/${locale}.json`);
  } catch {
    // No locale file found — return English (default)
    return allTerms;
  }

  return allTerms.map((t) => {
    const o = overrides[t.id];
    if (!o) return t;
    return {
      ...t,
      term: o.term ?? t.term,
      definition: o.definition ?? t.definition,
    };
  });
}
