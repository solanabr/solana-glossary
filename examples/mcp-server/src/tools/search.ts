/**
 * search_glossary — Full-text search across all Solana terms
 */

import { z } from "zod";
import { searchTermsLocalized, validateLocale } from "../i18n-resolver.js";

export const searchGlossarySchema = z.object({
  query: z.string().describe("Search query to find matching terms (searches names, definitions, aliases)"),
  limit: z.number().min(1).max(50).optional().describe("Maximum number of results to return (default: 10, max: 50)"),
  locale: z.enum(["en", "pt", "es"]).optional().describe("Language for results. Defaults to 'en'."),
});

export type SearchGlossaryInput = z.infer<typeof searchGlossarySchema>;

export function searchGlossary(input: SearchGlossaryInput): string {
  const locale = validateLocale(input.locale);
  const limit = input.limit ?? 10;
  const results = searchTermsLocalized(input.query, locale);

  if (results.length === 0) {
    return `🔍 No results found for "${input.query}".\n\nTip: Try shorter or more general search terms.`;
  }

  const shown = results.slice(0, limit);
  const lines = [
    `🔍 Found ${results.length} result${results.length !== 1 ? "s" : ""} for "${input.query}"${results.length > limit ? ` (showing top ${limit})` : ""}:`,
    ``,
  ];

  for (let i = 0; i < shown.length; i++) {
    const t = shown[i];
    const defPreview = t.definition.substring(0, 120) + (t.definition.length > 120 ? "…" : "");
    lines.push(`${i + 1}. **${t.term}** [${t.category}]`);
    lines.push(`   ${defPreview}`);
    if (t.aliases && t.aliases.length > 0) {
      lines.push(`   _Aliases: ${t.aliases.join(", ")}_`);
    }
    lines.push(``);
  }

  if (results.length > limit) {
    lines.push(`_…and ${results.length - limit} more results. Increase 'limit' to see more._`);
  }

  return lines.join("\n");
}
