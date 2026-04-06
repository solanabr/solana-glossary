// services/searchService.js
// Handles category searches, keyword search, term-of-the-day, and random term queries.

import { getTermsByCategory, getCategories, getRandomTerm, getTotalCount, allTermsList } from "../loader.js";
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
  lines.push(`  CATEGORY: ${category.toUpperCase()} -- ${terms.length} terms`);
  lines.push(DIVIDER_THICK);

  // Group into chunks of 5 per line for readability
  const ids = terms.map((t) => t.id);
  for (let i = 0; i < ids.length; i += 5) {
    lines.push("  " + ids.slice(i, i + 5).join(" | "));
  }

  lines.push(DIVIDER_THIN);
  lines.push(`  Tip: sol <term-id>  or  dig <term-id> @sdns.fun +short`);
  lines.push(DIVIDER_THICK);

  return lines;
}

// Returns all 14 categories with term counts
export function getAllCategories() {
  const cats = getCategories();
  const lines = [];

  lines.push(DIVIDER_THICK);
  lines.push(`  SOLANA GLOSSARY -- ALL CATEGORIES (${getTotalCount()} total terms)`);
  lines.push(DIVIDER_THICK);

  for (const cat of cats) {
    const count = getTermsByCategory(cat).length;
    const bar = "#".repeat(Math.round(count / 5)); // visual bar
    lines.push(`  ${cat.padEnd(26)} ${String(count).padStart(3)} terms  ${bar}`);
  }

  lines.push(DIVIDER_THIN);
  lines.push("  Usage: sol find.<category>  or  dig find.<category> @sdns.fun +short");
  lines.push(DIVIDER_THICK);

  return lines;
}

// Returns a random term fully formatted
export function getRandomTermFormatted() {
  const term = getRandomTerm();
  const lines = ["  ** RANDOM TERM **", ...formatTerm(term)];
  return lines;
}

// Keyword search: search.<word> → terms matching in name, definition, or aliases
export function keywordSearch(keyword) {
  const q = keyword.toLowerCase().trim();

  if (q.length < 2) {
    return [
      DIVIDER_THICK,
      "  Keyword too short — please use 2+ characters",
      DIVIDER_THICK,
    ];
  }

  // Import lazily to avoid circular dep — use the exported array from loader
  const all = allTermsList();

  const matches = all.filter((t) => {
    const inId   = t.id.includes(q);
    const inTerm = t.term.toLowerCase().includes(q);
    const inDef  = t.definition.toLowerCase().includes(q);
    const inAlias = (t.aliases || []).some((a) => a.toLowerCase().includes(q));
    return inId || inTerm || inDef || inAlias;
  });

  if (matches.length === 0) {
    return [
      DIVIDER_THICK,
      `  No terms found for: "${keyword}"`,
      DIVIDER_THIN,
      "  Try a shorter keyword or browse a category:",
      "  sol find.defi  or  dig find.defi @sdns.fun +short",
      DIVIDER_THICK,
    ];
  }

  const lines = [];
  lines.push(DIVIDER_THICK);
  lines.push(`  SEARCH: "${keyword}" -- ${matches.length} result${matches.length > 1 ? "s" : ""} found`);
  lines.push(DIVIDER_THICK);

  // Show up to 15 results to keep output manageable
  const shown = matches.slice(0, 15);
  for (const t of shown) {
    const short = t.definition.length > 70 ? t.definition.slice(0, 67) + "..." : t.definition;
    lines.push(`  [${t.category}] ${t.term}`);
    lines.push(`    ID: ${t.id}`);
    lines.push(`    ${short}`);
    lines.push("");
  }

  if (matches.length > 15) {
    lines.push(`  ... and ${matches.length - 15} more. Try a more specific keyword.`);
  }

  lines.push(DIVIDER_THIN);
  lines.push("  Look up any result:  sol <term-id>  or  dig <term-id> @sdns.fun +short");
  lines.push(DIVIDER_THICK);

  return lines;
}

// Term of the day: deterministic based on current date (changes daily)
export function getTermOfTheDay() {
  const all = allTermsList();

  // Create a date seed: YYYYMMDD as a number → index into allTerms
  const now = new Date();
  const dateSeed =
    now.getFullYear() * 10000 +
    (now.getMonth() + 1) * 100 +
    now.getDate();
  const index = dateSeed % all.length;
  const term = all[index];

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return [
    `  ** TERM OF THE DAY -- ${dateStr} **`,
    ...formatTerm(term),
  ];
}
