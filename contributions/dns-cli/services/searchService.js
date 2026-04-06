// services/searchService.js
// Handles category searches, keyword search, term-of-the-day, and random term queries.

import { getTermsByCategory, getCategories, getRandomTerm, getTotalCount, allTermsList } from "../loader.js";
import { formatTerm, formatTermCompact } from "./termService.js";

const DIVIDER_THICK = "============================================================";
const DIVIDER_THIN  = "------------------------------------------------------------";

// Returns terms in a category, paginated to avoid DNS UDP 512-byte limit.
// find.defi     → page 1 (terms 1-20)
// find.defi.2   → page 2 (terms 21-40), etc.
export function getCategoryTerms(rawQuery) {
  // Parse pagination: "defi.2" → category=defi, page=2
  const parts = rawQuery.split(".");
  let page = 1;
  let category = rawQuery;

  // Check if last segment is a number (page number)
  const lastPart = parts[parts.length - 1];
  if (parts.length > 1 && /^\d+$/.test(lastPart)) {
    page = parseInt(lastPart);
    category = parts.slice(0, -1).join(".");
  }

  const terms = getTermsByCategory(category);

  if (terms.length === 0) {
    return [
      DIVIDER_THICK,
      `  Category not found: "${category}"`,
      DIVIDER_THIN,
      "  Valid categories:",
      ...getCategories().map((c) => `    ${c}`),
      DIVIDER_THICK,
    ];
  }

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(terms.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, terms.length);
  const pageTerms = terms.slice(start, end);

  if (start >= terms.length) {
    return [
      DIVIDER_THICK,
      `  Page ${page} out of range — only ${totalPages} page(s) for "${category}"`,
      DIVIDER_THICK,
    ];
  }

  const lines = [];
  lines.push(DIVIDER_THICK);
  lines.push(`  ${category.toUpperCase()} — ${terms.length} terms (page ${page}/${totalPages})`);
  lines.push(DIVIDER_THICK);

  // 4 terms per line to keep lines short
  const ids = pageTerms.map((t) => t.id);
  for (let i = 0; i < ids.length; i += 4) {
    lines.push("  " + ids.slice(i, i + 4).join(" | "));
  }

  lines.push(DIVIDER_THIN);
  if (page < totalPages) {
    lines.push(`  Next page: sol find.${category}.${page + 1}`);
  }
  lines.push(`  Look up a term: sol <term-id>`);
  lines.push(DIVIDER_THICK);

  return lines;
}

// Returns all 14 categories with term counts (compact, single-line each)
export function getAllCategories() {
  const cats = getCategories();
  const lines = [];

  lines.push(DIVIDER_THICK);
  lines.push(`  SOLANA GLOSSARY — ${getTotalCount()} terms across ${cats.length} categories`);
  lines.push(DIVIDER_THIN);

  for (const cat of cats) {
    const count = getTermsByCategory(cat).length;
    lines.push(`  ${cat.padEnd(28)} ${String(count).padStart(3)} terms`);
  }

  lines.push(DIVIDER_THIN);
  lines.push("  Browse: sol find.<category>");
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
  lines.push(`  SEARCH: "${keyword}" — ${matches.length} result${matches.length > 1 ? "s" : ""} found`);
  lines.push(DIVIDER_THIN);

  // Show max 8 results to stay within DNS UDP packet limits
  const shown = matches.slice(0, 8);
  for (const t of shown) {
    const short = t.definition.length > 60
      ? t.definition.slice(0, 57).replace(/\s+\S*$/, "") + "..."
      : t.definition;
    lines.push(`  ${t.term} [${t.category}]`);
    lines.push(`    ${short}`);
  }

  if (matches.length > 8) {
    lines.push(DIVIDER_THIN);
    lines.push(`  +${matches.length - 8} more. Try a specific term: sol ${shown[0].id}`);
  }

  lines.push(DIVIDER_THIN);
  lines.push("  sol <term-id> to look up any result above");
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
