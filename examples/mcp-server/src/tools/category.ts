/**
 * list_category — List all terms in a Solana glossary category
 */

import { z } from "zod";
import { getTermsByCategoryLocalized, validateLocale } from "../i18n-resolver.js";
import { getCategories, getTermsByCategory, type Category } from "@stbr/solana-glossary";

const validCategories = getCategories();

export const listCategorySchema = z.object({
  category: z.enum(validCategories as [string, ...string[]]).describe(
    `Category to list. Available: ${validCategories.join(", ")}`
  ),
  locale: z.enum(["en", "pt", "es"]).optional().describe("Language for results. Defaults to 'en'."),
});

export type ListCategoryInput = z.infer<typeof listCategorySchema>;

export function listCategory(input: ListCategoryInput): string {
  const locale = validateLocale(input.locale);
  const terms = getTermsByCategoryLocalized(input.category as Category, locale);

  if (terms.length === 0) {
    return `📂 No terms found in category "${input.category}".`;
  }

  const lines = [
    `📂 **${input.category}** — ${terms.length} terms:`,
    ``,
  ];

  for (const t of terms) {
    const defPreview = t.definition.substring(0, 80) + (t.definition.length > 80 ? "…" : "");
    lines.push(`• **${t.term}**: ${defPreview}`);
  }

  return lines.join("\n");
}

/**
 * List all available categories with term counts
 */
export function listAllCategories(): string {
  const cats = getCategories();
  const lines = [
    `📂 **Available Categories** (${cats.length}):`,
    ``,
  ];

  for (const cat of cats) {
    const count = getTermsByCategory(cat as Category).length;
    lines.push(`• **${cat}**: ${count} terms`);
  }

  return lines.join("\n");
}
