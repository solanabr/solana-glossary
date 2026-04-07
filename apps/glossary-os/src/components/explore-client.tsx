"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";

import type { Category, GlossaryTerm } from "../../../../src/types";
import { getCopy } from "@/lib/copy";
import type { Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";

type CategorySummary = {
  id: Category;
  label: string;
  shortLabel: string;
  count: number;
  description: string;
};

type ExploreClientProps = {
  activeCategory: Category | "";
  copy: ReturnType<typeof getCopy>;
  locale: Locale;
  initialQuery: string;
  terms: GlossaryTerm[];
  categories: CategorySummary[];
  suggestions: GlossaryTerm[];
};

type RankedTerm = {
  score: number;
  term: GlossaryTerm;
};

type VisibleCategorySummary = CategorySummary & {
  visibleCount: number;
};

const MAX_RESULTS = 24;

function buildRankedResults(terms: GlossaryTerm[], query: string): RankedTerm[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return terms
      .slice()
      .sort((left, right) => left.term.localeCompare(right.term))
      .map((term) => ({ score: 0, term }));
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return terms
    .map((term) => {
      const aliases = term.aliases ?? [];
      const normalizedAliases = aliases.map((alias: string) => alias.toLowerCase());
      const haystack = [
        term.term.toLowerCase(),
        term.id.toLowerCase(),
        term.definition.toLowerCase(),
        ...normalizedAliases,
      ].join(" ");

      if (!tokens.every((token) => haystack.includes(token))) {
        return null;
      }

      let score = 0;
      if (term.id.toLowerCase() === normalizedQuery) score += 120;
      if (term.term.toLowerCase() === normalizedQuery) score += 110;
      if (normalizedAliases.includes(normalizedQuery)) score += 105;
      if (term.term.toLowerCase().startsWith(normalizedQuery)) score += 60;
      if (term.id.toLowerCase().startsWith(normalizedQuery)) score += 50;
      if (normalizedAliases.some((alias: string) => alias.startsWith(normalizedQuery))) score += 45;
      if (term.term.toLowerCase().includes(normalizedQuery)) score += 30;
      if (term.id.toLowerCase().includes(normalizedQuery)) score += 22;
      if (normalizedAliases.some((alias: string) => alias.includes(normalizedQuery))) score += 18;
      if (term.definition.toLowerCase().includes(normalizedQuery)) score += 8;
      score += Math.max(0, 12 - term.term.length / 10);

      return { score, term };
    })
    .filter((entry): entry is RankedTerm => entry !== null)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.term.term.localeCompare(right.term.term);
    });
}

function summarizeVisibleCategories(
  results: GlossaryTerm[],
  categories: CategorySummary[],
): VisibleCategorySummary[] {
  const counts = new Map<Category, number>();

  for (const result of results) {
    counts.set(result.category, (counts.get(result.category) ?? 0) + 1);
  }

  return categories
    .map((category) => ({
      ...category,
      visibleCount: counts.get(category.id) ?? 0,
    }))
    .filter((category) => category.visibleCount > 0)
    .sort((left, right) => right.visibleCount - left.visibleCount);
}

