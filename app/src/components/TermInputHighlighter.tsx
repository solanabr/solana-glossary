import { useMemo } from "react";
import { allTerms } from "@stbr/solana-glossary";
import type { GlossaryTerm } from "@stbr/solana-glossary";

// Build a fast lookup set once
const termLookup: { lower: string; term: GlossaryTerm }[] = [];
for (const t of allTerms) {
  termLookup.push({ lower: t.term.toLowerCase(), term: t });
  for (const a of t.aliases ?? []) {
    termLookup.push({ lower: a.toLowerCase(), term: t });
  }
}
// Sort longest first so longer matches take priority
termLookup.sort((a, b) => b.lower.length - a.lower.length);

/** Find glossary terms in text with their positions. */
export function detectTermsInText(
  text: string,
): { term: GlossaryTerm; start: number; end: number }[] {
  if (!text.trim()) return [];
  const lower = text.toLowerCase();
  const matches: { term: GlossaryTerm; start: number; end: number }[] = [];
  const used = new Set<number>();

  for (const entry of termLookup) {
    if (entry.lower.length < 3) continue;
    let idx = 0;
    while ((idx = lower.indexOf(entry.lower, idx)) !== -1) {
      const before = idx === 0 || /\W/.test(text[idx - 1]);
      const after =
        idx + entry.lower.length >= text.length ||
        /\W/.test(text[idx + entry.lower.length]);
      if (before && after) {
        let overlap = false;
        for (let i = idx; i < idx + entry.lower.length; i++) {
          if (used.has(i)) {
            overlap = true;
            break;
          }
        }
        if (!overlap) {
          matches.push({
            term: entry.term,
            start: idx,
            end: idx + entry.lower.length,
          });
          for (let i = idx; i < idx + entry.lower.length; i++) used.add(i);
        }
      }
      idx += entry.lower.length;
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

interface TermInputHighlighterProps {
  text: string;
  onTermClick?: (term: GlossaryTerm) => void;
  className?: string;
}

/**
 * Renders text with glossary terms highlighted as clickable chips.
 * Used as an overlay or inline display showing detected terms.
 */
export function TermInputHighlighter({
  text,
  onTermClick,
  className,
}: TermInputHighlighterProps) {
  const matches = useMemo(() => detectTermsInText(text), [text]);

  if (matches.length === 0) return null;

  // Deduplicate by term id
  const seen = new Set<string>();
  const unique = matches.filter((m) => {
    if (seen.has(m.term.id)) return false;
    seen.add(m.term.id);
    return true;
  });

  return (
    <div className={`flex flex-wrap gap-1 ${className || ""}`}>
      {unique.slice(0, 12).map((m) => (
        <button
          key={m.term.id}
          onClick={() => onTermClick?.(m.term)}
          className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
          title={m.term.definition.slice(0, 100)}
        >
          {m.term.term}
        </button>
      ))}
    </div>
  );
}
