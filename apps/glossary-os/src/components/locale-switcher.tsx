"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { getCopy } from "@/lib/copy";
import { getLocaleLabel, SUPPORTED_LOCALES, type Locale } from "@/lib/locales";

function replaceLocaleInPath(pathname: string, search: string, locale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  const nextPath =
    segments.length === 0
      ? `/${locale}`
      : SUPPORTED_LOCALES.includes(segments[0] as Locale)
        ? `/${[locale, ...segments.slice(1)].join("/")}`
        : `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

  return search ? `${nextPath}?${search}` : nextPath;
}

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? `/${locale}`;
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const copy = getCopy(locale);

  return (
    <div className="locale-switcher" aria-label={copy.nav.languageLabel}>
      {SUPPORTED_LOCALES.map((option) => {
        const isActive = option === locale;

        return (
          <Link
            className={isActive ? "locale-pill locale-pill-active" : "locale-pill"}
            href={replaceLocaleInPath(pathname, search, option)}
            key={option}
          >
            {getLocaleLabel(option)}
          </Link>
        );
      })}
    </div>
  );
}
