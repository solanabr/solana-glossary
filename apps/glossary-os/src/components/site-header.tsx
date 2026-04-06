import { Suspense } from "react";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCopy } from "@/lib/copy";
import { getLocaleLabel, SUPPORTED_LOCALES } from "@/lib/locales";
import { withLocale } from "@/lib/routes";
import type { Locale } from "@/lib/locales";

export function SiteHeader({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const navItems = [
    { href: "", label: copy.nav.home },
    { href: "/explore", label: copy.nav.explore },
    { href: "/paths", label: copy.nav.paths },
    { href: "/learn", label: copy.nav.learn },
    { href: "/copilot", label: copy.nav.copilot },
    { href: "/about", label: copy.nav.about },
  ];

  return (
    <header className="site-header">
      <div className="site-header-row">
        <Link className="brand" href={withLocale(locale)}>
          <span className="brand-mark">OG</span>
          <span className="brand-copy">
            <strong>Glossary OS</strong>
            <span>{copy.brand.subtitle}</span>
          </span>
        </Link>

        <div className="site-header-actions">
          <nav className="site-nav" aria-label="Primary">
            {navItems.map((item) => (
              <Link className="site-nav-link" href={withLocale(locale, item.href)} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle locale={locale} />

          <Suspense
            fallback={
              <div className="locale-switcher" aria-label={copy.nav.languageLabel}>
                {SUPPORTED_LOCALES.map((option) => (
                  <Link
                    className={option === locale ? "locale-pill locale-pill-active" : "locale-pill"}
                    href={withLocale(option, "")}
                    key={option}
                  >
                    {getLocaleLabel(option)}
                  </Link>
                ))}
              </div>
            }
          >
            <LocaleSwitcher locale={locale} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
