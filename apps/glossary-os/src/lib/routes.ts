import type { Locale } from "./locales";

export function withLocale(locale: Locale, pathname = ""): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalizedPath === "/" ? `/${locale}` : `/${locale}${normalizedPath}`;
}
