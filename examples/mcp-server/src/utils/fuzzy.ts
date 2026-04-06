/**
 * Fuzzy Search Engine
 *
 * Levenshtein distance + Dice coefficient (bigram similarity)
 * for typo-tolerant term matching against the glossary.
 */

import { allTerms, type GlossaryTerm } from "@stbr/solana-glossary";

/** Levenshtein edit distance between two strings */
export function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const matrix: number[][] = [];

  for (let i = 0; i <= la; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lb; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[la][lb];
}

/** Extract bigrams from a string */
function bigrams(str: string): Set<string> {
  const s = str.toLowerCase();
  const result = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    result.add(s.substring(i, i + 2));
  }
  return result;
}

/** Dice coefficient (bigram similarity) — 0..1, higher = more similar */
export function diceCoefficient(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) {
    return a.toLowerCase() === b.toLowerCase() ? 1 : 0;
  }
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/** Combined fuzzy score — higher = better match (0..1) */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact match
  if (q === t) return 1;

  // Prefix match bonus
  const prefixBonus = t.startsWith(q) ? 0.3 : 0;

  // Contains bonus
  const containsBonus = t.includes(q) ? 0.2 : 0;

  // Levenshtein (normalized — 0..1 where 1 = identical)
  const maxLen = Math.max(q.length, t.length);
  const levScore = maxLen > 0 ? 1 - levenshtein(q, t) / maxLen : 0;

  // Dice coefficient
  const dice = diceCoefficient(q, t);

  // Weighted combination
  return Math.min(1, levScore * 0.4 + dice * 0.3 + prefixBonus + containsBonus);
}

export interface FuzzyResult {
  term: GlossaryTerm;
  score: number;
  matchedOn: string; // which field matched best
}

/**
 * Fuzzy search across all glossary terms.
 * Matches against term name, ID, and aliases.
 */
export function fuzzySearch(query: string, limit = 10, minScore = 0.3): FuzzyResult[] {
  const results: FuzzyResult[] = [];

  for (const term of allTerms) {
    let bestScore = 0;
    let matchedOn = "term";

    // Score against term name
    const nameScore = fuzzyScore(query, term.term);
    if (nameScore > bestScore) {
      bestScore = nameScore;
      matchedOn = "term";
    }

    // Score against ID
    const idScore = fuzzyScore(query, term.id);
    if (idScore > bestScore) {
      bestScore = idScore;
      matchedOn = "id";
    }

    // Score against aliases
    for (const alias of term.aliases ?? []) {
      const aliasScore = fuzzyScore(query, alias);
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
        matchedOn = `alias:${alias}`;
      }
    }

    if (bestScore >= minScore) {
      results.push({ term, score: bestScore, matchedOn });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}
