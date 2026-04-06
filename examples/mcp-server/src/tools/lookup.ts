/**
 * lookup_term — Look up a Solana term by ID or alias
 *
 * Enhanced with practical code examples, tags, and fuzzy fallback suggestions.
 */

import { z } from "zod";
import { resolveTermLocalized, validateLocale } from "../i18n-resolver.js";
import { getTerm, type GlossaryTerm } from "@stbr/solana-glossary";
import { getEnrichment } from "../data/glossary-index.js";
import { fuzzySearch } from "../utils/fuzzy.js";

export const lookupTermSchema = z.object({
  term: z.string().describe("The term ID, name, or alias to look up (e.g., 'pda', 'Proof of History', 'PoH')"),
  locale: z.enum(["en", "pt", "es"]).optional().describe("Language for the response. Defaults to 'en'. Use 'pt' for Portuguese or 'es' for Spanish."),
});

export type LookupTermInput = z.infer<typeof lookupTermSchema>;

export function lookupTerm(input: LookupTermInput): string {
  const locale = validateLocale(input.locale);
  const term = resolveTermLocalized(input.term, locale);

  if (!term) {
    // Fuzzy fallback — suggest similar terms
    const suggestions = fuzzySearch(input.term, 5);
    if (suggestions.length > 0) {
      const suggestionList = suggestions
        .map((s, i) => `  ${i + 1}. **${s.term.term}** (${Math.round(s.score * 100)}% match)`)
        .join("\n");
      return [
        `❌ Term "${input.term}" not found.`,
        ``,
        `💡 Did you mean:`,
        suggestionList,
        ``,
        `_Use one of these with 'lookup_term' or try 'search_glossary' for full-text search._`,
      ].join("\n");
    }

    return `❌ Term "${input.term}" not found.\n\nTip: Try searching with the 'search_glossary' or 'suggest_terms' tools.`;
  }

  // Resolve related terms for richer context
  const relatedDetails: string[] = [];
  for (const relId of term.related ?? []) {
    const rel = resolveTermLocalized(relId, locale);
    if (rel) {
      relatedDetails.push(`  • ${rel.term}: ${rel.definition.substring(0, 100)}${rel.definition.length > 100 ? "…" : ""}`);
    }
  }

  const parts = [
    `📖 **${term.term}**`,
    ``,
    `${term.definition}`,
    ``,
    `🏷️ Category: ${term.category}`,
  ];

  if (term.aliases && term.aliases.length > 0) {
    parts.push(`🔤 Aliases: ${term.aliases.join(", ")}`);
  }

  // Enrichment: practical examples + tags
  const enrichment = getEnrichment(term.id);
  if (enrichment) {
    if (enrichment.tags.length > 0) {
      parts.push(`🏷️ Tags: ${enrichment.tags.join(", ")}`);
    }
    if (enrichment.useCase) {
      parts.push(``, `💡 **Use case:** ${enrichment.useCase}`);
    }
    if (enrichment.example) {
      parts.push(``, `📝 **Code Example:**`, "```", enrichment.example, "```");
    }
  }

  if (relatedDetails.length > 0) {
    parts.push(``, `🔗 Related Terms:`, ...relatedDetails);
  }

  if (locale !== "en") {
    parts.push(``, `🌐 Language: ${locale === "pt" ? "Português" : "Español"}`);
  }

  return parts.join("\n");
}
