import { notFound } from "next/navigation";
import { getAllCategories, getTermsByCategory } from "@/lib/glossary";
import type { Category } from "@/lib/glossary";
import MiniCard from "@/components/MiniCard";
import Link from "next/link";

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = getAllCategories();
  if (!categories.includes(slug as Category)) notFound();

  const category = slug as Category;
  const terms = getTermsByCategory(category, "en");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/" className="text-[11px] text-text-dim hover:text-text mb-6 inline-block">
        ← Voltar
      </Link>
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="font-heading font-black text-3xl text-text tracking-tight capitalize">
          {category.replace(/-/g, " ")}
        </h1>
        <span className="text-text-dim text-sm">{terms.length} termos</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {terms.map((t) => (
          <MiniCard key={t.id} term={t} />
        ))}
      </div>
    </div>
  );
}
