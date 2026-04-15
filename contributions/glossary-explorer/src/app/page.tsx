import { allTerms, getCategories, getTermsByCategory } from "@/lib/glossary";
import { categoryMeta } from "@/lib/categories";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  const categories = getCategories().map((slug) => ({
    slug,
    label: categoryMeta[slug].label,
    color: categoryMeta[slug].color,
    count: getTermsByCategory(slug).length,
    description: categoryMeta[slug].description,
    previewTerms: getTermsByCategory(slug)
      .slice()
      .sort((left, right) => {
        const byRelated =
          (right.related?.length ?? 0) - (left.related?.length ?? 0);
        return byRelated !== 0
          ? byRelated
          : left.term.localeCompare(right.term);
      })
      .slice(0, 3),
  }));

  return <HomeClient terms={allTerms} categories={categories} />;
}
