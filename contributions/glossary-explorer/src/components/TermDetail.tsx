"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import type { GlossaryTerm } from "@/lib/types";
import CodeLab from "./CodeLab";
import LiveDataBadge from "./LiveDataBadge";
import ShareButton from "./ShareButton";
import { hasCodeExamples } from "@/lib/code-examples";

interface TermDetailProps {
  term: GlossaryTerm;
  relatedTerms: GlossaryTerm[];
}

export default function TermDetail({ term, relatedTerms }: TermDetailProps) {
  const { copy, getCategoryMeta, localizeTerm } = useLocale();
  const localizedTerm = localizeTerm(term);
  const category = getCategoryMeta(term.category);

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link
          href={`/category/${term.category}`}
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: `${category.color}22`,
            color: category.color,
          }}
        >
          {category.label}
        </Link>

        <h1 className="mt-4 font-mono text-3xl font-bold text-foreground sm:text-4xl">
          {localizedTerm.term}
        </h1>

        {localizedTerm.aliases && localizedTerm.aliases.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {localizedTerm.aliases.map((alias) => (
              <span
                key={alias}
                className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted"
              >
                {alias}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="gradient-border mb-8 rounded-[28px] bg-card p-6">
        <p className="text-base leading-8 text-foreground/92">
          {localizedTerm.definition}
        </p>
      </div>

      {/* Share */}
      <div className="mb-8">
        <ShareButton
          termId={term.id}
          termName={localizedTerm.term}
          category={term.category}
        />
      </div>

      {/* Live Network Data */}
      <div className="mb-8">
        <LiveDataBadge termId={term.id} />
      </div>

      {/* Code Examples */}
      {hasCodeExamples(term.id) && (
        <div className="mb-8">
          <CodeLab termId={term.id} />
        </div>
      )}

      {relatedTerms.length > 0 ? (
        <div>
          <h2 className="mb-4 font-mono text-lg font-semibold text-foreground">
            {copy.term.related}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {relatedTerms.map((related) => {
              const localizedRelated = localizeTerm(related);
              const relatedCategory = getCategoryMeta(related.category);

              return (
                <Link
                  key={related.id}
                  href={`/term/${related.id}`}
                  className="group gradient-border glow-hover block rounded-2xl bg-card p-4 transition-all hover:-translate-y-1 hover:bg-card-hover"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground transition-colors group-hover:text-white">
                      {localizedRelated.term}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${relatedCategory.color}22`,
                        color: relatedCategory.color,
                      }}
                    >
                      {relatedCategory.label}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm text-muted">
                    {localizedRelated.definition}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-8 text-center">
        <Link
          href={`/explore?highlight=${term.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-5 py-3 text-sm text-white/80 transition-colors hover:border-solana-purple/30 hover:bg-white/[0.08] hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="3" strokeWidth={2} />
            <path
              strokeLinecap="round"
              strokeWidth={2}
              d="M12 2v4m0 12v4M2 12h4m12 0h4m-2.93-7.07l-2.83 2.83m-8.48 8.48l-2.83 2.83m0-14.14l2.83 2.83m8.48 8.48l2.83 2.83"
            />
          </svg>
          {copy.term.viewGraph}
        </Link>
      </div>
    </article>
  );
}
