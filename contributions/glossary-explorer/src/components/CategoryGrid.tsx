"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useChatContext } from "@/contexts/ChatContext";
import { useLocale } from "@/contexts/LocaleContext";
import type { Category, GlossaryTerm } from "@/lib/types";

interface CategoryCardData {
  slug: Category;
  label: string;
  count: number;
  color: string;
  description: string;
  previewTerms: GlossaryTerm[];
}

function getCategoryMark(label: string) {
  return label
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CategoryGrid({
  categories,
}: {
  categories: CategoryCardData[];
}) {
  const { copy, getCategoryMeta, localizeTerm } = useLocale();
  const { openWithPrompt } = useChatContext();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category, index) => {
        const meta = getCategoryMeta(category.slug);

        return (
          <motion.div
            key={category.slug}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35 }}
          >
            <Link
              href={`/category/${category.slug}`}
              onClick={() =>
                openWithPrompt(`What should I learn first in ${meta.label}?`, {
                  pageType: "category",
                  focusId: category.slug,
                  focusLabel: meta.label,
                })
              }
              className="group relative block overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 transition-all hover:-translate-y-1 hover:border-white/20"
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundColor: meta.color }}
              />
              <div
                className="absolute -right-10 top-6 h-28 w-28 rounded-full blur-3xl"
                style={{ backgroundColor: `${meta.color}33` }}
              />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div
                      className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl font-mono text-sm font-bold"
                      style={{
                        backgroundColor: `${meta.color}1f`,
                        color: meta.color,
                      }}
                    >
                      {getCategoryMark(meta.label)}
                    </div>

                    <h3 className="font-mono text-lg font-semibold text-foreground">
                      {meta.label}
                    </h3>
                    <p className="mt-2 max-w-[30ch] text-sm leading-7 text-muted">
                      {meta.description}
                    </p>
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                    {category.count} {copy.category.terms}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">
                    {copy.category.topTerms}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {category.previewTerms.map((term) => (
                      <span
                        key={term.id}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition-colors group-hover:border-white/15 group-hover:bg-white/8"
                      >
                        {localizeTerm(term).term}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
