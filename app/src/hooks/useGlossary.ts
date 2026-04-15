import { useMemo } from "react";
import {
  allTerms,
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { useI18n } from "../lib/i18n";

type GlossaryLocale = "en" | "pt" | "es";

export function useGlossary() {
  const { locale } = useI18n();
  const glossaryLocale = locale as GlossaryLocale;

  const localizedAllTerms = useMemo(
    () => getLocalizedTerms(glossaryLocale),
    [glossaryLocale],
  );

  const termMap = useMemo(
    () => new Map(localizedAllTerms.map((term) => [term.id, term])),
    [localizedAllTerms],
  );

  const getAllTerms = () => localizedAllTerms;

  const getTermsByCategoryFn = (category: string) =>
    localizedAllTerms.filter((term) => term.category === category);

  const getTermFn = (id: string) => termMap.get(id);

  const getRelatedTerms = (id: string): GlossaryTerm[] => {
    const term = termMap.get(id);
    if (!term) return [];
    return (term.related ?? [])
      .map((relatedId) => termMap.get(relatedId))
      .filter(Boolean) as GlossaryTerm[];
  };

  const searchTermsFn = (query: string): GlossaryTerm[] => {
    if (!query.trim()) return [];
    const normalizedQuery = query.toLowerCase();
    return localizedAllTerms.filter(
      (term) =>
        term.term.toLowerCase().includes(normalizedQuery) ||
        term.definition.toLowerCase().includes(normalizedQuery) ||
        term.id.includes(normalizedQuery) ||
        term.aliases?.some((alias) =>
          alias.toLowerCase().includes(normalizedQuery),
        ),
    );
  };

  const localizeTerm = (term: GlossaryTerm): GlossaryTerm => {
    // If already localized or locale is en, return as-is
    if (glossaryLocale === "en") return term;
    // Attempt to find the localized version by id
    const localized = termMap.get(term.id);
    return localized ?? term;
  };

  return {
    allTerms: localizedAllTerms,
    getAllTerms,
    getTermsByCategory: getTermsByCategoryFn,
    getTerm: getTermFn,
    getRelatedTerms,
    searchTerms: searchTermsFn,
    getCategories,
    localizeTerm,
  };
}
