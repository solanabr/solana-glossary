import { allTerms, type GlossaryTerm } from "@stbr/solana-glossary";

export type GlossaryLocale = "en" | "pt" | "es";

type TranslationMap = Record<string, { term: string; definition: string }>;

// Non-English translation data is code-split so English visitors (the default)
// never download it. Each loader resolves to a separate on-demand chunk.
const localeLoaders: Record<
  Exclude<GlossaryLocale, "en">,
  () => Promise<TranslationMap>
> = {
  pt: () =>
    import("@stbr/solana-glossary/data/i18n/pt.json").then(
      (m) => m.default as TranslationMap,
    ),
  es: () =>
    import("@stbr/solana-glossary/data/i18n/es.json").then(
      (m) => m.default as TranslationMap,
    ),
};

const translationMaps: Partial<Record<GlossaryLocale, TranslationMap>> = {};
const localizedTermsCache = new Map<GlossaryLocale, GlossaryTerm[]>();
const preloadPromises = new Map<GlossaryLocale, Promise<void>>();

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

// Fetches and caches a locale's translation data. Idempotent and dedupes
// concurrent callers; resolving it makes getLocalizedTerms return localized
// content. English is a no-op (data lives in the main bundle).
export function preloadLocale(locale: GlossaryLocale): Promise<void> {
  if (locale === "en" || translationMaps[locale]) return Promise.resolve();

  const existing = preloadPromises.get(locale);
  if (existing) return existing;

  const promise = localeLoaders[locale]()
    .then((map) => {
      translationMaps[locale] = map;
      // Drop any English-fallback list cached before the data arrived.
      localizedTermsCache.delete(locale);
    })
    .catch((err) => {
      // Allow a later retry if the chunk failed to load.
      preloadPromises.delete(locale);
      throw err;
    });

  preloadPromises.set(locale, promise);
  return promise;
}

export function getLocalizedTerms(locale: GlossaryLocale): GlossaryTerm[] {
  if (locale === "en") return allTerms;

  const cached = localizedTermsCache.get(locale);
  if (cached) return cached;

  // Data not loaded yet → fall back to English without caching, so the first
  // render after preloadLocale() resolves produces the localized list.
  if (!translationMaps[locale]) return allTerms;

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
