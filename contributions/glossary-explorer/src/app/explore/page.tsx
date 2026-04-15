import { Suspense } from "react";
import { allTerms, getCategories } from "@/lib/glossary";
import { categoryMeta } from "@/lib/categories";
import ExploreWrapper from "@/components/ExploreWrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Relationships — solexicon",
  description:
    "Interactive 2D and 3D visualization of relationships between 1001 Solana glossary terms.",
};

export default function ExplorePage() {
  const categories = getCategories().map((slug) => ({
    slug,
    label: categoryMeta[slug].label,
    color: categoryMeta[slug].color,
  }));

  const serializedTerms = allTerms.map((term) => ({
    id: term.id,
    term: term.term,
    category: term.category,
    related: term.related ?? [],
  }));

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-140px)] items-center justify-center">
          <p className="animate-pulse font-mono text-sm text-muted">
            Loading graph...
          </p>
        </div>
      }
    >
      <ExploreWrapper terms={serializedTerms} categories={categories} />
    </Suspense>
  );
}
