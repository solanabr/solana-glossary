import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { GraphMapLink } from "@/components/GraphMapLink";
import { MarkTermReadOnView } from "@/components/MarkTermReadOnView";
import { RecentTermsOnTermPage } from "@/components/RecentTermsOnTermPage";
import { RecordRecentTerm } from "@/components/RecordRecentTerm";
import TermShareX from "@/components/TermShareX";
import { UI_LABELS, type Locale } from "@/lib/glossary";
import {
  getAllTermIdsSync,
  getGlossaryTermSync,
  truncateMeta,
} from "@/lib/glossary-fs";
import { getSiteUrl } from "@/lib/site-url";
import { twitterIntentTweetUrl } from "@/lib/twitter-intent";
import {
  graphPath,
  isUrlLang,
  localeFromUrlLang,
  termPath,
  URL_LANGS,
} from "@/lib/url-lang";

export const revalidate = 3600;

type Props = { params: Promise<{ lang: string; id: string }> };

export async function generateStaticParams() {
  const ids = getAllTermIdsSync();
  const out: { lang: string; id: string }[] = [];
  for (const lang of URL_LANGS) {
    for (const id of ids) {
      out.push({ lang, id });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isUrlLang(lang)) {
    return { title: "Not found", robots: { index: false } };
  }
  const locale = localeFromUrlLang(lang);
  const term = getGlossaryTermSync(id, locale);
  const base = getSiteUrl();
  const pathSeg = `/${lang}/term/${id}`;
  const canonical = `${base}${pathSeg}`;

  if (!term) {
    return { title: "Not found", robots: { index: false } };
  }

  const desc = truncateMeta(term.definition);
  const brand = UI_LABELS[locale].brand;

  return {
    title: `${term.term} — ${brand}`,
    description: desc,
    alternates: {
      canonical,
      languages: {
        en: `${base}/en/term/${id}`,
        "pt-BR": `${base}/pt-BR/term/${id}`,
        es: `${base}/es/term/${id}`,
      },
    },
    openGraph: {
      title: term.term,
      description: desc,
      url: canonical,
      type: "article",
      siteName: brand,
      locale:
        locale === "en" ? "en_US" : locale === "pt-BR" ? "pt_BR" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: term.term,
      description: desc,
    },
  };
}

function relatedTitle(id: string, locale: Locale): string {
  return getGlossaryTermSync(id, locale)?.term ?? id.replace(/-/g, " ");
}

export default async function TermPage({ params }: Props) {
  const { lang, id } = await params;
  if (!isUrlLang(lang)) notFound();
  const locale = localeFromUrlLang(lang);
  const term = getGlossaryTermSync(id, locale);
  if (!term) notFound();

  const t = UI_LABELS[locale];
  const path = termPath(locale, term.id);
  const pageUrl = `${getSiteUrl()}${path}`;
  const shareIntentUrl = twitterIntentTweetUrl(
    `${term.term} — ${t.brand}`,
    pageUrl,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: truncateMeta(term.definition, 500),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: t.brand,
      url: getSiteUrl(),
    },
  };

  return (
    <>
      <MarkTermReadOnView termId={term.id} />
      <RecordRecentTerm termId={term.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen app-surface">
        <header className="print:hidden border-b border-sol-line bg-sol-darker/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3 flex-wrap">
            <Link
              href="/"
              className="text-[13px] text-sol-subtle hover:text-sol-text font-medium"
            >
              ← {t.term_back}
            </Link>
            <nav className="flex items-center gap-3 text-[12px] flex-wrap justify-end">
              <Link
                href={`/${locale}/learn`}
                className="text-sol-subtle hover:text-sol-text"
              >
                {t.nav_learn}
              </Link>
              <span className="text-sol-line" aria-hidden>
                |
              </span>
              {URL_LANGS.filter((l) => l !== locale).map((l) => (
                <Link
                  key={l}
                  href={termPath(l, term.id)}
                  className="text-sol-subtle hover:text-sol-accent"
                >
                  {l}
                </Link>
              ))}
              <span className="text-sol-line hidden sm:inline" aria-hidden>
                |
              </span>
              <Link
                href="/flashcards"
                className="text-sol-subtle hover:text-sol-text"
              >
                {t.term_flashcards_link}
              </Link>
              <span className="text-sol-line" aria-hidden>
                |
              </span>
              <Link
                href={graphPath(locale, term.id)}
                className="text-sol-subtle hover:text-sol-accent"
              >
                {t.term_graph_link}
              </Link>
            </nav>
          </div>
        </header>

        <main className="term-print-main max-w-3xl mx-auto px-4 sm:px-6 py-10 print:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <p className="text-[11px] uppercase tracking-wider text-sol-subtle">
              {term.categoryLabel}
            </p>
            <GraphMapLink
              href={graphPath(locale, term.id)}
              label={t.term_graph_link}
            />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-sol-text mb-6 leading-tight">
            {term.term}
          </h1>
          <p className="text-sol-subtle leading-relaxed text-[15px] sm:text-base whitespace-pre-wrap">
            {term.definition}
          </p>

          {term.related && term.related.length > 0 && (
            <div className="mt-8 pt-6 border-t border-sol-line">
              <p className="text-[11px] uppercase tracking-wider text-sol-muted mb-3">
                {t.see_also}
              </p>
              <ul className="flex flex-wrap gap-2">
                {term.related.map((rid) => (
                  <li key={rid}>
                    <Link
                      href={termPath(locale, rid)}
                      className="text-sm px-2.5 py-1 rounded-md border border-sol-line bg-sol-surface text-sol-accent hover:border-sol-line-strong transition-colors"
                    >
                      {relatedTitle(rid, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RecentTermsOnTermPage locale={locale} currentId={term.id} />

          <div className="print:hidden">
            <TermShareX intentUrl={shareIntentUrl} label={t.term_share} />
          </div>

          <p className="mt-10 text-[11px] text-sol-muted print:hidden">
            <Link
              href={`/${locale}/learn`}
              className="text-sol-subtle hover:text-sol-accent underline-offset-2 hover:underline"
            >
              {t.nav_learn}: {t.learn_title}
            </Link>
          </p>
        </main>
      </div>
    </>
  );
}
