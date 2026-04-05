"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { UI_LABELS, type Locale } from "@/lib/glossary";

const REPO = "https://github.com/solanabr/solana-glossary";
const CONTRIBUTING_BLOB = `${REPO}/blob/main/CONTRIBUTING.md`;

const PROSE =
  "prose prose-invert prose-sm max-w-none sm:prose-base " +
  "prose-headings:font-display prose-headings:scroll-mt-24 prose-headings:text-sol-text " +
  "prose-p:text-sol-subtle prose-li:text-sol-subtle prose-strong:text-sol-text " +
  "prose-a:text-sol-accent prose-a:no-underline hover:prose-a:underline " +
  "prose-code:rounded prose-code:bg-sol-surface-elevated prose-code:px-1 prose-code:py-0.5 prose-code:text-sol-accent prose-code:before:content-none prose-code:after:content-none " +
  "prose-pre:border prose-pre:border-sol-line prose-pre:bg-sol-darker prose-pre:text-sol-subtle " +
  "prose-th:border prose-th:border-sol-line prose-th:bg-sol-surface-elevated prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-sol-text " +
  "prose-td:border prose-td:border-sol-line prose-td:px-3 prose-td:py-2 prose-td:text-sol-subtle " +
  "prose-hr:border-sol-line";

export default function ContributingGuideClient({
  markdown,
}: {
  markdown: string;
}) {
  const [locale, setLocale] = useState<Locale>("pt-BR");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "sol-glossary-locale",
      ) as Locale | null;
      if (saved && ["pt-BR", "en", "es"].includes(saved)) setLocale(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const langMap: Record<Locale, string> = {
      "pt-BR": "pt-BR",
      en: "en",
      es: "es",
    };
    document.documentElement.lang = langMap[locale];
  }, [locale]);

  const t = UI_LABELS[locale];

  return (
    <div className="min-h-screen app-surface">
      <header className="border-b border-sol-line bg-sol-darker/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="text-[13px] font-medium text-sol-subtle transition-colors hover:text-sol-text"
          >
            ← {t.contribute_back}
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-[12px] font-medium text-sol-accent underline decoration-sol-accent/30 underline-offset-2 hover:decoration-sol-accent/50 sm:inline"
            >
              {t.contribute_repo}
            </a>
            <a
              href={CONTRIBUTING_BLOB}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-medium text-sol-subtle underline decoration-sol-line underline-offset-2 hover:text-sol-text"
            >
              {t.contribute_github_md}
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sol-muted">
          {t.nav_contribute}
        </p>
        <p className="mb-8 text-sm leading-relaxed text-sol-subtle">
          {t.contribute_intro}
        </p>
        <article className={PROSE}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>

        <div className="mt-10 flex flex-col gap-3 border-t border-sol-line pt-8 sm:flex-row sm:flex-wrap sm:items-center">
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-sol-accent px-4 py-2.5 text-center text-sm font-semibold text-sol-darker transition-opacity hover:opacity-90"
          >
            {t.contribute_repo}
          </a>
          <a
            href={CONTRIBUTING_BLOB}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-sol-line px-4 py-2.5 text-sm font-medium text-sol-text transition-colors hover:border-sol-line-strong"
          >
            {t.contribute_github_md}
          </a>
        </div>
      </main>
    </div>
  );
}
