import type { GlossaryTerm } from "../types";
import { getTerm, searchTerms } from "../index";
import { INTENT_MAP } from "./intentMap";

export function resolveConcepts(intents: string[], terms: GlossaryTerm[]): GlossaryTerm[] {
  const termById = new Map<string, GlossaryTerm>(terms.map((t) => [t.id, t]));
  const seen = new Set<string>();
  const results: GlossaryTerm[] = [];

  const keywords = intents.flatMap((intent) => INTENT_MAP[intent] ?? []);
  const uniqueKeywords = Array.from(new Set(keywords));

  for (const keyword of uniqueKeywords) {
    const direct = getTerm(keyword);
    if (direct && termById.has(direct.id) && !seen.has(direct.id)) {
      seen.add(direct.id);
      results.push(termById.get(direct.id)!);
      continue;
    }

    const searched = searchTerms(keyword).filter((t) => termById.has(t.id));
    for (const t of searched.slice(0, 2)) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        results.push(termById.get(t.id)!);
      }
    }
  }

  return results;
}
