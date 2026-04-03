"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/glossary-config";
import type { Category } from "@/lib/glossary-config";
import type { Locale, UIStrings } from "@/lib/i18n";

interface Props {
  ui: UIStrings;
  locale: Locale;
  stats: Record<Category, number>;
  current?: Category;
}

export function CategoryFilter({ ui, locale, stats, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(cat: Category | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set("cat", cat);
    else params.delete("cat");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* All */}
      <button
        onClick={() => select(null)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
          !current
            ? "bg-accent text-white border-transparent"
            : "border-base text-muted hover:text-base hover:bg-card"
        }`}
      >
        {ui.allCategories}
      </button>

      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => select(cat)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 ${
            cat === current
              ? "bg-accent text-white border-transparent"
              : "border-base text-muted hover:text-base hover:bg-card"
          }`}
        >
          <span>{CATEGORY_EMOJI[cat]}</span>
          <span>{CATEGORY_LABELS[cat][locale]}</span>
          <span className="opacity-60">({stats[cat]})</span>
        </button>
      ))}
    </div>
  );
}
