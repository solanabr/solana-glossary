/**
 * get_learning_path — Find a learning path between two Solana concepts
 * 
 * Uses BFS on the relation graph to find the shortest conceptual path
 * from one term to another, creating a natural learning progression.
 */

import { z } from "zod";
import { findLearningPath } from "../graph.js";
import { resolveTermLocalized, localizeTerms, validateLocale } from "../i18n-resolver.js";
import { getTerm } from "@stbr/solana-glossary";

export const learningPathSchema = z.object({
  from: z.string().describe("Starting term (ID or alias) — the concept you already understand"),
  to: z.string().describe("Target term (ID or alias) — the concept you want to learn"),
  locale: z.enum(["en", "pt", "es"]).optional().describe("Language for the response. Defaults to 'en'."),
});

export type LearningPathInput = z.infer<typeof learningPathSchema>;

export function learningPath(input: LearningPathInput): string {
  const locale = validateLocale(input.locale);

  // Resolve canonical IDs
  const fromTerm = getTerm(input.from);
  const toTerm = getTerm(input.to);

  if (!fromTerm) {
    return `❌ Starting term "${input.from}" not found. Try using 'search_glossary' to find the correct ID.`;
  }
  if (!toTerm) {
    return `❌ Target term "${input.to}" not found. Try using 'search_glossary' to find the correct ID.`;
  }

  const result = findLearningPath(fromTerm.id, toTerm.id);

  if (!result.found) {
    return [
      `🛤️ **No direct learning path found** between "${fromTerm.term}" and "${toTerm.term}".`,
      ``,
      `These concepts may not be directly connected through cross-references in the glossary.`,
      ``,
      `💡 Suggestions:`,
      `• Use 'explain_concept' on each term to explore their neighborhoods`,
      `• Try finding an intermediate concept that connects both`,
      `• Use 'search_glossary' to discover related terminology`,
    ].join("\n");
  }

  const localizedPath = localizeTerms(result.path, locale);

  const lines = [
    `🛤️ **Learning Path: ${localizedPath[0].term} → ${localizedPath[localizedPath.length - 1].term}**`,
    `📏 Distance: ${result.distance} step${result.distance !== 1 ? "s" : ""}`,
    ``,
  ];

  for (let i = 0; i < localizedPath.length; i++) {
    const t = localizedPath[i];
    const isFirst = i === 0;
    const isLast = i === localizedPath.length - 1;
    const marker = isFirst ? "🟢" : isLast ? "🎯" : "🔵";
    const label = isFirst ? " (start)" : isLast ? " (goal)" : "";

    lines.push(`${marker} **Step ${i + 1}${label}: ${t.term}** [${t.category}]`);
    lines.push(`   ${t.definition}`);
    if (t.aliases && t.aliases.length > 0) {
      lines.push(`   _Also known as: ${t.aliases.join(", ")}_`);
    }
    if (i < localizedPath.length - 1) {
      lines.push(`   ↓`);
    }
    lines.push(``);
  }

  lines.push(
    `---`,
    `_💡 Each step builds on the previous concept. Read them in order for the best learning experience._`
  );

  return lines.join("\n");
}
