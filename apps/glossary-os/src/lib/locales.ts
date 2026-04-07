export const SUPPORTED_LOCALES = ["en", "pt", "es"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function getLocaleLabel(locale: Locale): string {
  switch (locale) {
    case "pt":
      return "PT-BR";
    case "es":
      return "ES";
    default:
      return "EN";
  }
}
