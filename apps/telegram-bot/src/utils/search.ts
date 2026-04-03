// src/utils/search.ts
import {
  getTerm,
  searchTerms as sdkSearch,
  allTerms,
} from "@stbr/solana-glossary";
import type { GlossaryTerm } from "@stbr/solana-glossary";

export type LookupResult =
  | { type: "found"; term: GlossaryTerm }
  | { type: "multiple"; terms: GlossaryTerm[] }
  | { type: "not-found" };

/** Score a term by relevance to query (lower = better match) */
function relevanceScore(term: GlossaryTerm, q: string): number {
  const id = term.id.toLowerCase();
  const name = term.term.toLowerCase();
  if (id === q || name === q) return 0;
  if (term.aliases?.some((a) => a.toLowerCase() === q)) return 0;
  if (id.startsWith(q) || name.startsWith(q)) return 1;
  if (term.aliases?.some((a) => a.toLowerCase().startsWith(q))) return 1;
  if (id.includes(q) || name.includes(q)) return 2;
  if (term.aliases?.some((a) => a.toLowerCase().includes(q))) return 2;
  return 3; // definition match
}

export function lookupTerm(input: string): LookupResult {
  const trimmed = input.trim();
  if (!trimmed) return { type: "not-found" };

  // Try exact lookup by ID or alias first
  const exact = getTerm(trimmed);
  if (exact) return { type: "found", term: exact };

  // Full-text search with relevance ranking
  const q = trimmed.toLowerCase();
  const results = sdkSearch(trimmed);
  if (results.length === 0) return { type: "not-found" };

  const ranked = [...results].sort((a, b) => relevanceScore(a, q) - relevanceScore(b, q));

  if (ranked.length === 1) return { type: "found", term: ranked[0] };
  return { type: "multiple", terms: ranked.slice(0, 5) };
}

/** Returns n random terms from the full glossary */
export function getRandomTerms(n: number): GlossaryTerm[] {
  const shuffled = [...allTerms].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/** Calculate Levenshtein distance between two strings */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/** Find closest term by Levenshtein distance (threshold ≤ 3) */
export function findClosest(query: string): GlossaryTerm | undefined {
  const lowerQuery = query.toLowerCase();
  let bestMatch: GlossaryTerm | undefined;
  let bestDistance = Infinity;

  for (const term of allTerms) {
    // Check ID
    const idDist = levenshteinDistance(lowerQuery, term.id.toLowerCase());
    if (idDist < bestDistance) {
      bestDistance = idDist;
      bestMatch = term;
    }

    // Check term name
    const nameDist = levenshteinDistance(lowerQuery, term.term.toLowerCase());
    if (nameDist < bestDistance) {
      bestDistance = nameDist;
      bestMatch = term;
    }

    // Check aliases
    for (const alias of term.aliases ?? []) {
      const aliasDist = levenshteinDistance(lowerQuery, alias.toLowerCase());
      if (aliasDist < bestDistance) {
        bestDistance = aliasDist;
        bestMatch = term;
      }
    }
  }

  return bestDistance <= 3 ? bestMatch : undefined;
}
