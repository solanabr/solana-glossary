import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getTerm,
  getRelatedTerms,
  getTermsByCategory,
  localizeTerm,
  CATEGORY_LABELS,
  CATEGORY_EMOJI,
} from "@/lib/glossary";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSelector } from "@/components/LocaleSelector";
import { TermCard } from "@/components/TermCard";
import { UI, type Locale } from "@/lib/i18n";
import { Suspense } from "react";
import type { Metadata } from "next";

interface Props {
  params: { id: string };
  searchParams: { locale?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const term = getTerm(decodeURIComponent(params.id));
  if (!term) return { title: "Term not found" };
  return {
    title: `${term.term} — Solana Glossary`,
    description: term.definition.slice(0, 155),
  };
}

export default function TermPage({ params, searchParams }: Props) {
  const locale = (searchParams.locale ?? "en") as Locale;
  const ui = UI[locale] ?? UI.en;
  const term = getTerm(decodeURIComponent(params.id));
  if (!term) notFound();

  const loc = localizeTerm(term, locale);
  const related = getRelatedTerms(term.id);
  const sameCategory = getTermsByCategory(term.category)
    .filter((t) => t.id !== term.id)
    .slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-base bg-base/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href={`/?locale=${locale}`} className="flex items-center gap-2 text-sm text-muted hover:text-base transition-colors">
            <span className="text-xl font-bold text-accent">◎</span>
            <span className="hidden sm:block">{ui.title}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Suspense>
              <LocaleSelector current={locale} />
            </Suspense>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Back */}
        <Link
          href={`/?locale=${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-base transition-colors mb-8"
        >
          {ui.backToSearch}
        </Link>

        {/* Term header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 rounded-full border border-base text-muted flex items-center gap-1.5">
              {CATEGORY_EMOJI[term.category]}
              {CATEGORY_LABELS[term.category][locale]}
            </span>
            {term.aliases?.map((a) => (
              <span key={a} className="text-xs px-2 py-0.5 rounded font-mono bg-accent/10 text-accent/80">
                {a}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold mb-5 leading-tight">
            {loc.term}
          </h1>

          <div className="bg-card border border-base rounded-2xl p-6">
            <p className="text-base leading-relaxed">{loc.definition}</p>
          </div>
        </div>

        {/* Meta info */}
        <div className="mb-8 flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span>🏷️</span> ID:{" "}
            <code className="font-mono bg-card border border-base px-1.5 py-0.5 rounded text-accent">
              {term.id}
            </code>
          </span>
          <span className="flex items-center gap-1.5">
            <span>{CATEGORY_EMOJI[term.category]}</span>{" "}
            {CATEGORY_LABELS[term.category][locale]}
          </span>
          {term.related && (
            <span className="flex items-center gap-1.5">
              <span>🔗</span> {term.related.length} {ui.relatedTerms.toLowerCase()}
            </span>
          )}
        </div>

        {/* Related terms */}
        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">{ui.relatedTerms}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map((r) => {
                const rl = localizeTerm(r, locale);
                return (
                  <TermCard
                    key={r.id}
                    term={r}
                    localizedName={rl.term}
                    localizedDef={rl.definition}
                    locale={locale}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* More in category */}
        {sameCategory.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">
              {CATEGORY_EMOJI[term.category]} Mais em {CATEGORY_LABELS[term.category][locale]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sameCategory.map((t) => {
                const tl = localizeTerm(t, locale);
                return (
                  <TermCard
                    key={t.id}
                    term={t}
                    localizedName={tl.term}
                    localizedDef={tl.definition}
                    locale={locale}
                  />
                );
              })}
            </div>
            <div className="mt-4">
              <Link
                href={`/?cat=${term.category}&locale=${locale}`}
                className="text-sm text-accent hover:underline"
              >
                {ui.learnMore}
              </Link>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-base py-6 text-center text-xs text-muted">
        <p>
          Built by{" "}
          <a href="https://superteam.fun/brazil" className="text-accent hover:underline">
            Superteam Brazil
          </a>{" "}
          · Powered by{" "}
          <a href="https://github.com/solanabr/solana-glossary" className="hover:underline">
            @stbr/solana-glossary
          </a>
        </p>
      </footer>
    </div>
  );
}
