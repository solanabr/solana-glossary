"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getTerms,
  UI_LABELS,
  type GlossaryTerm,
  type Locale,
} from "@/lib/glossary";
import { getRecentTermIds } from "@/lib/recent-terms";
import { termPath } from "@/lib/url-lang";

/** Other recently opened terms (excludes current); reads localStorage + term list client-side. */
export function RecentTermsOnTermPage({
  locale,
  currentId,
}: {
  locale: Locale;
  currentId: string;
}) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const t = UI_LABELS[locale];

  useEffect(() => {
    let cancelled = false;
    getTerms(locale)
      .then((data) => {
        if (!cancelled) setTerms(data);
      })
      .catch(() => {
        if (!cancelled) setTerms([]);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const items = useMemo(() => {
    const ids = getRecentTermIds()
      .filter((id) => id !== currentId)
      .slice(0, 8);
    const m = new Map(terms.map((x) => [x.id, x]));
    return ids
      .map((id) => m.get(id))
      .filter((x): x is GlossaryTerm => x != null);
  }, [terms, currentId]);

  if (items.length === 0) return null;

  return (
    <div className="mt-8 border-t border-sol-line pt-6 print:hidden">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-sol-muted">
        {t.home_recent_title}
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((term) => (
          <li key={term.id}>
            <Link
              href={termPath(locale, term.id)}
              className="inline-block max-w-[min(100%,16rem)] truncate rounded-md border border-sol-line bg-sol-surface px-2.5 py-1 text-[13px] text-sol-accent transition-colors hover:border-sol-line-strong hover:text-sol-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,69,255,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506]"
            >
              {term.term}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
