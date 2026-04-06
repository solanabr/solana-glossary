"use client";

import { useState, useMemo, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import type { GlossaryTerm } from "@/lib/glossary-client";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";

const ITEMS_PER_PAGE = 36;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LocaleData {
  en: GlossaryTerm[];
  pt: GlossaryTerm[];
  es: GlossaryTerm[];
}

interface GlossaryClientProps {
  localeData: LocaleData;
  categories: string[];
  categoryLabels: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

type LocaleCode = "en" | "pt" | "es";

function subscribeLocale(callback: () => void) {
  window.addEventListener("locale-change", callback);
  return () => window.removeEventListener("locale-change", callback);
}

function getLocaleSnapshot(): LocaleCode {
  const saved = localStorage.getItem("solana-wtf-locale");
  return saved && ["en", "pt", "es"].includes(saved) ? (saved as LocaleCode) : "en";
}

function getLocaleServerSnapshot(): LocaleCode {
  return "en";
}

/** Deterministic color for each category (cycles through accent colors). */
const CATEGORY_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  "ai-ml":                     { border: "rgba(0,255,255,0.35)",    text: "#00FFFF", bg: "rgba(0,255,255,0.08)" },
  "blockchain-general":        { border: "rgba(189,0,255,0.35)",    text: "#BD00FF", bg: "rgba(189,0,255,0.08)" },
  "core-protocol":             { border: "rgba(20,241,149,0.35)",   text: "#14f195", bg: "rgba(20,241,149,0.08)" },
  defi:                        { border: "rgba(255,0,63,0.35)",     text: "#FF003F", bg: "rgba(255,0,63,0.08)" },
  "dev-tools":                 { border: "rgba(0,255,255,0.35)",    text: "#00FFFF", bg: "rgba(0,255,255,0.08)" },
  infrastructure:              { border: "rgba(0,255,255,0.35)",    text: "#00FFFF", bg: "rgba(0,255,255,0.08)" },
  network:                     { border: "rgba(20,241,149,0.35)",   text: "#14f195", bg: "rgba(20,241,149,0.08)" },
  "programming-fundamentals":  { border: "rgba(189,0,255,0.35)",    text: "#BD00FF", bg: "rgba(189,0,255,0.08)" },
  "programming-model":         { border: "rgba(0,255,255,0.35)",    text: "#00FFFF", bg: "rgba(0,255,255,0.08)" },
  security:                    { border: "rgba(255,0,63,0.35)",     text: "#FF003F", bg: "rgba(255,0,63,0.08)" },
  "solana-ecosystem":          { border: "rgba(20,241,149,0.35)",   text: "#14f195", bg: "rgba(20,241,149,0.08)" },
  "token-ecosystem":           { border: "rgba(0,255,255,0.35)",    text: "#00FFFF", bg: "rgba(0,255,255,0.08)" },
  web3:                        { border: "rgba(189,0,255,0.35)",    text: "#BD00FF", bg: "rgba(189,0,255,0.08)" },
  "zk-compression":            { border: "rgba(189,0,255,0.35)",    text: "#BD00FF", bg: "rgba(189,0,255,0.08)" },
};

const DEFAULT_CAT_COLOR = { border: "rgba(189,0,255,0.35)", text: "#BD00FF", bg: "rgba(189,0,255,0.08)" };

function catColor(category: string) {
  return CATEGORY_COLORS[category] ?? DEFAULT_CAT_COLOR;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-muted flex-shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function LinkArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Term Card                                                          */
/* ------------------------------------------------------------------ */

function TermCard({
  term,
  categoryLabel,
}: {
  term: GlossaryTerm;
  categoryLabel: string;
}) {
  const colors = catColor(term.category);
  const truncatedDef =
    term.definition.length > 120
      ? term.definition.slice(0, 120).trimEnd() + "..."
      : term.definition;

  const relatedCount = term.related?.length ?? 0;

  return (
    <Link href={`/glossary/${term.id}`} className="block group outline-none">
      <div className="glow-card p-5 h-full flex flex-col">
        {/* Header: term name + arrow */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-text-primary font-semibold text-[15px] leading-snug group-hover:text-[var(--cyber-cyan)] transition-colors duration-150"
            style={{ fontFamily: "var(--font-label)" }}>
            {term.term}
          </h3>
          <LinkArrowIcon />
        </div>

        {/* Category badge */}
        <div className="mb-3">
          <span
            className="pixel-badge inline-block"
            style={{
              borderColor: colors.border,
              color: colors.text,
              background: colors.bg,
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Definition excerpt */}
        <p className="text-text-secondary text-[13px] leading-relaxed flex-1 mb-3"
          style={{ fontFamily: "var(--font-mono)" }}>
          {truncatedDef}
        </p>

        {/* Footer meta */}
        <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          {relatedCount > 0 && (
            <span className="text-text-muted text-[11px] flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {relatedCount} related
            </span>
          )}
          {term.aliases && term.aliases.length > 0 && (
            <span className="text-text-muted text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
              aka: {term.aliases.slice(0, 2).join(", ")}
              {term.aliases.length > 2 ? "..." : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Client Component                                              */
/* ------------------------------------------------------------------ */

export default function GlossaryClient({
  localeData,
  categories,
  categoryLabels,
}: GlossaryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleServerSnapshot);
  const [page, setPage] = useState(1);

  /* Reset page when locale changes */
  const [prevLocale, setPrevLocale] = useState(locale);
  if (prevLocale !== locale) {
    setPrevLocale(locale);
    setPage(1);
  }

  /* Current terms for the active locale */
  const allTerms = localeData[locale];

  /* Client-side search + filter */
  const filteredTerms = useMemo(() => {
    let results = allTerms;

    /* Category filter */
    if (activeCategory) {
      results = results.filter((t) => t.category === activeCategory);
    }

    /* Search filter */
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          (t.aliases?.some((a) => a.toLowerCase().includes(q)) ?? false)
      );
    }

    return results;
  }, [allTerms, activeCategory, searchQuery]);

  /* Category counts (relative to search, not filter) */
  const categoryCounts = useMemo(() => {
    let base = allTerms;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          (t.aliases?.some((a) => a.toLowerCase().includes(q)) ?? false)
      );
    }
    const counts: Record<string, number> = {};
    for (const t of base) {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    }
    return counts;
  }, [allTerms, searchQuery]);

  const handleCategoryClick = useCallback(
    (cat: string) => {
      setActiveCategory((prev) => (prev === cat ? null : cat));
      setPage(1);
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setPage(1);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--bg-0)" }}
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="orb animate-pulse-glow"
          style={{
            width: 600,
            height: 600,
            background: "var(--cyber-cyan)",
            top: -200,
            left: "10%",
          }}
        />
        <div
          className="orb animate-pulse-glow"
          style={{
            width: 450,
            height: 450,
            background: "var(--cyber-magenta)",
            top: -80,
            right: "15%",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="orb animate-pulse-glow"
          style={{
            width: 300,
            height: 300,
            background: "var(--cyber-cyan)",
            bottom: "10%",
            left: "50%",
            animationDelay: "2.5s",
          }}
        />
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  Nav                                                        */}
      {/* ---------------------------------------------------------- */}
      <CyberNav active="glossary" />

      {/* ---------------------------------------------------------- */}
      {/*  Page Header                                                */}
      {/* ---------------------------------------------------------- */}
      <section className="relative z-10 px-4 sm:px-8 pt-6 pb-2 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "var(--font-title)" }}>
              <span className="gradient-text">Glossary</span>
            </h1>
            <p className="text-text-secondary text-sm max-w-lg"
              style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
              Every Solana term, protocol, and concept -- explained without the BS.
              Search, filter, and actually learn something.
            </p>
          </div>
          <div className="hidden sm:block">
            <span
              className="pixel-badge"
              style={{ borderColor: "var(--cyber-cyan)", color: "var(--cyber-cyan)" }}
            >
              {allTerms.length} TERMS
            </span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Search Bar                                                 */}
      {/* ---------------------------------------------------------- */}
      <section className="relative z-10 px-4 sm:px-8 pb-4 max-w-7xl mx-auto">
        <div className="search-glow flex items-center gap-3 px-5 py-3.5">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search terms, definitions, aliases..."
            className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted/60"
            style={{ fontFamily: "var(--font-mono)" }}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="text-text-muted hover:text-text-primary transition-colors duration-150 p-1"
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Category Pills                                             */}
      {/* ---------------------------------------------------------- */}
      <section className="relative z-10 px-4 sm:px-8 pb-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-2.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`category-pill flex items-center gap-2 ${
                  isActive ? "active" : ""
                }`}
              >
                <span>{categoryLabels[cat] ?? cat}</span>
                <span
                  className="text-[10px] opacity-60"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {count}
                </span>
              </button>
            );
          })}
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="category-pill flex items-center gap-1.5"
              style={{ borderColor: "var(--cyber-magenta)", color: "var(--cyber-magenta)" }}
            >
              <ClearIcon />
              <span>Clear</span>
            </button>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Results Count                                              */}
      {/* ---------------------------------------------------------- */}
      <section className="relative z-10 px-4 sm:px-8 pb-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 text-xs text-text-muted" style={{ fontFamily: "var(--font-mono)" }}>
          <span>
            Showing{" "}
            <span className="font-semibold" style={{ color: "var(--cyber-cyan)" }}>
              {filteredTerms.length}
            </span>{" "}
            {filteredTerms.length === 1 ? "term" : "terms"}
          </span>
          {activeCategory && (
            <>
              <span className="w-px h-3" style={{ background: "var(--border)" }} />
              <span>
                in{" "}
                <span className="font-semibold" style={{ color: "var(--cyber-magenta)" }}>
                  {categoryLabels[activeCategory] ?? activeCategory}
                </span>
              </span>
            </>
          )}
          {searchQuery.trim() && (
            <>
              <span className="w-px h-3" style={{ background: "var(--border)" }} />
              <span>
                matching{" "}
                <span
                  className="font-semibold"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--cyber-cyan)" }}
                >
                  &quot;{searchQuery}&quot;
                </span>
              </span>
            </>
          )}
          {locale !== "en" && (
            <>
              <span className="w-px h-3" style={{ background: "var(--border)" }} />
              <span>
                locale:{" "}
                <span className="font-semibold uppercase" style={{ color: "var(--cyber-magenta)" }}>
                  {locale}
                </span>
              </span>
            </>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Term Cards Grid (paginated)                                */}
      {/* ---------------------------------------------------------- */}
      <section className="relative z-10 px-4 sm:px-8 pb-20 max-w-7xl mx-auto">
        {filteredTerms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTerms.slice(0, page * ITEMS_PER_PAGE).map((term) => (
                <TermCard
                  key={term.id}
                  term={term}
                  categoryLabel={categoryLabels[term.category] ?? term.category}
                />
              ))}
            </div>

            {/* Pagination controls */}
            {filteredTerms.length > page * ITEMS_PER_PAGE && (
              <div className="flex flex-col items-center gap-3 mt-10">
                <p
                  className="text-text-muted text-xs"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Showing{" "}
                  <span style={{ color: "var(--cyber-cyan)" }}>
                    {Math.min(page * ITEMS_PER_PAGE, filteredTerms.length)}
                  </span>{" "}
                  of {filteredTerms.length} terms
                </p>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="neon-btn"
                  style={{ padding: "8px 32px", fontSize: 13 }}
                >
                  <span>Load more</span>
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">
              {searchQuery ? "🔍" : "📭"}
            </div>
            <h3 className="text-text-primary font-semibold text-lg mb-2"
              style={{ fontFamily: "var(--font-title)" }}>
              {searchQuery ? "No terms found" : "No terms in this category"}
            </h3>
            <p className="text-text-secondary text-sm max-w-sm mb-6"
              style={{ fontFamily: "var(--font-mono)" }}>
              {searchQuery
                ? `Nothing matches "${searchQuery}". Try a different search or clear the filters.`
                : "Try selecting a different category or clearing the filter."}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory(null);
              }}
              className="neon-btn text-sm py-2.5 px-6"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Footer                                                     */}
      {/* ---------------------------------------------------------- */}
      <CyberFooter />
    </div>
  );
}
