import type { GlossaryTerm } from "./types";
import { allTerms } from "./index";

import ptOverrides from "../data/i18n/pt.json";
import esOverrides from "../data/i18n/es.json";

type LocaleOverride = Record<string, { term?: string; definition?: string }>;

/**
 * Locale code → override table. Statically imported (mirroring how index.ts
 * imports the term JSON) so the bundler inlines the data into the built output.
 * This is browser-safe and works in the published package without runtime
 * filesystem access. Add a locale by importing its file and registering it
 * here; any unregistered locale falls back to English.
 */
const localeOverrides: Record<string, LocaleOverride> = {
  pt: ptOverrides as LocaleOverride,
  es: esOverrides as LocaleOverride,
};

/**
 * Returns all glossary terms with locale-specific overrides applied.
 * Falls back to English for any term without a translation, and for any
 * unsupported locale.
 *
 * @param locale - Locale code, e.g. "pt", "es", "zh"
 */
export function getLocalizedTerms(locale: string): GlossaryTerm[] {
  const overrides = localeOverrides[locale];
  if (!overrides) {
    // Unsupported locale — return English (default)
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
