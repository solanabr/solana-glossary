"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import type { GlossaryTerm } from "@/lib/types";

export default function TermCard({ term }: { term: GlossaryTerm }) {
  const { getCategoryMeta, localizeTerm } = useLocale();
  const localized = localizeTerm(term);
  const category = getCategoryMeta(term.category);

  return (
    <Link
      href={`/term/${term.id}`}
      className="group gradient-border glow-hover block rounded-2xl bg-card p-4 transition-all hover:-translate-y-1 hover:bg-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 font-mono text-sm font-semibold text-foreground transition-colors group-hover:text-white">
            {localized.term}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
            {localized.definition}
          </p>
        </div>

        <span
          className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold"
          style={{
            backgroundColor: `${category.color}22`,
            color: category.color,
          }}
        >
          {category.label}
        </span>
      </div>

      {localized.aliases && localized.aliases.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {localized.aliases.slice(0, 3).map((alias) => (
            <span
              key={alias}
              className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-muted"
            >
              {alias}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
