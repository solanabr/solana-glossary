// RAG + zero-LLM answers, sourced from the @stbr/solana-glossary SDK. This is
// the "free deterministic answer path" the guard fails into when the budget is
// exhausted or a spend/store error occurs — never blind Gemini spend.

import { createHash } from "node:crypto";
import { allTerms, getTerm, type GlossaryTerm } from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import type { CannedAnswer, Locale } from "./types.js";

/** Compact RAG block plus the canonical ids that produced it (for cache keys). */
export interface RagResult {
  block: string;
  ids: string[];
}

/**
 * Short content hash of the corpus (sorted ids). Folded into cache keys so a
 * glossary update transparently invalidates stale cached answers.
 */
export const CORPUS_VERSION: string = createHash("sha256")
  .update(
    allTerms
      .map((t) => t.id)
      .sort()
      .join(","),
  )
  .digest("hex")
  .slice(0, 12);

// alias / term-name (lowercased) → canonical id. Locale-independent: canonical
// ids never change across translations. We also index the name with its
// parenthetical stripped, so "proof of history" resolves the term displayed as
// "Proof of History (PoH)".
const aliasToId = new Map<string, string>();
for (const t of allTerms) {
  aliasToId.set(t.term.toLowerCase(), t.id);
  const noParen = t.term
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .trim()
    .toLowerCase();
  if (noParen) aliasToId.set(noParen, t.id);
  for (const alias of t.aliases ?? []) {
    aliasToId.set(alias.toLowerCase(), t.id);
  }
}

// Lead-in phrases stripped when resolving a natural-language prompt to a term.
// Longest-first so "what is a" is tried before "what is".
const LEAD_INS = [
  "what is an",
  "what is a",
  "what's an",
  "what's a",
  "what are",
  "what is",
  "what's",
  "whats",
  "explain the",
  "explain",
  "define the",
  "define",
  "describe",
  "tell me about",
  "meaning of",
  "definition of",
].sort((a, b) => b.length - a.length);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[“”‘’"'`]/g, "")
    .replace(/[.,:;!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip a leading question phrase and a trailing article, e.g. "what is an AMM" → "amm". */
function stripLeadIn(norm: string): string {
  let s = norm;
  for (const lead of LEAD_INS) {
    if (s === lead) return "";
    if (s.startsWith(lead + " ")) {
      s = s.slice(lead.length + 1).trim();
      break;
    }
  }
  // Drop a dangling article the lead-in didn't already consume.
  s = s.replace(/^(the|a|an)\s+/, "");
  return s.trim();
}

/**
 * Reduce a prompt to a stable cache token. When the prompt resolves to a single
 * glossary term, the token is that term's canonical id — so "what's an AMM" and
 * "define amm" collapse to the same key. Otherwise it's the normalized text.
 */
export function canonicalizePrompt(
  prompt: string,
  locale: Locale = "en",
): { norm: string; termId?: string } {
  const stripped = stripLeadIn(normalize(prompt));
  if (!stripped) return { norm: normalize(prompt) };

  const id =
    aliasToId.get(stripped) ??
    getTerm(stripped)?.id ??
    getTerm(stripped.replace(/\s+/g, "-"))?.id ?? // "proof of history" → id
    localizedTermId(stripped, locale);

  if (id) return { norm: id, termId: id };
  return { norm: stripped };
}

/** Resolve a localized term display-name back to its canonical id. */
function localizedTermId(text: string, locale: Locale): string | undefined {
  if (locale === "en") return undefined;
  const hit = getLocalizedTerms(locale).find(
    (t) => t.term.toLowerCase() === text,
  );
  return hit?.id;
}

/**
 * The zero-LLM answer: if a prompt resolves to exactly one term, return its
 * definition formatted as markdown. Returns null when nothing resolves.
 */
export function freeAnswer(
  prompt: string,
  locale: Locale = "en",
): CannedAnswer | null {
  const { termId } = canonicalizePrompt(prompt, locale);
  if (!termId) return null;

  const localized = getLocalizedTerms(locale).find((t) => t.id === termId);
  const term = localized ?? getTerm(termId);
  if (!term || !term.definition) return null;

  return { text: renderTerm(term, locale), fromCache: false };
}

function renderTerm(term: GlossaryTerm, locale: Locale): string {
  const related = (term.related ?? [])
    .map((id) => {
      const r =
        getLocalizedTerms(locale).find((t) => t.id === id) ?? getTerm(id);
      return r?.term;
    })
    .filter(Boolean);

  let out = `**${term.term}**\n\n${term.definition}`;
  if (related.length) out += `\n\n_Related: ${related.join(", ")}_`;
  return out;
}

/**
 * Retrieve the top-K terms for a query as a compact "term: definition" block.
 * Ranking: exact id/alias/term hits first, then term-name substring, then
 * definition substring. Locale-aware via the SDK's i18n overrides.
 */
export function searchRag(
  query: string,
  locale: Locale = "en",
  k = 6,
): RagResult {
  const q = normalize(query);
  if (!q) return { block: "", ids: [] };

  const terms = getLocalizedTerms(locale);
  const scored: Array<{ term: GlossaryTerm; score: number }> = [];

  for (const t of terms) {
    const name = t.term.toLowerCase();
    const def = t.definition.toLowerCase();
    const aliasHit = t.aliases?.some((a) => q.includes(a.toLowerCase()));
    let score = 0;
    if (name === q || t.id === q || aliasHit) score = 3;
    else if (q.includes(name) || name.includes(q)) score = 2;
    else if (def.includes(q)) score = 1;
    if (score > 0) scored.push({ term: t, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.max(0, k));

  return {
    block: top.map(({ term }) => `${term.term}: ${term.definition}`).join("\n"),
    ids: top.map(({ term }) => term.id).sort(),
  };
}

/** Look up a term (id or alias) with locale overrides applied. */
export function lookupTerm(
  idOrAlias: string,
  locale: Locale = "en",
): GlossaryTerm | undefined {
  const base = getTerm(idOrAlias);
  if (!base) return undefined;
  return getLocalizedTerms(locale).find((t) => t.id === base.id) ?? base;
}

/** Canonical ids of a term's related terms (for quiz/apply context). */
export function relatedTermNames(
  idOrAlias: string,
  locale: Locale = "en",
): string[] {
  const term = getTerm(idOrAlias);
  if (!term?.related) return [];
  const localized = getLocalizedTerms(locale);
  return term.related
    .map((id) => (localized.find((t) => t.id === id) ?? getTerm(id))?.term)
    .filter((name): name is string => Boolean(name));
}
