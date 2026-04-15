import type { Locale } from "./glossary";

/** URL path segments for locales (same values as `Locale`). */
export const URL_LANGS = ["en", "pt-BR", "es"] as const;

export type UrlLang = (typeof URL_LANGS)[number];

export function isUrlLang(s: string): s is UrlLang {
  return (URL_LANGS as readonly string[]).includes(s);
}

export function localeFromUrlLang(seg: UrlLang): Locale {
  return seg;
}

export function termPath(lang: Locale, termId: string): string {
  return `/${lang}/term/${encodeURIComponent(termId)}`;
}

export function learnPath(lang: Locale): string {
  return `/${lang}/learn`;
}

export function graphPath(lang: Locale, termId?: string): string {
  const base = `/${lang}/graph`;
  if (termId) return `${base}?id=${encodeURIComponent(termId)}`;
  return base;
}

/** Flashcards route is root-level; `lang` is kept for API symmetry (locale in UI). */
export function flashcardsPath(_lang: Locale, categories?: string[]): string {
  const base = "/flashcards";
  if (!categories?.length) return base;
  return `${base}?cats=${categories.map(encodeURIComponent).join(",")}`;
}

export function matchPath(_lang: Locale): string {
  return "/match";
}

export function contributingPath(_lang: Locale): string {
  return "/contributing";
}
