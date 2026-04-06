/**
 * compare_terms — Side-by-side comparison of Solana concepts
 */

import { z } from "zod";
import { resolveTermLocalized, validateLocale } from "../i18n-resolver.js";
import { type GlossaryTerm } from "@stbr/solana-glossary";

export const compareTermsSchema = z.object({
  terms: z.array(z.string()).min(2).max(5).describe("List of 2-5 term IDs or aliases to compare side by side"),
  locale: z.enum(["en", "pt", "es"]).optional().describe("Language for the response. Defaults to 'en'."),
});

export type CompareTermsInput = z.infer<typeof compareTermsSchema>;

export function compareTerms(input: CompareTermsInput): string {
  const locale = validateLocale(input.locale);

  const resolved: Array<{ input: string; term: GlossaryTerm | undefined }> = input.terms.map((t) => ({
    input: t,
    term: resolveTermLocalized(t, locale),
  }));

  const notFound = resolved.filter((r) => !r.term);
  if (notFound.length > 0) {
    return `❌ Terms not found: ${notFound.map((r) => `"${r.input}"`).join(", ")}.\n\nUse 'search_glossary' to find correct IDs.`;
  }

  const terms = resolved.map((r) => r.term!);

  const lines = [
    `⚖️ **Comparing ${terms.length} Terms:**`,
    ``,
  ];

  // Comparison table
  for (const t of terms) {
    lines.push(`---`);
    lines.push(`### ${t.term}`);
    lines.push(`**Category:** ${t.category}`);
    lines.push(`**Definition:** ${t.definition}`);
    if (t.aliases && t.aliases.length > 0) {
      lines.push(`**Aliases:** ${t.aliases.join(", ")}`);
    }
    if (t.related && t.related.length > 0) {
      lines.push(`**Related:** ${t.related.join(", ")}`);
    }
    lines.push(``);
  }

  // Find common relationships
  if (terms.length >= 2) {
    const allRelated = terms.map((t) => new Set(t.related ?? []));
    const commonRelated = [...allRelated[0]].filter((id) =>
      allRelated.every((s) => s.has(id))
    );

    lines.push(`---`);
    if (commonRelated.length > 0) {
      lines.push(`🔗 **Shared relationships:** ${commonRelated.join(", ")}`);
    } else {
      lines.push(`🔗 **No shared relationships found** — these concepts operate in different areas.`);
    }

    // Category overlap
    const categories = new Set(terms.map((t) => t.category));
    if (categories.size === 1) {
      lines.push(`📂 All terms belong to the **${terms[0].category}** category.`);
    } else {
      lines.push(`📂 Terms span **${categories.size} categories**: ${[...categories].join(", ")}`);
    }
  }

  return lines.join("\n");
}
