import { Suspense } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { TermCard } from "@/components/TermCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSelector } from "@/components/LocaleSelector";
import {
  getAllTerms,
  searchTerms,
  getTermsByCategory,
  getCategoryStats,
  localizeTerm,
  CATEGORY_LABELS,
  CATEGORY_EMOJI,
  type Category,
} from "@/lib/glossary";
import { UI, type Locale } from "@/lib/i18n";

const TERMS_PER_PAGE = 48;

interface PageProps {
  searchParams: { q?: string; cat?: string; locale?: string; page?: string };
}

export default function HomePage({ searchParams }: PageProps) {
  const locale = (searchParams.locale ?? "en") as Locale;
  const ui = UI[locale] ?? UI.en;
  const query = searchParams.q ?? "";
  const cat = (searchParams.cat as Category) || undefined;
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));

  const stats = getCategoryStats();

  let terms = getAllTerms();
  if (cat) terms = getTermsByCategory(cat);
  if (query) terms = searchTerms(query, 500).filter((t) => !cat || t.category === cat);

  const total = terms.length;
  const pageTerms = terms.slice((page - 1) * TERMS_PER_PAGE, page * TERMS_PER_PAGE);
  const totalPages = Math.ceil(total / TERMS_PER_PAGE);
  const allCount = getAllTerms().length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-base bg-base/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold text-accent">◎</span>
            <span className="font-semibold text-sm hidden sm:block">{ui.title}</span>
          </a>

          <div className="flex-1 max-w-md">
            <Suspense>
              <SearchBar ui={ui} initialQuery={query} />
            </Suspense>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Suspense>
              <LocaleSelector current={locale} />
            </Suspense>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Hero */}
        {!query && !cat && page === 1 && (
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 text-accent text-xs mb-4">
              <span>✨</span> Superteam Brazil
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-3 tracking-tight">
              <span className="text-accent">◎</span> {ui.title}
            </h1>
            <p className="text-muted text-sm sm:text-base max-w-lg mx-auto">{ui.subtitle}</p>
            <div className="mt-5 flex justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-base">{allCount}</div>
                <div className="text-xs text-muted">{ui.totalTerms}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-base">14</div>
                <div className="text-xs text-muted">{ui.categories}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-base">3</div>
                <div className="text-xs text-muted">idiomas</div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <Suspense>
            <CategoryFilter ui={ui} locale={locale} stats={stats} current={cat} />
          </Suspense>
        </div>

        {/* Results header */}
        {(query || cat) && (
          <div className="mb-4 text-sm text-muted">
            {query && (
              <span>
                {total} {ui.terms} para{" "}
                <strong className="text-base">&quot;{query}&quot;</strong>
              </span>
            )}
            {cat && !query && (
              <span>
                {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat][locale]} — {total} {ui.terms}
              </span>
            )}
          </div>
        )}

        {/* No results */}
        {total === 0 && (
          <div className="text-center py-20 text-muted">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold text-base mb-2">
              {ui.noResults} &quot;{query}&quot;
            </p>
            <p className="text-sm">{ui.tryBroader}</p>
          </div>
        )}

        {/* Grid */}
        {pageTerms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pageTerms.map((term) => {
              const loc = localizeTerm(term, locale);
              return (
                <TermCard
                  key={term.id}
                  term={term}
                  localizedName={loc.term}
                  localizedDef={loc.definition}
                  locale={locale}
                  query={query}
                />
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {page > 1 && (
              <a
                href={`/?q=${query}&cat=${cat ?? ""}&locale=${locale}&page=${page - 1}`}
                className="px-4 py-2 rounded-lg border border-base text-sm hover:bg-card transition-colors"
              >
                ←
              </a>
            )}
            <span className="px-4 py-2 text-sm text-muted">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <a
                href={`/?q=${query}&cat=${cat ?? ""}&locale=${locale}&page=${page + 1}`}
                className="px-4 py-2 rounded-lg border border-base text-sm hover:bg-card transition-colors"
              >
                →
              </a>
            )}
          </div>
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
