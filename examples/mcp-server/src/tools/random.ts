/**
 * random_term — Get random Solana glossary terms for discovery and quizzes
 */

import { z } from "zod";
import { allTerms, getCategories, type Category } from "@stbr/solana-glossary";
import { localizeTerms, validateLocale } from "../i18n-resolver.js";

export const randomTermSchema = z.object({
  count: z.number().min(1).max(10).optional().describe("Number of random terms to return (1-10, default: 1)"),
  category: z.string().optional().describe("Optional category filter — only return terms from this category"),
  locale: z.enum(["en", "pt", "es"]).optional().describe("Language for the response. Defaults to 'en'."),
});

export type RandomTermInput = z.infer<typeof randomTermSchema>;

export function randomTerm(input: RandomTermInput): string {
  const locale = validateLocale(input.locale);
  const count = input.count ?? 1;

  let pool = allTerms;
  if (input.category) {
    const categories = getCategories();
    if (!categories.includes(input.category as Category)) {
      return `❌ Unknown category "${input.category}".\n\nAvailable categories: ${categories.join(", ")}`;
    }
    pool = allTerms.filter((t) => t.category === input.category);
  }

  if (pool.length === 0) {
    return `❌ No terms available in category "${input.category}".`;
  }

  // Fisher-Yates shuffle a copy, take first N
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = localizeTerms(shuffled.slice(0, Math.min(count, pool.length)), locale);

  const lines = [
    `🎲 **${selected.length} Random Term${selected.length !== 1 ? "s" : ""}**${input.category ? ` from _${input.category}_` : ""}:`,
    ``,
  ];

  for (const t of selected) {
    lines.push(`### ${t.term}`);
    lines.push(`📖 ${t.definition}`);
    lines.push(`🏷️ Category: ${t.category}`);
    if (t.aliases && t.aliases.length > 0) {
      lines.push(`🔤 Aliases: ${t.aliases.join(", ")}`);
    }
    if (t.related && t.related.length > 0) {
      lines.push(`🔗 Related: ${t.related.slice(0, 5).join(", ")}${t.related.length > 5 ? "…" : ""}`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}
