import "server-only";

import type { GlossaryTerm, LocaleCode } from "./types";
import { allTerms, getTerm } from "./glossary";
import type { TranslationMap } from "./i18n";
import ptData from "@/data/i18n/pt.json";
import esData from "@/data/i18n/es.json";

const translations: Partial<Record<LocaleCode, TranslationMap>> = {
  pt: ptData as TranslationMap,
  es: esData as TranslationMap,
};

export function localizeGlossaryTerm(
  term: GlossaryTerm,
  locale: LocaleCode = "en",
): GlossaryTerm {
  if (locale === "en") return term;

  const localeData = translations[locale];
  if (!localeData) return term;

  const override = localeData[term.id];
  if (!override) return term;

  return {
    ...term,
    term: override.term,
    definition: override.definition,
  };
}

export function getLocalizedTerms(locale: LocaleCode): GlossaryTerm[] {
  return allTerms.map((term) => localizeGlossaryTerm(term, locale));
}

export function getLocalizedTerm(
  id: string,
  locale: LocaleCode,
): GlossaryTerm | undefined {
  const base = getTerm(id);
  return base ? localizeGlossaryTerm(base, locale) : undefined;
}
