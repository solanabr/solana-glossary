import {
  allTerms,
  getTerm,
  getTermsByCategory as sdkGetByCategory,
  searchTerms as sdkSearch,
  getCategories,
  type GlossaryTerm,
  type Category,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";

export type { GlossaryTerm, Category };
export type Locale = "en" | "pt" | "es";

function getTerms(locale: Locale): GlossaryTerm[] {
  if (locale === "en") return allTerms;
  return getLocalizedTerms(locale === "pt" ? "pt" : "es");
}

export function getAllTerms(locale: Locale): GlossaryTerm[] {
  return getTerms(locale);
}

export function getTermById(idOrAlias: string, locale: Locale): GlossaryTerm | undefined {
  const base = getTerm(idOrAlias);
  if (!base) return undefined;
  if (locale === "en") return base;
  const localized = getTerms(locale);
  return localized.find((t) => t.id === base.id) ?? base;
}

export function getTermsByCategory(category: Category, locale: Locale): GlossaryTerm[] {
  if (locale === "en") return sdkGetByCategory(category);
  return getTerms(locale).filter((t) => t.category === category);
}

export function searchTerms(query: string, locale: Locale): GlossaryTerm[] {
  if (locale === "en") return sdkSearch(query);
  const terms = getTerms(locale);
  const q = query.toLowerCase();
  return terms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.definition.toLowerCase().includes(q) ||
      t.id.includes(q) ||
      t.aliases?.some((a) => a.toLowerCase().includes(q))
  );
}

export function getAllCategories(): Category[] {
  return getCategories();
}

export function getFeaturedTerm(category: Category, locale: Locale): GlossaryTerm {
  const terms = getTermsByCategory(category, locale);
  return terms[0];
}
