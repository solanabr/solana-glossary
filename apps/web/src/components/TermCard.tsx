"use client";

import Link from "next/link";
import { useState } from "react";

import { GraphMapLink } from "@/components/GraphMapLink";
import { type GlossaryTerm, type Locale } from "@/lib/glossary";
import { graphPath, termPath } from "@/lib/url-lang";

interface TermCardProps {
  term: GlossaryTerm;
  searchQuery?: string;
  index?: number;
  locale?: Locale;
  wasRecentlyViewed?: boolean;
  onRelatedClick?: (termId: string) => void;
  labels?: {
    readMore: string;
    readLess: string;
    seeAlso: string;
    viewOnMap?: string;
    readTag?: string;
  };
}

function highlightText(text: string, query: string): string {
  if (!query || query.length < 2) return text;
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  } catch {
    return text;
  }
}

export default function TermCard({
  term,
  searchQuery = "",
  index = 0,
  locale,
  wasRecentlyViewed = false,
  onRelatedClick,
  labels,
}: TermCardProps) {
  const readMore = labels?.readMore ?? "Read more";
  const readLess = labels?.readLess ?? "Show less";
  const seeAlso = labels?.seeAlso ?? "See also";
  const viewOnMap = labels?.viewOnMap ?? "View on map";
  const readTag = labels?.readTag;
  const [expanded, setExpanded] = useState(false);
  const isLong = term.definition.length > 200;

  return (
    <article
      className="
        term-card-enter
        group relative rounded-xl
        bg-sol-surface-elevated border border-sol-line
        hover:border-sol-line-strong
        transition-[border-color,box-shadow] duration-200
        hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]
        overflow-hidden
      "
      style={{ animationDelay: `${Math.min(index * 24, 200)}ms` }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-px bg-sol-line"
        aria-hidden
      />

      <div className="relative p-5">
        <div className="mb-3 space-y-2">
          {locale ? (
            <Link
              href={termPath(locale, term.id)}
              className="block text-[17px] font-display font-semibold text-sol-text leading-snug tracking-tight hover:text-sol-accent transition-colors"
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightText(term.term, searchQuery),
                }}
              />
            </Link>
          ) : (
            <h3
              className="text-[17px] font-display font-semibold text-sol-text leading-snug tracking-tight"
              dangerouslySetInnerHTML={{
                __html: highlightText(term.term, searchQuery),
              }}
            />
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {wasRecentlyViewed && readTag ? (
              <span
                className="tag tag-green inline-flex shrink-0 items-center"
                title={readTag}
              >
                {readTag}
              </span>
            ) : null}
            {locale && (
              <GraphMapLink
                href={graphPath(locale, term.id)}
                label={viewOnMap}
              />
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase border border-sol-line bg-sol-surface text-sol-subtle">
              {term.categoryLabel}
            </span>
          </div>
        </div>

        <div className="relative">
          <p
            className={`text-sm text-sol-subtle leading-relaxed ${
              isLong && !expanded ? "line-clamp-3" : ""
            }`}
            dangerouslySetInnerHTML={{
              __html: highlightText(term.definition, searchQuery),
            }}
          />

          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="
                mt-2 text-[12px] font-medium text-sol-accent hover:text-sol-text
                transition-colors
                flex items-center gap-1
              "
            >
              {expanded ? (
                <>
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                  {readLess}
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  {readMore}
                </>
              )}
            </button>
          )}
        </div>

        {term.related && term.related.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium text-sol-muted uppercase tracking-wider mr-1">
              {seeAlso}
            </span>
            {term.related.map((rel) =>
              locale ? (
                <Link
                  key={rel}
                  href={termPath(locale, rel)}
                  className="
                    text-xs px-2 py-0.5 rounded-md inline-block
                    bg-sol-surface border border-sol-line text-sol-subtle
                    hover:text-sol-text hover:border-sol-line-strong
                    transition-colors
                  "
                >
                  {rel.replace(/-/g, " ")}
                </Link>
              ) : (
                <button
                  key={rel}
                  type="button"
                  onClick={() => onRelatedClick?.(rel)}
                  className="
                    text-xs px-2 py-0.5 rounded-md
                    bg-sol-surface border border-sol-line text-sol-subtle
                    hover:text-sol-text hover:border-sol-line-strong
                    transition-colors
                  "
                >
                  {rel}
                </button>
              ),
            )}
          </div>
        )}
      </div>
    </article>
  );
}
