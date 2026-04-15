/**
 * explain_concept — Deep exploration of a Solana concept and its relationships
 * 
 * Uses DFS graph traversal to find related concepts up to N levels deep,
 * building a rich knowledge context around a term.
 */

import { z } from "zod";
import { explainConcept } from "../graph.js";
import { resolveTermLocalized, localizeTerms, validateLocale } from "../i18n-resolver.js";

export const explainConceptSchema = z.object({
  term: z.string().describe("The term to explore in depth (ID or alias)"),
  depth: z.number().min(1).max(4).optional().describe("How many levels of relationships to explore (1-4, default: 2). Higher = more context but more output."),
  locale: z.enum(["en", "pt", "es"]).optional().describe("Language for the response. Defaults to 'en'."),
});

export type ExplainConceptInput = z.infer<typeof explainConceptSchema>;

export function explainConceptTool(input: ExplainConceptInput): string {
  const locale = validateLocale(input.locale);
  const depth = input.depth ?? 2;

  // Resolve the term first to get canonical ID
  const baseTerm = resolveTermLocalized(input.term, "en"); // always resolve from English
  if (!baseTerm) {
    return `❌ Term "${input.term}" not found. Try using the 'search_glossary' tool to find the correct term ID.`;
  }

  const result = explainConcept(baseTerm.id, depth);

  // Localize all terms
  const root = resolveTermLocalized(baseTerm.id, locale) ?? result.root;
  const related = localizeTerms(result.relatedTerms, locale);

  const lines = [
    `🧠 **Deep Dive: ${root.term}**`,
    ``,
    `📖 ${root.definition}`,
    ``,
    `🏷️ Category: ${root.category}`,
  ];

  if (root.aliases && root.aliases.length > 0) {
    lines.push(`🔤 Aliases: ${root.aliases.join(", ")}`);
  }

  lines.push(
    ``,
    `🔗 **Connected Concepts** (${related.length} terms found, depth: ${depth}):`,
    ``
  );

  // Group by category for better readability
  const byCategory = new Map<string, typeof related>();
  for (const t of related) {
    const cat = t.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(t);
  }

  for (const [category, terms] of byCategory) {
    lines.push(`  📂 **${category}**:`);
    for (const t of terms) {
      const defPreview = t.definition.substring(0, 100) + (t.definition.length > 100 ? "…" : "");
      lines.push(`    • **${t.term}**: ${defPreview}`);
    }
    lines.push(``);
  }

  lines.push(
    `---`,
    `_Explored ${result.totalExplored} nodes in the knowledge graph._`
  );

  return lines.join("\n");
}
