/**
 * semantic_search — Natural language search using TF-IDF
 */

import { z } from "zod";
import { semanticSearch } from "../../services/embeddings.js";

export const semanticSearchSchema = z.object({
  query: z.string().describe("Natural language question or topic (e.g., 'how does staking work on solana?', 'what is the difference between PDAs and keypairs?')"),
  limit: z.number().min(1).max(20).optional().describe("Maximum number of results (default: 8, max: 20)"),
});

export type SemanticSearchInput = z.infer<typeof semanticSearchSchema>;

export function semanticSearchTool(input: SemanticSearchInput): string {
  const limit = input.limit ?? 8;
  const results = semanticSearch(input.query, limit);

  if (results.length === 0) {
    return `🧠 No semantic matches found for "${input.query}".\n\nTip: Try rephrasing or use 'search_glossary' for keyword matching.`;
  }

  const lines = [
    `🧠 **Semantic Search Results** for "${input.query}" (${results.length} matches):`,
    ``,
  ];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const relevance = Math.round(r.score * 100);
    const defPreview = r.term.definition.substring(0, 120) + (r.term.definition.length > 120 ? "…" : "");
    lines.push(`${i + 1}. **${r.term.term}** [${r.term.category}] — ${relevance}% relevance`);
    lines.push(`   ${defPreview}`);
    lines.push(``);
  }

  lines.push(`_Results ranked by TF-IDF cosine similarity. Use 'lookup_term' for full details._`);

  return lines.join("\n");
}
