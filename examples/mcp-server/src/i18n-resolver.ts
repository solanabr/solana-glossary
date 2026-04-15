/**
 * i18n Resolver
 * 
 * Wraps getLocalizedTerms with caching and provides
 * a unified way to resolve locale across all MCP tools.
 */

import {
  allTerms,
  getTerm,
  searchTerms,
  getTermsByCategory,
  type GlossaryTerm,
  type Category,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";

// Cache localized data
const localeCache = new Map<string, Map<string, GlossaryTerm>>();

function getLocalizedMap(locale: string): Map<string, GlossaryTerm> {
  if (localeCache.has(locale)) {
    return localeCache.get(locale)!;
  }
  const terms = getLocalizedTerms(locale);
  const map = new Map(terms.map((t) => [t.id, t]));
  localeCache.set(locale, map);
  return map;
}

/**
 * Get a single term, optionally localized
 */
export function resolveTermLocalized(
  idOrAlias: string,
  locale?: string
): GlossaryTerm | undefined {
  const baseTerm = getTerm(idOrAlias);
  if (!baseTerm) return undefined;
  if (!locale || locale === "en") return baseTerm;

  const map = getLocalizedMap(locale);
  return map.get(baseTerm.id) ?? baseTerm;
}

/**
 * Search terms, optionally returning localized versions
 */
export function searchTermsLocalized(
  query: string,
  locale?: string
): GlossaryTerm[] {
  // Always search in English (better coverage)
  const results = searchTerms(query);
  if (!locale || locale === "en") return results;

  const map = getLocalizedMap(locale);
  return results.map((t) => map.get(t.id) ?? t);
}

/**
 * Get terms by category, optionally localized
 */
export function getTermsByCategoryLocalized(
  category: Category,
  locale?: string
): GlossaryTerm[] {
  const results = getTermsByCategory(category);
  if (!locale || locale === "en") return results;

  const map = getLocalizedMap(locale);
  return results.map((t) => map.get(t.id) ?? t);
}

/**
 * Localize a list of terms (e.g., from graph traversal results)
 */
export function localizeTerms(
  terms: GlossaryTerm[],
  locale?: string
): GlossaryTerm[] {
  if (!locale || locale === "en") return terms;

  const map = getLocalizedMap(locale);
  return terms.map((t) => map.get(t.id) ?? t);
}

/**
 * Get available locales
 */
export function getAvailableLocales(): string[] {
  return ["en", "pt", "es"];
}

/**
 * Validate locale, fallback to "en" if invalid
 */
export function validateLocale(locale?: string): string {
  const available = getAvailableLocales();
  if (locale && available.includes(locale)) return locale;
  return "en";
}
