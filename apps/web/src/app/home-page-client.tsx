"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Fuse from "fuse.js";

import {
  clearCache,
  getTerms,
  getCategories,
  filterByCategories,
  UI_LABELS,
  formatUi,
  type GlossaryTerm,
  type Locale,
} from "@/lib/glossary";

import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import TermCard from "@/components/TermCard";
import LanguageSelector from "@/components/LanguageSelector";
import SolanaMark from "@/components/SolanaMark";
import HeroTitle from "@/components/HeroTitle";
import LearnPathModal from "@/components/LearnPathModal";
import { IconCli, IconMcp, IconVsCode } from "@/components/PlatformIcons";
import { selectPathTerms } from "@/lib/learn-path-ui";
import type { HomePlatformNavProps } from "@/lib/nav-platform-flags";
import { graphPath, termPath } from "@/lib/url-lang";
import { useHomeUrlSync } from "@/hooks/useHomeUrlSync";
import { getRecentTermIds } from "@/lib/recent-terms";

const FUSE_OPTIONS = {
  keys: [
    { name: "term", weight: 2 },
    { name: "definition", weight: 1 },
    { name: "category", weight: 0.5 },
  ],
  threshold: 0.32,
  minMatchCharLength: 2,
  ignoreLocation: true,
  findAllMatches: false,
  includeScore: false,
};

const PAGE_SIZE = 48;

const PAGE_COLUMN = "max-w-[min(100%,84rem)] mx-auto w-full px-4 sm:px-6";

const MODE_CARD_CLASS = `
  group flex w-full min-h-0 flex-col gap-1 rounded-xl border border-sol-line/70 bg-sol-surface/45 p-3 text-left
  shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-all duration-200
  hover:border-sol-accent/30 hover:bg-sol-surface-elevated/70 hover:shadow-[0_12px_40px_-20px_rgba(153,69,255,0.25)]
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,69,255,0.55)]
  focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506] active:scale-[0.99]
  sm:rounded-2xl sm:p-4 lg:h-full lg:justify-center lg:gap-1 lg:p-2.5 xl:p-3 xl:gap-1.5
`;

