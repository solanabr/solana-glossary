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

  // Ranked search: exact name/id/alias > prefix > name/alias contains >
  // id contains > definition contains. Without ranking, corpus order wins and
  // accidental substring hits (e.g. "uPDAtes" matching "pda") bury the exact
  // match. Stable sort keeps corpus order within a tier.
  const searchTerms = (query: string): GlossaryTerm[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const scored: Array<{ term: GlossaryTerm; score: number }> = [];
    for (const term of localizedAllTerms) {
      const name = term.term.toLowerCase();
      const id = term.id.toLowerCase();
      const aliases = term.aliases?.map((a) => a.toLowerCase()) ?? [];
      let score: number;
      if (name === q || id === q || aliases.includes(q)) {
        score = 0;
      } else if (
        name.startsWith(q) ||
        id.startsWith(q) ||
        aliases.some((a) => a.startsWith(q))
      ) {
        score = 1;
      } else if (name.includes(q) || aliases.some((a) => a.includes(q))) {
        score = 2;
      } else if (id.includes(q)) {
        score = 3;
      } else if (term.definition.toLowerCase().includes(q)) {
        score = 4;
      } else {
        continue;
      }
      scored.push({ term, score });
    }
    return scored.sort((a, b) => a.score - b.score).map((s) => s.term);
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
