// services/searchService.js
// Handles category searches and random term queries.

import { getTermsByCategory, getCategories, getRandomTerm, getTotalCount } from "../loader.js";
import { formatTerm, formatTermCompact } from "./termService.js";

const DIVIDER_THICK = "============================================================";
const DIVIDER_THIN  = "------------------------------------------------------------";

// Returns all terms in a category, as a formatted list
export function getCategoryTerms(category) {
  const terms = getTermsByCategory(category);

  if (terms.length === 0) {
    return [
      DIVIDER_THICK,
      `  Category not found: "${category}"`,
      DIVIDER_THIN,
      "  Valid categories:",
      ...getCategories().map((c) => `    - ${c}`),
      DIVIDER_THICK,
    ];
  }

  const lines = [];
  lines.push(DIVIDER_THICK);
  lines.push(`  CATEGORY: ${category.toUpperCase()} — ${terms.length} terms`);
  lines.push(DIVIDER_THICK);

  // Group into chunks of 5 per line for readability
  const ids = terms.map((t) => t.id);
  for (let i = 0; i < ids.length; i += 5) {
    lines.push("  " + ids.slice(i, i + 5).join(" | "));
  }

  lines.push(DIVIDER_THIN);
  lines.push(`  Tip: dig @<ip> -p 5353 <term-id> +short  to look up any term above`);
  lines.push(DIVIDER_THICK);

  return lines;
}

// Returns all 14 categories with term counts
export function getAllCategories() {
  const cats = getCategories();
  const lines = [];

  lines.push(DIVIDER_THICK);
  lines.push(`  SOLANA GLOSSARY — ALL CATEGORIES (${getTotalCount()} total terms)`);
  lines.push(DIVIDER_THICK);

  for (const cat of cats) {
    const count = getTermsByCategory(cat).length;
    const bar = "#".repeat(Math.round(count / 5)); // visual bar
    lines.push(`  ${cat.padEnd(26)} ${String(count).padStart(3)} terms  ${bar}`);
  }

  lines.push(DIVIDER_THIN);
  lines.push("  Usage: dig @<ip> -p 5353 find.<category> +short");
  lines.push(DIVIDER_THICK);

  return lines;
}

// Returns a random term fully formatted
export function getRandomTermFormatted() {
  const term = getRandomTerm();
  const lines = ["  ** RANDOM TERM **", ...formatTerm(term)];
  return lines;
}
