import Link from "next/link";
import type { GlossaryTerm } from "@/lib/glossary";
import { getDifficulty } from "@/lib/difficulty";
import DifficultyBadge from "./DifficultyBadge";

interface FeaturedCardProps {
  term: GlossaryTerm;
  locale: string;
}

export default function FeaturedCard({ term, locale }: FeaturedCardProps) {
  const difficulty = getDifficulty(term.id, term.category);

  return (
    <Link href={`/term/${term.id}`}>
      <div className="bg-bg-featured border border-border-strong rounded p-4 mb-3 hover:border-accent/40 transition-colors cursor-pointer group">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] text-green font-bold uppercase tracking-widest">
            {term.category.replace(/-/g, " ")}
          </span>
          <DifficultyBadge difficulty={difficulty} locale={locale} />
          <span className="text-[9px] text-text-dim ml-auto">Featured ↗</span>
        </div>
        <h2 className="font-heading font-black text-lg text-text tracking-tight mb-2 group-hover:text-accent transition-colors">
          {term.term}
        </h2>
        <p className="text-[12px] text-text-muted leading-relaxed line-clamp-3 mb-3">
          {term.definition}
        </p>
        {term.related && term.related.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {term.related.slice(0, 4).map((r) => (
              <span
                key={r}
                className="text-[9px] text-accent border border-accent/25 px-1.5 py-0.5 rounded-full"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