export function ExploreClient({
  activeCategory,
  copy,
  locale,
  initialQuery,
  terms,
  categories,
  suggestions,
}: ExploreClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<Category | "">(activeCategory);
  const deferredQuery = useDeferredValue(query);
  const rankedResults = buildRankedResults(terms, deferredQuery);
  const filteredResults = category
    ? rankedResults.filter((entry) => entry.term.category === category)
    : rankedResults;
  const visibleResults = filteredResults.slice(0, MAX_RESULTS).map((entry) => entry.term);
  const visibleCategories = summarizeVisibleCategories(visibleResults, categories);
  const sidebarCategories: VisibleCategorySummary[] =
    visibleCategories.length > 0
      ? visibleCategories
      : categories.slice(0, 6).map((category) => ({ ...category, visibleCount: category.count }));
  const totalResults = filteredResults.length;
  const currentSearch = searchParams.toString();
  const hasActiveFilters = Boolean(deferredQuery.trim() || category);

  useEffect(() => {
    const nextParams = new URLSearchParams(currentSearch);
    const normalizedQuery = deferredQuery.trim();

    if (normalizedQuery) {
      nextParams.set("q", normalizedQuery);
    } else {
      nextParams.delete("q");
    }

    if (category) {
      nextParams.set("category", category);
    } else {
      nextParams.delete("category");
    }

    const nextSearch = nextParams.toString();
    if (nextSearch === currentSearch) {
      return;
    }

    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false });
  }, [category, currentSearch, deferredQuery, pathname, router]);

  return (
    <div className="explore-layout">
      <section className="detail-panel explore-hero">
        <div className="section-heading">
          <span className="eyebrow">{copy.explore.eyebrow}</span>
          <h1>{copy.explore.title}</h1>
          <p>{copy.explore.lead}</p>
        </div>

        <div className="explore-search-shell">
          <label className="sr-only" htmlFor="explore-search">
            {copy.explore.searchLabel}
          </label>
          <input
            autoComplete="off"
            className="search-input explore-search-input"
            id="explore-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.explore.placeholder}
            type="search"
            value={query}
          />
          {query ? (
            <button className="clear-search-button" onClick={() => setQuery("")} type="button">
              {copy.explore.clear}
            </button>
          ) : null}
        </div>

        <div className="filter-row">
          <span className="filter-label">{copy.explore.filterLabel}</span>
          <div className="pill-row">
            <button
              className={category === "" ? "filter-pill filter-pill-active" : "filter-pill"}
              onClick={() => setCategory("")}
              type="button"
            >
              {copy.explore.allCategories}
            </button>
            {categories.map((item) => (
              <button
                className={category === item.id ? "filter-pill filter-pill-active" : "filter-pill"}
                key={item.id}
                onClick={() => setCategory(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pill-row">
          <span className="pill">
            <strong>{totalResults}</strong>
            {totalResults === 1 ? copy.explore.resultSingular : copy.explore.resultPlural}
          </span>
          <span className="pill">
            <strong>{terms.length}</strong>
            {copy.common.indexedTerms}
          </span>
          {deferredQuery ? (
            <span className="pill">
              <strong>{copy.common.query}</strong>
              {deferredQuery}
            </span>
          ) : null}
          {category ? (
            <span className="pill">
              <strong>{copy.explore.filterLabel}</strong>
              {categories.find((item) => item.id === category)?.label}
            </span>
          ) : null}
        </div>
      </section>

      <div className="explore-body">
        <aside className="explore-sidebar">
          <section className="section-card sidebar-section">
            <h2>{copy.explore.visibleCategories}</h2>
            <p>{copy.explore.visibleCategoriesLead}</p>

            <div className="sidebar-stack">
              {sidebarCategories.map((category) => (
                <div className="sidebar-row" key={category.id}>
                  <div>
                    <strong>{category.label}</strong>
                    <span>{category.description}</span>
                  </div>
                  <span className="pill">
                    <strong>{category.visibleCount}</strong>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="section-card sidebar-section">
            <h2>{copy.explore.quickStarts}</h2>
            <p>{copy.explore.quickStartsLead}</p>
            <div className="pill-row">
              {suggestions.map((term) => (
                <button
                  className="search-chip"
                  key={term.id}
                  onClick={() => setQuery(term.term)}
                  type="button"
                >
                  {term.term}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="explore-results">
          {visibleResults.length > 0 ? (
            <div className="results-grid">
              {visibleResults.map((term) => (
                <article className="result-card" key={term.id}>
                  <div className="result-card-head">
                    <span className="kicker">
                      {categories.find((category) => category.id === term.category)?.label}
                    </span>
                    <span className="result-id">{term.id}</span>
                  </div>
                  <h2>{term.term}</h2>
                  <p>{term.definition}</p>
                  {(term.aliases ?? []).length > 0 ? (
                    <div className="pill-row">
                      {term.aliases?.slice(0, 3).map((alias: string) => (
                        <span className="pill" key={alias}>
                          <strong>{copy.common.alias}</strong>
                          {alias}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="link-row">
                    <Link className="text-link" href={withLocale(locale, `/term/${term.id}`)}>
                      {copy.common.openTerm}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="eyebrow">{copy.explore.noMatchesEyebrow}</span>
              <h2>{copy.explore.noMatchesTitle}</h2>
              <p>{copy.explore.noMatchesBody}</p>
              {hasActiveFilters ? (
                <div className="empty-state-actions">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setQuery("");
                      setCategory("");
                    }}
                    type="button"
                  >
                    {copy.common.resetFilters}
                  </button>
                </div>
              ) : null}
              <div className="pill-row">
                {suggestions.slice(0, 4).map((term) => (
                  <button
                    className="search-chip"
                    key={term.id}
                    onClick={() => setQuery(term.term)}
                    type="button"
                  >
                    {term.term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
