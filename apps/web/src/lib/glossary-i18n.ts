import { allTerms, type GlossaryTerm } from "@stbr/solana-glossary";
import ptTranslations from "@stbr/solana-glossary/data/i18n/pt.json";
import esTranslations from "@stbr/solana-glossary/data/i18n/es.json";

export type GlossaryLocale = "en" | "pt" | "es";

type TranslationMap = Record<string, { term: string; definition: string }>;

const translationMaps: Partial<Record<GlossaryLocale, TranslationMap>> = {
  pt: ptTranslations as TranslationMap,
  es: esTranslations as TranslationMap,
};

const localizedTermsCache = new Map<GlossaryLocale, GlossaryTerm[]>();

function normalizeGlossaryText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/^[\s"'“”‘’`]+|[\s"'“”‘’`.,:;!?]+$/g, "");
}

export function localizeTerm(
  term: GlossaryTerm,
  locale: GlossaryLocale,
): GlossaryTerm {
  if (locale === "en") return term;
  const translationMap = translationMaps[locale];
  const override = translationMap?.[term.id];

  if (!override) return term;

  return {
    ...term,
    term: override.term || term.term,
    definition: override.definition || term.definition,
  };
}

export function getLocalizedTerms(locale: GlossaryLocale): GlossaryTerm[] {
  const cached = localizedTermsCache.get(locale);
  if (cached) return cached;

  const localizedTerms = allTerms.map((term) => localizeTerm(term, locale));
  localizedTermsCache.set(locale, localizedTerms);
  return localizedTerms;
}

export function findLocalizedTermByText(
  text: string,
  locale: GlossaryLocale,
): GlossaryTerm | undefined {
  const normalizedText = normalizeGlossaryText(text);
  if (!normalizedText) return undefined;

  const matchTerm = (term: GlossaryTerm) =>
    normalizeGlossaryText(term.term) === normalizedText ||
    term.id.toLowerCase() === normalizedText ||
    term.aliases?.some(
      (alias) => normalizeGlossaryText(alias) === normalizedText,
    );

  return (
    getLocalizedTerms(locale).find(matchTerm) ||
    (locale !== "en" ? getLocalizedTerms("en").find(matchTerm) : undefined)
  );
}
