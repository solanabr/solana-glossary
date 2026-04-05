import type { GlossaryTerm } from "../types";
import { allTerms } from "../index";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tokenize(input: string): string[] {
  return input.toLowerCase().split(/[\s\W]+/).filter(Boolean);
}

export function detectTerms(input: string, terms: GlossaryTerm[] = allTerms): GlossaryTerm[] {
  const normalizedInput = normalize(input);
  const tokens = tokenize(input);
  const seen = new Set<string>();
  const results: GlossaryTerm[] = [];

  for (const term of terms) {
    if (seen.has(term.id)) continue;

    const normalizedTerm = normalize(term.term);
    if (normalizedInput.includes(normalizedTerm)) {
      seen.add(term.id);
      results.push(term);
      continue;
    }

    const termTokens = tokenize(term.term);
    if (termTokens.length > 1) {
      const allPresent = termTokens.every((tt) => tokens.includes(tt));
      if (allPresent) {
        seen.add(term.id);
        results.push(term);
        continue;
      }
    }

    if (term.aliases) {
      for (const alias of term.aliases) {
        if (normalize(normalizedInput).includes(normalize(alias))) {
          seen.add(term.id);
          results.push(term);
          break;
        }
      }
    }
  }

  return results;
}
