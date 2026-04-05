import type { GlossaryTerm } from "../types";

const PRIORITY_CATEGORIES = new Set(["core-protocol", "programming-model"]);

function countOccurrences(input: string, term: GlossaryTerm): number {
  const needle = term.term.toLowerCase();
  let count = 0;
  let pos = input.toLowerCase().indexOf(needle);
  while (pos !== -1) {
    count++;
    pos = input.toLowerCase().indexOf(needle, pos + 1);
  }
  for (const alias of term.aliases ?? []) {
    const a = alias.toLowerCase();
    let apos = input.toLowerCase().indexOf(a);
    while (apos !== -1) {
      count++;
      apos = input.toLowerCase().indexOf(a, apos + 1);
    }
  }
  return count;
}

function isExactMatch(input: string, term: GlossaryTerm): boolean {
  const pattern = new RegExp(`\\b${term.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return pattern.test(input);
}

function isAliasMatch(input: string, term: GlossaryTerm): boolean {
  return (term.aliases ?? []).some((alias) =>
    new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(input),
  );
}

export interface ScoredTerm {
  term: GlossaryTerm;
  score: number;
}

export function rankTerms(input: string, detected: GlossaryTerm[]): GlossaryTerm[] {
  const earlyWindow = Math.floor(input.length * 0.3);
  const earlyText = input.slice(0, earlyWindow).toLowerCase();

  const scored: ScoredTerm[] = detected.map((term) => {
    let score = 0;

    if (isExactMatch(input, term)) score += 5;
    if (isAliasMatch(input, term)) score += 3;

    const freq = countOccurrences(input, term);
    score += freq;

    if (earlyText.includes(term.term.toLowerCase())) score += 1;

    if (PRIORITY_CATEGORIES.has(term.category)) score += 2;

    if ((term.related?.length ?? 0) > 5) score += 1;

    return { term, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.term);
}
