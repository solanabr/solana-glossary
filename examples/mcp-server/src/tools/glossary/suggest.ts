/**
 * suggest_terms — Fuzzy term suggestions for misspelled or partial queries
 */

import { z } from "zod";
import { fuzzySearch } from "../../utils/fuzzy.js";

export const suggestTermsSchema = z.object({
  query: z.string().describe("The misspelled or partial term to get suggestions for (e.g., 'validtor', 'pruf of histori')"),
  limit: z.number().min(1).max(20).optional().describe("Maximum number of suggestions (default: 5, max: 20)"),
});

export type SuggestTermsInput = z.infer<typeof suggestTermsSchema>;

export function suggestTerms(input: SuggestTermsInput): string {
  const limit = input.limit ?? 5;
  const results = fuzzySearch(input.query, limit);

  if (results.length === 0) {
    return `🔍 No suggestions found for "${input.query}".\n\nTip: Try a different spelling or use 'search_glossary' for full-text search.`;
  }

  const lines = [
    `💡 **Suggestions for "${input.query}"** (${results.length} matches):`,
    ``,
  ];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const confidence = Math.round(r.score * 100);
    const defPreview = r.term.definition.substring(0, 100) + (r.term.definition.length > 100 ? "…" : "");
    lines.push(`${i + 1}. **${r.term.term}** (${confidence}% match)`);
    lines.push(`   ${defPreview}`);
    if (r.matchedOn !== "term") {
      lines.push(`   _Matched via: ${r.matchedOn}_`);
    }
    lines.push(``);
  }

  lines.push(`_Use 'lookup_term' with any of these IDs for full details._`);

  return lines.join("\n");
}
