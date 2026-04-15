"use client";

import TermCard from "./TermCard";
import { useLocale } from "@/contexts/LocaleContext";
import type { Category, GlossaryTerm } from "@/lib/types";

interface CategoryPageClientProps {
  category: Category;
  terms: GlossaryTerm[];
}

export default function CategoryPageClient({
  category,
  terms,
}: CategoryPageClientProps) {
  const { copy, getCategoryMeta } = useLocale();
  const meta = getCategoryMeta(category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <div
          className="mb-4 h-1.5 w-20 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
        <h1 className="font-mono text-3xl font-bold text-foreground">
          {meta.label}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted">
          {meta.description}
        </p>
        <p className="mt-2 text-sm text-muted">
          {terms.length} {copy.category.terms}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {terms.map((term) => (
          <TermCard key={term.id} term={term} />
        ))}
      </div>
    </div>
  );
}
