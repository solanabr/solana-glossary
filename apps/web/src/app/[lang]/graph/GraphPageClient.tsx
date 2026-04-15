"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import TermRelationGraph, {
  defaultGraphFocusId,
} from "@/components/TermRelationGraph";
import {
  getTerms,
  UI_LABELS,
  type GlossaryTerm,
  type Locale,
} from "@/lib/glossary";
import { graphPath, termPath, URL_LANGS } from "@/lib/url-lang";

export default function GraphPageClient({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const t = UI_LABELS[locale];
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [depth, setDepth] = useState<1 | 2>(2);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    getTerms(locale)
      .then((data) => {
        if (!cancelled) {
          setTerms(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTerms([]);
          setLoading(false);
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const focusId = useMemo(() => {
    if (terms.length === 0) return "";
    if (idParam && terms.some((x) => x.id === idParam)) return idParam;
    return defaultGraphFocusId(terms);
  }, [terms, idParam]);

  const graphLabels = useMemo(
    () => ({
      title: t.graph_title,
      focus: t.graph_focus,
      depth: t.graph_depth,
      depth1: t.graph_depth1,
      depth2: t.graph_depth2,
      searchPlaceholder: t.graph_search_placeholder,
      loading: t.loading,
      resetView: t.graph_reset_view,
      zoomIn: t.graph_zoom_in,
      zoomOut: t.graph_zoom_out,
      categoriesLabel: t.categories,
      relatedLabel: t.related,
    }),
    [t],
  );

  return (
    <div className="min-h-screen app-surface sm:flex sm:h-[100dvh] sm:flex-col sm:overflow-hidden">
      <header className="shrink-0 border-b border-sol-line bg-sol-darker/90 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-5xl flex-wrap items-center justify-between gap-2 px-3 sm:h-14 sm:gap-3 sm:px-6">
          <Link
            href="/"
            className="text-[13px] text-sol-subtle hover:text-sol-text font-medium"
          >
            ← {t.term_back}
          </Link>
          <nav className="flex items-center gap-2 text-[12px] flex-wrap justify-end">
            {focusId ? (
              <Link
                href={termPath(locale, focusId)}
                className="text-sol-subtle hover:text-sol-text"
              >
                {t.label_term}
              </Link>
            ) : (
              <span className="text-sol-muted">{t.label_term}</span>
            )}
            <span className="text-sol-line" aria-hidden>
              |
            </span>
            {URL_LANGS.filter((l) => l !== locale).map((l) => (
              <Link
                key={l}
                href={graphPath(l, idParam ?? undefined)}
                className="text-sol-subtle hover:text-sol-accent"
              >
                {l}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-3 py-2 sm:overflow-hidden sm:px-6 sm:py-3">
        {loadError ? (
          <p className="text-sol-subtle text-sm">{t.load_error}</p>
        ) : (
          <TermRelationGraph
            locale={locale}
            terms={terms}
            loading={loading}
            focusId={focusId}
            depth={depth}
            onDepthChange={setDepth}
            labels={graphLabels}
          />
        )}
      </main>
    </div>
  );
}
