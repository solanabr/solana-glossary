import type { GlossaryTerm } from "../types";

const MAX_CONCEPTS = 12;

export function expandConcepts(
  base: GlossaryTerm[],
  allTerms: GlossaryTerm[],
): GlossaryTerm[] {
  const termById = new Map<string, GlossaryTerm>(allTerms.map((t) => [t.id, t]));
  const seen = new Set<string>(base.map((t) => t.id));
  const result: GlossaryTerm[] = [...base];

  for (const term of base) {
    if (result.length >= MAX_CONCEPTS) break;
    for (const relId of term.related ?? []) {
      if (result.length >= MAX_CONCEPTS) break;
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
