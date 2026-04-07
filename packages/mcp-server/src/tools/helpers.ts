import type { LocalizedGlossaryTerm, Locale } from "../types/glossary.js";
import { getTerm } from "../glossary/loader.js";

export function normalizeLocale(value: unknown): Locale {
  return value === "pt" || value === "es" || value === "en" ? value : "en";
}

export function mapTermsForOutput(ids: string[], locale: Locale): Array<{
  id: string;
  term: string;
  definition: string;
  category: string;
}> {
  const seen = new Set<string>();
  const result: LocalizedGlossaryTerm[] = [];

  for (const id of ids) {
    const term = getTerm(id, locale);
    if (!term || seen.has(term.id)) continue;
    seen.add(term.id);
    result.push(term);
  }

  return result.map((term) => ({
    id: term.id,
    term: term.term,
    definition: term.definition,
    category: term.category,
  }));
}
