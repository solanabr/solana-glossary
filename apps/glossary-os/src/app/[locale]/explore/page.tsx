import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ExploreClient } from "@/components/explore-client";
import { getCopy } from "@/lib/copy";
import {
  allTerms,
  categoryOrder,
  getCategoryMeta,
  getFeaturedTerms,
  getLocalizedTerms,
  isCategory,
} from "@/lib/glossary";
import { isSupportedLocale, type Locale } from "@/lib/locales";

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const copy = getCopy(currentLocale);
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim() ?? "";
  const activeCategory =
    resolvedSearchParams.category && isCategory(resolvedSearchParams.category)
      ? resolvedSearchParams.category
      : "";
  const terms = currentLocale === "en" ? allTerms : getLocalizedTerms(currentLocale);
  const categories = categoryOrder.map((category) => ({
    id: category,
    label: getCategoryMeta(category, currentLocale).label,
    shortLabel: getCategoryMeta(category, currentLocale).shortLabel,
    count: terms.filter((term) => term.category === category).length,
    description: getCategoryMeta(category, currentLocale).description,
  }));
  const suggestions = getFeaturedTerms(currentLocale);

  return (
    <Suspense fallback={<div className="detail-panel">{copy.common.loadingExplore}</div>}>
      <ExploreClient
        activeCategory={activeCategory}
        copy={copy}
        categories={categories}
        initialQuery={query}
        locale={currentLocale}
        suggestions={suggestions}
        terms={terms}
      />
    </Suspense>
  );
}
