"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { allTerms, getCategories } from "@stbr/solana-glossary";
import type { GlossaryTerm, Category } from "@stbr/solana-glossary";
import { useLocale } from "@/hooks/useLocale";
import { getAllTermsLocalized, searchTermsLocalized } from "@/lib/i18n";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/categories";

export default function HomePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [displayedTerms, setDisplayedTerms] =
    useState<GlossaryTerm[]>(allTerms);

  const categories = getCategories();

  const localizedTerms = useMemo(() => getAllTermsLocalized(locale), [locale]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of localizedTerms) {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    }
    return counts;
  }, [localizedTerms]);

  const applyFilters = useCallback(
    (q: string, cat: Category | null, terms: GlossaryTerm[]) => {
      let results: GlossaryTerm[];
      if (q.trim()) {
        results = searchTermsLocalized(q.trim(), locale);
      } else {
        results = terms;
      }
      if (cat) {
        results = results.filter((t) => t.category === cat);
      }
      setDisplayedTerms(results);
    },
    [locale],
  );

  useEffect(() => {
    applyFilters(query, selectedCategory, localizedTerms);
  }, [query, selectedCategory, localizedTerms, applyFilters]);

  function handleRandom() {
    const term =
      localizedTerms[Math.floor(Math.random() * localizedTerms.length)];
    router.push(`/termo/${term.id}?lang=${locale}`);
  }

  return (
    <main className="flex-1 w-full">
      {/* Header */}
      <header className="w-full border-b border-white/8 py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 tracking-tight">
            <span className="gradient-text">Glossário Solana</span>
          </h1>
          <p className="text-[#A0A0B0] text-base sm:text-lg">
            1001 termos · 14 categorias · PT · ES
          </p>
          <div className="mt-5">
            <Link
              href="/grafo"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: "linear-gradient(135deg, #9945FF22, #14F19522)",
                border: "1px solid rgba(153,69,255,0.3)",
                color: "#14F195",
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="5" cy="12" r="2" />
                <circle cx="19" cy="5" r="2" />
                <circle cx="19" cy="19" r="2" />
                <path strokeLinecap="round" d="M7 11.5l10-5M7 12.5l10 5" />
              </svg>
              Explorar Grafo de Conhecimento
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Search + random */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <svg
                className="h-5 w-5 text-[#A0A0B0]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar termos, definições, aliases..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl bg-[#1A1A24] border border-white/8 py-4 pl-12 pr-4 text-white placeholder-[#A0A0B0] text-base focus:outline-none focus:border-[#9945FF] transition-colors"
            />
          </div>
          {/* Random term button — gradient border via wrapper */}
          <div
            className="rounded-xl shrink-0"
            style={{
              background: "linear-gradient(135deg, #9945FF, #14F195)",
              padding: "1px",
            }}
          >
            <button
              onClick={handleRandom}
              className="h-full w-full rounded-[11px] px-5 py-3 sm:py-0 text-sm font-medium transition-colors hover:opacity-90"
              style={{ background: "#0F0F13" }}
            >
              <span>🎲 </span>
              <span className="gradient-text">Termo aleatório</span>
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "gradient-solana text-black"
                : "bg-[#1A1A24] text-[#A0A0B0] hover:text-white border border-white/8"
            }`}
          >
            Todos ({localizedTerms.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
              style={
                selectedCategory === cat
                  ? {
                      background: CATEGORY_COLORS[cat] ?? "#9945FF",
                      color: "#000",
                    }
                  : {}
              }
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? ""
                  : "bg-[#1A1A24] text-[#A0A0B0] hover:text-white border border-white/8"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat} ({categoryCounts[cat] ?? 0})
            </button>
          ))}
        </div>

        {/* Counter */}
        <p className="text-[#A0A0B0] text-sm">
          Mostrando{" "}
          <span className="text-white font-medium">
            {displayedTerms.length}
          </span>{" "}
          de{" "}
          <span className="text-white font-medium">
            {localizedTerms.length}
          </span>{" "}
          termos
        </p>

        {/* Grid */}
        {displayedTerms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedTerms.map((term) => (
              <TermCard key={term.id} term={term} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-[#A0A0B0] text-lg">
              Nenhum termo encontrado para{" "}
              <span className="text-white">"{query}"</span>
            </p>
            <button
              onClick={() => {
                setQuery("");
                setSelectedCategory(null);
              }}
              className="text-sm text-[#9945FF] hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function TermCard({ term, locale }: { term: GlossaryTerm; locale: string }) {
  const color = CATEGORY_COLORS[term.category] ?? "#9945FF";
  return (
    <Link
      href={`/termo/${term.id}?lang=${locale}`}
      className="group relative block rounded-xl bg-[#1A1A24] border border-white/8 p-5 hover:border-[#9945FF]/40 hover:bg-[#1E1E2E] transition-all overflow-hidden"
    >
      {/* Gradient left border on hover */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "linear-gradient(180deg, #9945FF, #14F195)" }}
      />

      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-white font-semibold text-base leading-snug">
            {term.term}
          </h2>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: `${color}22`, color }}
          >
            {CATEGORY_LABELS[term.category] ?? term.category}
          </span>
        </div>

        <p className="text-[#A0A0B0] text-sm leading-relaxed">
          {term.definition.slice(0, 120)}
          {term.definition.length > 120 ? "…" : ""}
        </p>

        {term.aliases && term.aliases.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {term.aliases.slice(0, 4).map((alias) => (
              <span
                key={alias}
                className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-[#A0A0B0]"
              >
                {alias}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
