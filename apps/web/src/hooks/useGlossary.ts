import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  getCategories,
  type GlossaryTerm,
  type Category,
} from "@stbr/solana-glossary";
import {
  getLocalizedTerms,
  localizeTerm,
  type GlossaryLocale,
} from "@/lib/glossary-i18n";

export function useGlossary() {
  const { locale, localeDataVersion } = useI18n();

  const glossaryLocale = locale as GlossaryLocale;

  // localeDataVersion is a dep so the list recomputes when lazily-loaded
  // translation data arrives for the current locale.
  const localizedAllTerms = useMemo(
    () => getLocalizedTerms(glossaryLocale),
    [glossaryLocale, localeDataVersion],
  );

  const termMap = useMemo(
    () => new Map(localizedAllTerms.map((term) => [term.id, term])),
    [localizedAllTerms],
  );

  const getAllTerms = () => localizedAllTerms;

  const getTermsByCategory = (category: Category) =>
    localizedAllTerms.filter((term) => term.category === category);

  const getTerm = (id: string) => termMap.get(id);

  const getRelatedTerms = (id: string): GlossaryTerm[] => {
    const term = termMap.get(id);
    if (!term) return [];
    return (term.related ?? [])
      .map((relatedId) => termMap.get(relatedId))
      .filter(Boolean) as GlossaryTerm[];
  };

  const searchTerms = (query: string): GlossaryTerm[] => {
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

  return {
    allTerms: localizedAllTerms,
    getAllTerms,
    getTermsByCategory,
    getTerm,
    getRelatedTerms,
    searchTerms,
    getCategories,
    localizeTerm: (term: GlossaryTerm) => localizeTerm(term, glossaryLocale),
  };
}
