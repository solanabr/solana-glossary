import { allTerms } from "../glossary/index.js";
import type { GlossaryTerm } from "../glossary/index.js";

export type LookupResult =
  | { type: "found"; term: GlossaryTerm }
  | { type: "multiple"; terms: GlossaryTerm[] }
  | { type: "not-found" };

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(text: string): string {
  return normalize(text).replace(/\s+/g, "");
}

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(Boolean);
}

type SearchScore = {
  score: number;
  directness: number;
  kind:
    | "exact-primary"
    | "exact-alias"
    | "prefix-primary"
    | "prefix-alias"
    | "token-prefix"
    | "contains-primary"
    | "contains-alias"
    | "token-coverage"
    | "definition"
    | "definition-token";
};

function scoreTerm(term: GlossaryTerm, query: string, queryTokens: string[]): SearchScore | null {
  const id = normalize(term.id);
  const idCompact = compact(term.id);
  const name = normalize(term.term);
  const nameCompact = compact(term.term);
  const aliases = (term.aliases ?? []).map(normalize);
  const aliasesCompact = (term.aliases ?? []).map(compact);
  const definition = normalize(term.definition);

  const queryCompact = compact(query);
  const allPrimaryText = `${id} ${name} ${aliases.join(" ")}`.trim();

  if (id === query || name === query) return { score: 0, directness: 0, kind: "exact-primary" };
  if (idCompact === queryCompact || nameCompact === queryCompact) return { score: 1, directness: 0, kind: "exact-primary" };

  const aliasExactIndex = aliases.findIndex((alias) => alias === query);
  if (aliasExactIndex !== -1) return { score: 2, directness: 1, kind: "exact-alias" };
  if (aliasesCompact.some((alias) => alias === queryCompact)) return { score: 3, directness: 1, kind: "exact-alias" };

  if (id.startsWith(query) || name.startsWith(query)) return { score: 4, directness: 2, kind: "prefix-primary" };
  if (idCompact.startsWith(queryCompact) || nameCompact.startsWith(queryCompact)) return { score: 5, directness: 2, kind: "prefix-primary" };
  if (aliases.some((alias) => alias.startsWith(query))) return { score: 6, directness: 3, kind: "prefix-alias" };

  const tokenStarts = queryTokens.every((token) =>
    tokenize(term.term).some((word) => word.startsWith(token)) ||
    tokenize(term.id).some((word) => word.startsWith(token)) ||
    (term.aliases ?? []).some((alias) => tokenize(alias).some((word) => word.startsWith(token)))
  );
  if (tokenStarts) return { score: 7, directness: 4, kind: "token-prefix" };

  if (name.includes(query) || id.includes(query)) return { score: 8, directness: 5, kind: "contains-primary" };
  if (aliases.some((alias) => alias.includes(query))) return { score: 9, directness: 6, kind: "contains-alias" };

  const tokenCoverage = queryTokens.filter((token) => allPrimaryText.includes(token)).length;
  if (tokenCoverage === queryTokens.length && queryTokens.length > 0) {
    return { score: 10, directness: 7, kind: "token-coverage" };
  }

  if (definition.includes(query)) return { score: 50, directness: 8, kind: "definition" };

  const definitionTokenCoverage = queryTokens.filter((token) => definition.includes(token)).length;
  if (definitionTokenCoverage === queryTokens.length && queryTokens.length > 0) {
    return { score: 60, directness: 9, kind: "definition-token" };
  }

  return null;
}

export function lookupTerm(input: string): LookupResult {
  const trimmed = input.trim();
  if (!trimmed) return { type: "not-found" };

  const query = normalize(trimmed);
  const queryTokens = tokenize(trimmed);
  if (!query) return { type: "not-found" };

  const exactById = allTerms.find((term) => normalize(term.id) === query);
  if (exactById) return { type: "found", term: exactById };

  const exactByName = allTerms.find((term) => normalize(term.term) === query);
  if (exactByName) return { type: "found", term: exactByName };

  const ranked = allTerms
    .map((term) => ({ term, match: scoreTerm(term, query, queryTokens) }))
    .filter((entry): entry is { term: GlossaryTerm; match: SearchScore } => entry.match !== null)
    .sort((a, b) => {
      if (a.match.score !== b.match.score) return a.match.score - b.match.score;
      if (a.match.directness !== b.match.directness) return a.match.directness - b.match.directness;
      return a.term.term.localeCompare(b.term.term);
    });

  if (ranked.length === 0) return { type: "not-found" };
  if (ranked.length === 1) return { type: "found", term: ranked[0].term };

  const best = ranked[0].match.score;
  const second = ranked[1].match.score;
  const bestKind = ranked[0].match.kind;

  // Strong direct matches should win when there is clear separation.
  if (bestKind !== "exact-alias" && best <= 7 && second > best) {
    return { type: "found", term: ranked[0].term };
  }

  // Prefix / token matches can win if the alternatives are much weaker.
  if (bestKind !== "exact-alias" && best >= 4 && best <= 7 && second >= 50) {
    return { type: "found", term: ranked[0].term };
  }

  // Exact aliases still win when there is no similarly strong alternative.
  if (bestKind === "exact-alias" && second >= 50) {
    return { type: "found", term: ranked[0].term };
  }

  return { type: "multiple", terms: ranked.slice(0, 5).map((entry) => entry.term) };
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

/** Find closest term by Levenshtein distance (threshold <= 3) */
export function findClosest(query: string): GlossaryTerm | undefined {
  const lowerQuery = normalize(query);
  let bestMatch: GlossaryTerm | undefined;
  let bestDistance = Infinity;

  for (const term of allTerms) {
    const idDist = levenshteinDistance(lowerQuery, normalize(term.id));
    if (idDist < bestDistance) {
      bestDistance = idDist;
      bestMatch = term;
    }

    const nameDist = levenshteinDistance(lowerQuery, normalize(term.term));
    if (nameDist < bestDistance) {
      bestDistance = nameDist;
      bestMatch = term;
    }

    for (const alias of term.aliases ?? []) {
      const aliasDist = levenshteinDistance(lowerQuery, normalize(alias));
      if (aliasDist < bestDistance) {
        bestDistance = aliasDist;
        bestMatch = term;
      }
    }
  }

  return bestDistance <= 3 ? bestMatch : undefined;
}
