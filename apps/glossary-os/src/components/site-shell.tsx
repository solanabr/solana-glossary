import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { getCopy } from "@/lib/copy";
import type { Locale } from "@/lib/locales";

export function SiteShell({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  const copy = getCopy(locale);

  return (
    <div className="page-frame">
      <div className="page-glow page-glow-top" />
      <div className="page-glow page-glow-bottom" />
      <SiteHeader locale={locale} />
      <main className="page-shell">{children}</main>
      <footer className="site-footer">
        <p>{copy.brand.footer}</p>
      </footer>
    </div>
  );
}
