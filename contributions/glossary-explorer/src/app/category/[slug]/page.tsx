import { notFound } from "next/navigation";
import { getCategories, getTermsByCategory } from "@/lib/glossary";
import { categoryMeta } from "@/lib/categories";
import CategoryPageClient from "@/components/CategoryPageClient";
import type { Category } from "@/lib/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getCategories().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = categoryMeta[slug as Category];

  if (!meta) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${meta.label} — solexicon`,
    description: meta.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const meta = categoryMeta[slug as Category];

  if (!meta) {
    notFound();
  }

  const terms = getTermsByCategory(slug as Category).sort((left, right) =>
    left.term.localeCompare(right.term),
  );

  return <CategoryPageClient category={slug as Category} terms={terms} />;
}
