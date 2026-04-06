import { allTerms, getLocalizedTermNames } from "../glossary/index.js";
import type { GlossaryTerm } from "../glossary/index.js";

export type LookupResult =
  | { type: "found"; term: GlossaryTerm }
  | { type: "multiple"; terms: GlossaryTerm[] }
  | { type: "not-found" };

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(text: string): string {
  return normalize(text).replace(/\s+/g, "");
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter(Boolean)
    .map(singularizeToken);
}

function singularizeToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith("ses") && token.length > 4) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

type TextMatch = {
  term: GlossaryTerm;
  position: number;
  kind: "name" | "alias";
  span: number;
  phrase: string;
};

const MAX_TERM_TOKENS = 6;
const GENERIC_ALIAS_TOKENS = new Set(["solana"]);
const SHADOWABLE_TEXT_TOKENS = new Set(["consensu"]);

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

function scoreTerm(
  term: GlossaryTerm,
  query: string,
  queryTokens: string[],
): SearchScore | null {
  const id = normalize(term.id);
  const idCompact = compact(term.id);
  const name = normalize(term.term);
  const nameCompact = compact(term.term);
  const aliases = (term.aliases ?? []).map(normalize);
  const aliasesCompact = (term.aliases ?? []).map(compact);
  const definition = normalize(term.definition);

  const queryCompact = compact(query);
  const allPrimaryText = `${id} ${name} ${aliases.join(" ")}`.trim();

  if (id === query || name === query)
    return { score: 0, directness: 0, kind: "exact-primary" };
  if (idCompact === queryCompact || nameCompact === queryCompact)
    return { score: 1, directness: 0, kind: "exact-primary" };

  const aliasExactIndex = aliases.findIndex((alias) => alias === query);
  if (aliasExactIndex !== -1)
    return { score: 2, directness: 1, kind: "exact-alias" };
  if (aliasesCompact.some((alias) => alias === queryCompact))
    return { score: 3, directness: 1, kind: "exact-alias" };

  if (id.startsWith(query) || name.startsWith(query))
    return { score: 4, directness: 2, kind: "prefix-primary" };
  if (
    idCompact.startsWith(queryCompact) ||
    nameCompact.startsWith(queryCompact)
  )
    return { score: 5, directness: 2, kind: "prefix-primary" };
  if (aliases.some((alias) => alias.startsWith(query)))
    return { score: 6, directness: 3, kind: "prefix-alias" };

  const tokenStarts = queryTokens.every(
    (token) =>
      tokenize(term.term).some((word) => word.startsWith(token)) ||
      tokenize(term.id).some((word) => word.startsWith(token)) ||
      (term.aliases ?? []).some((alias) =>
        tokenize(alias).some((word) => word.startsWith(token)),
      ),
  );
  if (tokenStarts) return { score: 7, directness: 4, kind: "token-prefix" };

  if (name.includes(query) || id.includes(query))
    return { score: 8, directness: 5, kind: "contains-primary" };
  if (aliases.some((alias) => alias.includes(query)))
    return { score: 9, directness: 6, kind: "contains-alias" };

  const tokenCoverage = queryTokens.filter((token) =>
    allPrimaryText.includes(token),
  ).length;
  if (tokenCoverage === queryTokens.length && queryTokens.length > 0) {
    return { score: 10, directness: 7, kind: "token-coverage" };
  }

  if (definition.includes(query))
    return { score: 50, directness: 8, kind: "definition" };

  const definitionTokenCoverage = queryTokens.filter((token) =>
    definition.includes(token),
  ).length;
  if (
    definitionTokenCoverage === queryTokens.length &&
    queryTokens.length > 0
  ) {
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
    .filter(
      (entry): entry is { term: GlossaryTerm; match: SearchScore } =>
        entry.match !== null,
    )
    .sort((a, b) => {
      if (a.match.score !== b.match.score) return a.match.score - b.match.score;
      if (a.match.directness !== b.match.directness)
        return a.match.directness - b.match.directness;
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

  return {
    type: "multiple",
    terms: ranked.slice(0, 5).map((entry) => entry.term),
  };
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
          matrix[i - 1][j] + 1,
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

// Built once at module load: normalized phrase → { term, kind }
// Avoids O(tokens × spans × 1001) loop on every /explain call.
const phraseIndex = new Map<
  string,
  { term: GlossaryTerm; kind: TextMatch["kind"] }
>();
for (const term of allTerms) {
  const name = tokenize(term.term).join(" ");
  const id = tokenize(term.id).join(" ");
  if (!phraseIndex.has(name)) phraseIndex.set(name, { term, kind: "name" });
  if (!phraseIndex.has(id)) phraseIndex.set(id, { term, kind: "name" });
  for (const alias of term.aliases ?? []) {
    const na = tokenize(alias).join(" ");
    if (!phraseIndex.has(na)) phraseIndex.set(na, { term, kind: "alias" });
  }
  for (const localizedName of getLocalizedTermNames(term.id)) {
    const ln = tokenize(localizedName).join(" ");
    if (ln && !phraseIndex.has(ln)) phraseIndex.set(ln, { term, kind: "name" });
  }
}

export function findTermsInText(text: string): GlossaryTerm[] {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];

  const matches = new Map<string, TextMatch>();

  for (let i = 0; i < tokens.length; i++) {
    for (let span = MAX_TERM_TOKENS; span >= 1; span--) {
      const slice = tokens.slice(i, i + span);
      if (slice.length !== span) continue;

      const phrase = slice.join(" ");
      const hit = phraseIndex.get(phrase);
      if (!hit) continue;

      const { term, kind } = hit;
      const next: TextMatch = { term, position: i, kind, span, phrase };
      const existing = matches.get(term.id);

      if (
        !existing ||
        next.position < existing.position ||
        (next.position === existing.position &&
          matchPriority(next) < matchPriority(existing))
      ) {
        matches.set(term.id, next);
      }
    }
  }

  return selectRelevantTextMatches([...matches.values()])
    .sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return matchPriority(a) - matchPriority(b);
    })
    .map((entry) => entry.term);
}

function matchPriority(match: TextMatch): number {
  if (match.kind === "name") return -match.span;
  return 10 - match.span;
}

function selectRelevantTextMatches(matches: TextMatch[]): TextMatch[] {
  const sorted = [...matches].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return matchPriority(a) - matchPriority(b);
  });

  const selected: TextMatch[] = [];

  for (const match of sorted) {
    if (isGenericAliasMatch(match)) {
      continue;
    }

    if (isRedundantAliasExpansion(match, selected)) {
      continue;
    }

    if (isGenericConceptShadowed(match, selected)) {
      continue;
    }

    selected.push(match);
  }

  return selected;
}

function isGenericAliasMatch(match: TextMatch): boolean {
  return match.kind === "alias" && GENERIC_ALIAS_TOKENS.has(match.phrase);
}

function isGenericConceptShadowed(
  match: TextMatch,
  selected: TextMatch[],
): boolean {
  if (match.span > 1 || !SHADOWABLE_TEXT_TOKENS.has(match.phrase)) {
    return false;
  }

  return selected.some(
    (candidate) =>
      candidate.position < match.position &&
      candidate.span > match.span &&
      (candidate.kind === "name" || candidate.span >= 2),
  );
}

function isRedundantAliasExpansion(
  match: TextMatch,
  selected: TextMatch[],
): boolean {
  if (match.kind !== "alias" || match.span !== 1) {
    return false;
  }

  return selected.some(
    (candidate) =>
      candidate.position <= match.position &&
      candidate.span > match.span &&
      tokenize(candidate.phrase).includes(match.phrase),
  );
}