export default function HomePageClient({
  showNavMcp,
  showNavCli,
  showNavVsCode,
  vscodeExtensionUrl,
}: HomePlatformNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadError, setLoadError] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [recentModalOpen, setRecentModalOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const deferredQuery = useDeferredValue(query);
  const t = UI_LABELS[locale];

  const openLearn = useCallback(() => setLearnOpen(true), []);

  const closeLearn = useCallback(() => {
    setLearnOpen(false);
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("learn") === "1"
    ) {
      router.replace("/", { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("learn") === "1") {
      setLearnOpen(true);
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "sol-glossary-locale",
      ) as Locale | null;
      if (saved && ["pt-BR", "en", "es"].includes(saved)) setLocale(saved);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const categories = useMemo(() => getCategories(terms), [terms]);
  const categorySlugs = useMemo(
    () => categories.map((c) => c.slug),
    [categories],
  );

  const termCountsByCategory = useMemo(
    () =>
      terms.reduce<Record<string, number>>((acc, term) => {
        acc[term.category] = (acc[term.category] ?? 0) + 1;
        return acc;
      }, {}),
    [terms],
  );

  useHomeUrlSync({
    locale,
    loading,
    termsLength: terms.length,
    query,
    setQuery,
    selectedCategories,
    setSelectedCategories,
    validCategorySlugs: categorySlugs,
  });

  useEffect(() => {
    setRecentIds(getRecentTermIds());
  }, [locale, terms.length, loading, pathname]);

  useEffect(() => {
    if (!recentModalOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRecentModalOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [recentModalOpen]);

  const recentTermsResolved = useMemo(() => {
    const m = new Map(terms.map((x) => [x.id, x]));
    return recentIds
      .map((id) => m.get(id))
      .filter((x): x is GlossaryTerm => x != null);
  }, [recentIds, terms]);

  const recentIdSet = useMemo(() => new Set(recentIds), [recentIds]);

  const fuse = useMemo(() => new Fuse(terms, FUSE_OPTIONS), [terms]);

  const filteredTerms = useMemo(() => {
    let result: GlossaryTerm[];
    const q = deferredQuery.trim();
    if (q.length >= 2) {
      result = fuse.search(q).map((r) => r.item);
    } else {
      result = [...terms];
    }
    return filterByCategories(result, selectedCategories);
  }, [deferredQuery, terms, fuse, selectedCategories]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredQuery, selectedCategories, terms.length, locale]);

  const displayedTerms = useMemo(
    () => filteredTerms.slice(0, visibleCount),
    [filteredTerms, visibleCount],
  );

  const hasMore = filteredTerms.length > visibleCount;

  const flashHref = useMemo(
    () =>
      `/flashcards${selectedCategories.length > 0 ? `?cats=${selectedCategories.join(",")}` : ""}`,
    [selectedCategories],
  );

  const clearLabel = `${t.category_clear}`;

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  const navLinkClassDesktop = `
    flex shrink-0 items-center gap-1 rounded-lg border border-transparent px-2 py-1.5
    text-[11px] text-sol-subtle hover:border-sol-line hover:bg-sol-surface-elevated hover:text-sol-text
    transition-colors sm:gap-1.5 sm:px-2.5 sm:text-[13px]
  `;

  const navLinkClassMobile = `
    flex items-center gap-3 rounded-xl border border-sol-line/60 bg-sol-surface/50 px-4 py-3.5
    text-[15px] font-medium text-sol-text hover:border-sol-line hover:bg-sol-surface-elevated
    transition-colors active:scale-[0.99]
  `;

  const heroInlineLinkClass = `
    font-medium text-sol-accent underline decoration-sol-accent/35 underline-offset-[3px]
    hover:text-sol-text hover:decoration-sol-text/50 rounded-sm
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,69,255,0.65)]
    focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506]
  `;

  return (
    <div className="min-h-screen app-surface">
      <header
        className={`sticky top-0 border-b border-sol-line bg-sol-darker/90 backdrop-blur-md ${mobileNavOpen ? "z-[110]" : "z-40"}`}
      >
        <div
          className={`${PAGE_COLUMN} flex min-h-[3.5rem] items-center justify-between gap-2 py-1 sm:h-[3.5rem] sm:gap-4 sm:py-0`}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 rounded-md p-1 -m-1 hover:opacity-90 transition-opacity sm:gap-2.5"
              aria-label={t.brand}
            >
              <SolanaMark size={32} className="shrink-0" />
              <span className="font-display text-base font-semibold tracking-tight sm:text-lg lowercase">
                <span className="text-sol-text">glossary.</span>
                <span className="text-sol-brand-word">sol</span>
              </span>
            </Link>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-end gap-2 sm:flex">
            <button
              type="button"
              onClick={openLearn}
              className={navLinkClassDesktop}
            >
              <svg
                className="w-4 h-4 text-sol-subtle"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M12 6v6l4 2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>{t.nav_learn}</span>
            </button>

            <Link
              href={graphPath(locale)}
              className={navLinkClassDesktop}
              title={t.graph_title}
            >
              <svg
                className="w-4 h-4 text-sol-subtle"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="8" cy="8" r="3" />
                <circle cx="16" cy="10" r="2.5" />
                <circle cx="10" cy="16" r="2.5" />
                <path d="M10.5 10.5L14 11.5M11 14l3-2" strokeLinecap="round" />
              </svg>
              <span>{t.nav_graph}</span>
            </Link>

            <Link href={flashHref} className={navLinkClassDesktop}>
              <svg
                className="h-4 w-4 shrink-0 text-sol-subtle"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span className="whitespace-nowrap">{t.nav_flashcards}</span>
            </Link>
            <Link href="/match" className={navLinkClassDesktop}>
              <svg
                className="h-4 w-4 shrink-0 text-sol-subtle"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <rect x="2" y="5" width="11" height="14" rx="2" />
                <rect x="9" y="3" width="11" height="14" rx="2" />
              </svg>
              <span className="whitespace-nowrap">{t.nav_match}</span>
            </Link>
            {showNavMcp && (
              <Link href="/mcp" className={navLinkClassDesktop}>
                <IconMcp className="h-4 w-4 shrink-0 text-sol-subtle" />
                <span className="whitespace-nowrap">MCP</span>
              </Link>
            )}
            {showNavCli && (
              <Link href="/cli" className={navLinkClassDesktop}>
                <IconCli className="h-4 w-4 shrink-0 text-sol-subtle" />
                <span className="whitespace-nowrap">CLI</span>
              </Link>
            )}
            {showNavVsCode && (
              <a
                href={vscodeExtensionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={navLinkClassDesktop}
              >
                <IconVsCode className="h-4 w-4 shrink-0 text-sol-subtle" />
                <span className="whitespace-nowrap">{t.nav_vscode}</span>
              </a>
            )}

            <a
              href="https://github.com/solanabr/solana-glossary"
              target="_blank"
              rel="noopener noreferrer"
              className={navLinkClassDesktop}
            >
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="whitespace-nowrap">{t.nav_github}</span>
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 sm:pl-0">
            <LanguageSelector
              locale={locale}
              onChange={setLocale}
              activeLabel={t.lang_active}
            />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-sol-line bg-sol-surface-elevated text-sol-text hover:border-sol-line-strong sm:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav-panel"
              aria-label={mobileNavOpen ? t.nav_close_menu : t.nav_open_menu}
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              {mobileNavOpen ? (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-[100] sm:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label={t.nav_close_menu}
            onClick={closeMobileNav}
          />
          <div
            id="mobile-nav-panel"
            className="absolute bottom-0 left-0 right-0 max-h-[min(85dvh,520px)] animate-sheet-from-bottom overflow-y-auto rounded-t-2xl border border-sol-line-strong border-b-0 bg-sol-surface-elevated shadow-[0_-12px_48px_rgba(0,0,0,0.45)]"
            role="dialog"
            aria-modal="true"
            aria-label={t.nav_menu}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-sol-line bg-sol-surface-elevated px-4 py-3">
              <span className="font-display text-base font-semibold text-sol-text">
                {t.nav_menu}
              </span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-sol-line text-sol-subtle hover:text-sol-text"
                aria-label={t.nav_close_menu}
                onClick={closeMobileNav}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                className={`${navLinkClassMobile} w-full text-left`}
                onClick={() => {
                  closeMobileNav();
                  openLearn();
                }}
              >
                <svg
                  className="h-5 w-5 shrink-0 text-sol-subtle"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {t.nav_learn}
              </button>
              <Link
                href={graphPath(locale)}
                className={navLinkClassMobile}
                onClick={closeMobileNav}
              >
                <svg
                  className="h-5 w-5 shrink-0 text-sol-subtle"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <circle cx="8" cy="8" r="3" />
                  <circle cx="16" cy="10" r="2.5" />
                  <circle cx="10" cy="16" r="2.5" />
                  <path
                    d="M10.5 10.5L14 11.5M11 14l3-2"
                    strokeLinecap="round"
                  />
                </svg>
                {t.nav_graph}
              </Link>
              <Link
                href={flashHref}
                className={navLinkClassMobile}
                onClick={closeMobileNav}
              >
                <svg
                  className="h-5 w-5 shrink-0 text-sol-subtle"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                {t.nav_flashcards}
              </Link>
              <Link
                href="/match"
                className={navLinkClassMobile}
                onClick={closeMobileNav}
              >
                <svg
                  className="h-5 w-5 shrink-0 text-sol-subtle"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="2" y="5" width="11" height="14" rx="2" />
                  <rect x="9" y="3" width="11" height="14" rx="2" />
                </svg>
                {t.nav_match}
              </Link>
              {showNavMcp && (
                <Link
                  href="/mcp"
                  className={navLinkClassMobile}
                  onClick={closeMobileNav}
                >
                  <IconMcp className="h-5 w-5 shrink-0 text-sol-subtle" />
                  MCP
                </Link>
              )}
              {showNavCli && (
                <Link
                  href="/cli"
                  className={navLinkClassMobile}
                  onClick={closeMobileNav}
                >
                  <IconCli className="h-5 w-5 shrink-0 text-sol-subtle" />
                  CLI
                </Link>
              )}
              {showNavVsCode && (
                <a
                  href={vscodeExtensionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={navLinkClassMobile}
                  onClick={closeMobileNav}
                >
                  <IconVsCode className="h-5 w-5 shrink-0 text-sol-subtle" />
                  {t.nav_vscode}
                </a>
              )}
              <a
                href="https://github.com/solanabr/solana-glossary"
                target="_blank"
                rel="noopener noreferrer"
                className={navLinkClassMobile}
                onClick={closeMobileNav}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {t.nav_github}
              </a>
            </nav>
          </div>
        </div>
      )}

      <div className={`${PAGE_COLUMN} pb-16 sm:pb-20`}>
        <section
          className="relative pt-14 sm:pt-16 md:pt-20 pb-6 sm:pb-8"
          aria-labelledby="home-hero-title"
        >
          <div
            className="pointer-events-none absolute -left-24 top-8 h-[min(28rem,55vw)] w-[min(28rem,70vw)] rounded-full bg-gradient-to-br from-sol-purple/18 via-transparent to-sol-blue/10 blur-3xl motion-reduce:opacity-60"
            aria-hidden
          />
          <div className="relative grid gap-8 lg:min-h-[min(22rem,48svh)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto] lg:items-stretch lg:gap-x-8 lg:gap-y-4 xl:gap-x-10">
            <div className="flex min-h-0 min-w-0 flex-col lg:col-start-1 lg:row-start-1 lg:pr-2 xl:pr-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-sol-muted">
                {t.home_hero_kicker}
              </p>
              <HeroTitle
                locale={locale}
                id="home-hero-title"
                className="text-left mb-0"
              />
            </div>

            <div className="min-h-0 min-w-0 lg:col-start-1 lg:row-start-2 lg:pr-2 xl:pr-4">
              {loading ? (
                <p className="text-sm text-sol-muted animate-pulse">
                  {t.loading}
                </p>
              ) : (
                <p className="max-w-2xl text-pretty text-left text-[15px] leading-[1.65] text-sol-subtle sm:text-[1.0625rem] sm:leading-[1.7]">
                  {t.hero_tagline_prefix}
                  <span className="mx-0.5 inline font-display text-lg font-semibold tabular-nums text-sol-accent sm:text-xl">
                    {terms.length}
                  </span>
                  {t.hero_tagline_suffix}
                  <button
                    type="button"
                    onClick={openLearn}
                    className={heroInlineLinkClass}
                  >
                    {t.nav_learn}
                  </button>
                  {t.hero_tagline_after_learn}
                  <Link href={flashHref} className={heroInlineLinkClass}>
                    {t.nav_flashcards}
                  </Link>
                  {t.hero_tagline_after_flashcards}
                  <Link
                    href={graphPath(locale)}
                    className={heroInlineLinkClass}
                  >
                    {t.nav_graph}
                  </Link>
                  {t.hero_tagline_after_graph}
                  <Link href="/match" className={heroInlineLinkClass}>
                    {t.nav_match}
                  </Link>
                  {t.hero_tagline_before_contribute}
                  <Link
                    href="/contributing"
                    className={heroInlineLinkClass}
                    aria-label={t.nav_contribute}
                  >
                    {t.hero_contribute_inline}
                  </Link>
                  {t.hero_tagline_tail}
                </p>
              )}
            </div>

            <div className="min-h-0 min-w-0 lg:col-start-1 lg:row-start-3 lg:pr-2 xl:pr-4">
              <div className="rounded-2xl border border-sol-line/80 bg-sol-surface/35 p-4 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] backdrop-blur-md sm:p-5">
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder={t.search_placeholder}
                  resultCount={filteredTerms.length}
                  totalCount={terms.length}
                  fuzzyHint={t.fuzzy_hint}
                  clearAriaLabel={t.clear_search}
                />
              </div>
            </div>

            <aside
              className="hidden min-h-0 min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:sticky lg:top-28 lg:pl-1 xl:pl-2"
              aria-label={t.home_rail_title}
            >
              <h2 className="mb-3 shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-sol-muted lg:mb-3">
                {t.home_rail_title}
              </h2>
              <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 sm:gap-3 lg:min-h-0 lg:gap-2 xl:gap-3">
                <button
                  type="button"
                  onClick={openLearn}
                  className={MODE_CARD_CLASS}
                >
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-sol-purple/15 text-sol-accent ring-1 ring-white/5 transition-colors group-hover:bg-sol-purple/25">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M12 6v6l4 2" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </span>
                  <span className="font-display text-sm font-semibold text-sol-text">
                    {t.nav_learn}
                  </span>
                  <span className="text-[11px] leading-snug text-sol-muted">
                    {t.home_mode_learn_desc}
                  </span>
                </button>

                <Link href={graphPath(locale)} className={MODE_CARD_CLASS}>
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-sol-blue/15 text-sol-blue ring-1 ring-white/5 transition-colors group-hover:bg-sol-blue/25">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <circle cx="8" cy="8" r="3" />
                      <circle cx="16" cy="10" r="2.5" />
                      <circle cx="10" cy="16" r="2.5" />
                      <path
                        d="M10.5 10.5L14 11.5M11 14l3-2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="font-display text-sm font-semibold text-sol-text">
                    {t.nav_graph}
                  </span>
                  <span className="text-[11px] leading-snug text-sol-muted">
                    {t.home_mode_graph_desc}
                  </span>
                </Link>

                <Link href={flashHref} className={MODE_CARD_CLASS}>
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-sol-green/15 text-emerald-300/90 ring-1 ring-white/5 transition-colors group-hover:bg-sol-green/25">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                  </span>
                  <span className="font-display text-sm font-semibold text-sol-text">
                    {t.nav_flashcards}
                  </span>
                  <span className="text-[11px] leading-snug text-sol-muted">
                    {t.home_mode_flash_desc}
                  </span>
                </Link>

                <Link href="/match" className={MODE_CARD_CLASS}>
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-200/90 ring-1 ring-white/5 transition-colors group-hover:bg-amber-500/25">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <rect x="2" y="5" width="11" height="14" rx="2" />
                      <rect x="9" y="3" width="11" height="14" rx="2" />
                    </svg>
                  </span>
                  <span className="font-display text-sm font-semibold text-sol-text">
                    {t.nav_match}
                  </span>
                  <span className="text-[11px] leading-snug text-sol-muted">
                    {t.home_mode_match_desc}
                  </span>
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {loadError && (
          <div
            className="mb-6 rounded-xl border border-sol-line bg-sol-surface px-4 py-5 text-center"
            role="alert"
          >
            <p className="text-sm text-sol-subtle mb-1">{t.load_error}</p>
            <p className="mb-4 text-xs text-sol-muted">{t.load_error_hint}</p>
            <button
              type="button"
              onClick={() => {
                clearCache();
                setLoadError(false);
                setLoading(true);
                getTerms(locale)
                  .then((data) => {
                    setTerms(data);
                    setLoading(false);
                  })
                  .catch(() => {
                    setTerms([]);
                    setLoading(false);
                    setLoadError(true);
                  });
              }}
              className="text-[13px] font-medium px-4 py-2 rounded-lg border border-sol-line text-sol-text transition-colors hover:border-sol-accent/40 hover:text-sol-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,69,255,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-sol-surface"
            >
              {t.retry}
            </button>
          </div>
        )}

        {!loadError && (
          <div
            className={`mt-2 grid gap-8 lg:mt-4 lg:gap-10 xl:gap-12 ${
              !loading && categories.length > 0
                ? "lg:grid-cols-[minmax(0,15.5rem)_1fr] xl:grid-cols-[minmax(0,17rem)_1fr]"
                : "lg:grid-cols-1"
            }`}
          >
            {!loading && categories.length > 0 && (
              <aside className="hidden min-w-0 lg:block">
                <div className="sticky top-28 rounded-2xl border border-sol-line/70 bg-sol-surface/30 p-4 backdrop-blur-sm">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sol-muted">
                    {t.categories}
                  </p>
                  <CategoryFilter
                    categories={categories}
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                    termCounts={termCountsByCategory}
                    clearLabel={clearLabel}
                    emptyLabel={t.no_categories}
                    wrapMaxLines={6}
                  />
                  <footer className="mt-5 border-t border-sol-line/50 pt-4">
                    <p className="text-[11px] leading-relaxed text-sol-muted">
                      {t.home_footer_built_prefix}
                      <a
                        href="https://github.com/solanabr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t.home_footer_superteam_aria}
                        className="font-medium text-sol-subtle underline decoration-sol-line underline-offset-2 transition-colors hover:text-sol-accent hover:decoration-sol-accent/40"
                      >
                        {t.home_footer_superteam}
                      </a>
                    </p>
                  </footer>
                </div>
              </aside>
            )}
            <main className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-left text-[13px] text-sol-subtle">
                  {loading ? (
                    <span className="animate-pulse">{t.loading}</span>
                  ) : (
                    <>
                      {selectedCategories.length > 0 && (
                        <span className="text-[11px] text-sol-accent">
                          {selectedCategories.length} {t.filter_active}
                        </span>
                      )}
                      {filteredTerms.length > 0 && (
                        <span
                          className={`tabular-nums text-sol-muted ${
                            selectedCategories.length > 0 ? "ml-2" : ""
                          }`}
                        >
                          {selectedCategories.length > 0 ? "· " : ""}
                          {formatUi(t.showing_n_of_m, {
                            n: displayedTerms.length,
                            m: filteredTerms.length,
                          })}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {!loading && recentTermsResolved.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRecentModalOpen(true)}
                      className="rounded-lg border border-sol-line bg-sol-surface px-2.5 py-1.5 text-[12px] font-medium text-sol-subtle transition-colors hover:border-sol-line-strong hover:text-sol-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,69,255,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506]"
                      aria-haspopup="dialog"
                      aria-expanded={recentModalOpen}
                      aria-label={t.home_recent_open_aria}
                    >
                      {t.home_recent_open}{" "}
                      <span className="tabular-nums text-sol-muted">
                        ({recentTermsResolved.length})
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex h-10 min-w-[2.75rem] items-center justify-center gap-1.5 rounded-lg border border-sol-line px-2.5 text-sol-subtle transition-colors hover:border-sol-line-strong hover:text-sol-text lg:hidden"
                    onClick={() => setMobileFiltersOpen(true)}
                    aria-expanded={mobileFiltersOpen}
                    aria-label={t.filter_button}
                  >
                    <svg
                      className="w-[18px] h-[18px] shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                    </svg>
                    {selectedCategories.length > 0 && (
                      <span className="min-w-[1.125rem] rounded-md border border-sol-line bg-sol-surface px-1 py-0.5 text-center text-[10px] font-medium tabular-nums text-sol-text">
                        {selectedCategories.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {loading && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 rounded-xl bg-sol-surface border border-sol-line animate-pulse"
                      style={{ animationDelay: `${i * 60}ms` }}
                    />
                  ))}
                </div>
              )}

              {!loading && filteredTerms.length === 0 && (
                <div className="py-20 text-center">
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sol-line bg-sol-surface text-sol-muted"
                    aria-hidden
                  >
                    <svg
                      className="h-7 w-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path
                        d="M21 21l-4.35-4.35M8 11h6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-sol-text">
                    {t.no_results}
                  </h3>
                  <p className="mx-auto mb-2 max-w-md text-sm text-sol-subtle">
                    {t.no_results_hint}
                  </p>
                  <p className="mx-auto mb-6 max-w-md text-xs text-sol-muted">
                    {t.empty_state_search_tip}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSelectedCategories([]);
                    }}
                    className="rounded-lg border border-sol-line px-4 py-2 text-[13px] font-medium text-sol-text transition-colors hover:border-sol-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,69,255,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506]"
                  >
                    {t.reset_filters}
                  </button>
                </div>
              )}

              {!loading && filteredTerms.length > 0 && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {displayedTerms.map((term, idx) => (
                      <TermCard
                        key={`${term.id}-${locale}`}
                        term={term}
                        searchQuery={query}
                        index={idx}
                        locale={locale}
                        wasRecentlyViewed={recentIdSet.has(term.id)}
                        labels={{
                          readMore: t.read_more,
                          readLess: t.read_less,
                          seeAlso: t.see_also,
                          viewOnMap: t.term_graph_link,
                          readTag: t.term_read_tag,
                        }}
                      />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        className="px-5 py-2.5 rounded-lg border border-sol-line text-[13px] font-medium text-sol-text hover:border-sol-accent/40 hover:text-sol-accent transition-colors"
                      >
                        {t.load_more}
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        )}
      </div>

      <LearnPathModal
        open={learnOpen}
        onClose={closeLearn}
        locale={locale}
        pathTerms={selectPathTerms(terms)}
        termsLoading={loading}
      />

      {recentModalOpen && recentTermsResolved.length > 0 && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recent-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={t.home_recent_close}
            onClick={() => setRecentModalOpen(false)}
          />
          <div className="relative z-[1] flex max-h-[min(70dvh,28rem)] w-full max-w-md flex-col rounded-2xl border border-sol-line bg-sol-surface-elevated shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-sol-line p-5 pb-4">
              <h2
                id="recent-modal-title"
                className="font-display text-lg font-semibold text-sol-text"
              >
                {t.home_recent_title}
              </h2>
              <button
                type="button"
                onClick={() => setRecentModalOpen(false)}
                className="rounded-lg p-1.5 text-sol-subtle hover:bg-sol-line/40 hover:text-sol-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,69,255,0.55)]"
                aria-label={t.home_recent_close}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto p-4 pt-3">
              {recentTermsResolved.map((term) => (
                <li
                  key={term.id}
                  className="border-b border-sol-line/60 last:border-0"
                >
                  <Link
                    href={termPath(locale, term.id)}
                    onClick={() => setRecentModalOpen(false)}
                    className="block truncate py-2.5 text-[14px] font-medium text-sol-accent hover:text-sol-text"
                  >
                    {term.term}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="shrink-0 border-t border-sol-line p-4">
              <button
                type="button"
                onClick={() => setRecentModalOpen(false)}
                className="w-full rounded-xl bg-sol-accent py-2.5 text-sm font-semibold text-sol-darker hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,69,255,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-sol-surface-elevated"
              >
                {t.home_recent_close}
              </button>
            </div>
          </div>
        </div>
      )}

      {mobileFiltersOpen && (
        <>
          <div
            role="presentation"
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-sol-surface-elevated border-t border-sol-line rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-base font-semibold text-sol-text">
                {t.mobile_filter_title}
              </h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-sol-subtle hover:text-sol-text p-1"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <CategoryFilter
              categories={categories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              termCounts={termCountsByCategory}
              clearLabel={clearLabel}
              emptyLabel={t.no_categories}
            />

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full py-3 rounded-lg bg-sol-accent text-sol-darker font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {formatUi(t.mobile_see_results, { n: filteredTerms.length })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
