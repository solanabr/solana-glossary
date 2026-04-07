import type { Locale, LocalizedGlossaryTerm } from "../types/glossary.js";
import { getAllTerms, getTerm, searchGlossary } from "./loader.js";

type PatternEntry = {
  pattern: RegExp;
  hints: string[];
};

const CODE_PATTERNS: PatternEntry[] = [
  { pattern: /#\s*\[\s*account\b/i, hints: ["account", "anchor"] },
  { pattern: /derive\s*\(\s*Accounts\s*\)/i, hints: ["account", "anchor"] },
  { pattern: /\bContext\s*</i, hints: ["instruction", "anchor"] },
  { pattern: /\bSigner\s*</i, hints: ["signer", "account"] },
  { pattern: /\bAccount\s*</i, hints: ["account"] },
  { pattern: /\bProgram\s*</i, hints: ["program"] },
  { pattern: /\bPDA\b|\bfind_program_address\b/i, hints: ["pda", "seeds", "bump"] },
  { pattern: /\bseeds\b/i, hints: ["seeds", "pda"] },
  { pattern: /\bbump\b/i, hints: ["bump", "pda"] },
  { pattern: /\binvoke_signed\b/i, hints: ["invoke-signed", "cpi"] },
  { pattern: /\binvoke\b/i, hints: ["invoke", "instruction"] },
  { pattern: /\bCpiContext\b|\bCPI\b/i, hints: ["cpi", "program"] },
  { pattern: /\bIDL\b/i, hints: ["idl", "anchor"] },
  { pattern: /\bsimulateTransaction\b/i, hints: ["transaction-simulation", "transaction", "rpc"] },
  { pattern: /\brent\b/i, hints: ["rent", "account"] },
  { pattern: /\bblockhash\b/i, hints: ["blockhash", "transaction"] },
];

function uniqueTerms(terms: Array<LocalizedGlossaryTerm | undefined>): LocalizedGlossaryTerm[] {
  const seen = new Set<string>();
  const resolved: LocalizedGlossaryTerm[] = [];

  for (const term of terms) {
    if (!term || seen.has(term.id)) continue;
    seen.add(term.id);
    resolved.push(term);
  }

  return resolved;
}

function resolveHint(hint: string, locale: Locale): LocalizedGlossaryTerm | undefined {
  const direct = getTerm(hint, locale);
  if (direct) return direct;
  return searchGlossary(hint, locale, 1)[0];
}

function scoreMentionTerms(input: string, locale: Locale, minimumLength = 4): LocalizedGlossaryTerm[] {
  if (!input.trim()) return [];

  const lowerInput = input.toLowerCase();
  const scores = new Map<string, number>();

  for (const term of getAllTerms(locale)) {
    const candidates = [term.id, term.term, ...(term.aliases ?? [])];
    for (const candidate of candidates) {
      const normalized = candidate.trim().toLowerCase();
      if (normalized.length < minimumLength) continue;
      if (!lowerInput.includes(normalized)) continue;

      const bonus = normalized.includes(" ") ? 3 : 1;
      scores.set(term.id, (scores.get(term.id) ?? 0) + bonus);
    }
  }

  return [...scores.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      return left[0].localeCompare(right[0]);
    })
    .slice(0, 8)
    .map(([termId]) => getTerm(termId, locale))
    .filter((term): term is LocalizedGlossaryTerm => Boolean(term));
}

function matchPatterns(input: string, locale: Locale, patterns: PatternEntry[]): LocalizedGlossaryTerm[] {
  if (!input.trim()) return [];

  return uniqueTerms(
    patterns
      .filter((entry) => entry.pattern.test(input))
      .flatMap((entry) => entry.hints.map((hint) => resolveHint(hint, locale))),
  );
}

export function detectConceptsInCode(code: string, locale: Locale = "en"): LocalizedGlossaryTerm[] {
  return uniqueTerms([
    ...matchPatterns(code, locale, CODE_PATTERNS),
    ...scoreMentionTerms(code, locale, 4),
  ]).slice(0, 10);
}

export function detectConceptsInText(text: string, locale: Locale = "en"): LocalizedGlossaryTerm[] {
  return uniqueTerms([
    ...searchGlossary(text, locale, 6),
    ...scoreMentionTerms(text, locale, 4),
  ]).slice(0, 10);
}

export function detectConceptIdsInCode(code: string, locale: Locale = "en"): string[] {
  return detectConceptsInCode(code, locale).map((term) => term.id);
}

export function detectConceptIdsInText(text: string, locale: Locale = "en"): string[] {
  return detectConceptsInText(text, locale).map((term) => term.id);
}
