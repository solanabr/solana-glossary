import { getTerm, allTerms } from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import type { GlossaryTerm } from "@stbr/solana-glossary";

export function getTermLocalized(
  id: string,
  locale: string,
): GlossaryTerm | undefined {
  if (locale === "en") return getTerm(id);
  const localized = getLocalizedTerms(locale);
  const found = localized.find((t) => t.id === id);
  return found ?? getTerm(id);
}

export function getAllTermsLocalized(locale: string): GlossaryTerm[] {
  if (locale === "en") return allTerms;
  return getLocalizedTerms(locale);
}

export function searchTermsLocalized(
  query: string,
  locale: string,
): GlossaryTerm[] {
  const terms = getAllTermsLocalized(locale);
  const q = query.toLowerCase().trim();
  if (!q) return terms;
  return terms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.definition.toLowerCase().includes(q) ||
      (t.aliases ?? []).some((a) => a.toLowerCase().includes(q)),
  );
}
