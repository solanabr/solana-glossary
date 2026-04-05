import type { GlossaryTerm } from "../types";

const DEFAULT_MAX = 12;

export function expandTerms(
  ranked: GlossaryTerm[],
  allTerms: GlossaryTerm[],
  max: number = DEFAULT_MAX,
): GlossaryTerm[] {
  const termById = new Map<string, GlossaryTerm>(allTerms.map((t) => [t.id, t]));
  const seen = new Set<string>(ranked.map((t) => t.id));
  const result: GlossaryTerm[] = [...ranked];

  for (const term of ranked) {
    if (result.length >= max) break;
    for (const relId of term.related ?? []) {
      if (result.length >= max) break;
      if (seen.has(relId)) continue;
      const rel = termById.get(relId);
      if (rel) {
        seen.add(relId);
        result.push(rel);
      }
    }
  }

  return result;
}
