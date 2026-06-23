import * as path from "path";
import * as fs from "fs";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
  aliases?: string[];
}

interface GlossaryBundle {
  terms: GlossaryTerm[];
  aliasMap: Record<string, string>;
  i18n: Record<string, Record<string, { term?: string; definition?: string }>>;
  meta: {
    totalTerms: number;
    categories: string[];
    locales: string[];
    builtAt: string;
  };
}

let bundle: GlossaryBundle | null = null;
let termsById: Map<string, GlossaryTerm> = new Map();

export function loadGlossary(extensionPath: string): GlossaryBundle {
  if (bundle) return bundle;

  const bundlePath = path.join(extensionPath, "dist", "glossary-bundle.json");
  const raw = fs.readFileSync(bundlePath, "utf-8");
  bundle = JSON.parse(raw) as GlossaryBundle;

  // Build terms-by-id index
  for (const term of bundle.terms) {
    termsById.set(term.id, term);
  }

  return bundle;
}

export function getBundle(): GlossaryBundle | null {
  return bundle;
}

/**
 * Look up a word against the alias map → return the full term or undefined.
 */
export function lookupWord(word: string): GlossaryTerm | undefined {
  if (!bundle) return undefined;

  const normalized = word.toLowerCase().replace(/[_]/g, "-");
  const termId = bundle.aliasMap[normalized];
  if (!termId) return undefined;

  return termsById.get(termId);
}

/**
 * Get a localized version of a term (falls back to English).
 */
export function getLocalizedTerm(
  term: GlossaryTerm,
  locale: string
): { term: string; definition: string } {
  if (!bundle || locale === "en") {
    return { term: term.term, definition: term.definition };
  }

  const translations = bundle.i18n[locale];
  if (!translations || !translations[term.id]) {
    return { term: term.term, definition: term.definition };
  }

  const t = translations[term.id];
  return {
    term: t.term || term.term,
    definition: t.definition || term.definition,
  };
}

/**
 * Full-text search across names, definitions, IDs, and aliases.
 */
export function searchTerms(query: string, limit = 20): GlossaryTerm[] {
  if (!bundle) return [];

  const q = query.toLowerCase();
  const scored: { term: GlossaryTerm; score: number }[] = [];

  for (const term of bundle.terms) {
    let score = 0;

    // Exact ID match
    if (term.id.toLowerCase() === q) score += 100;
    // Term name contains query
    if (term.term.toLowerCase().includes(q)) score += 50;
    // ID contains query
    if (term.id.toLowerCase().includes(q)) score += 30;
    // Alias match
    if (term.aliases?.some((a) => a.toLowerCase().includes(q))) score += 40;
    // Definition contains query
    if (term.definition.toLowerCase().includes(q)) score += 10;

    if (score > 0) {
      scored.push({ term, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.term);
}

/**
 * Get all terms in a category.
 */
export function getTermsByCategory(category: string): GlossaryTerm[] {
  if (!bundle) return [];
  return bundle.terms.filter((t) => t.category === category);
}

/**
 * Get all categories with counts.
 */
export function getCategories(): { category: string; count: number }[] {
  if (!bundle) return [];

  const counts = new Map<string, number>();
  for (const term of bundle.terms) {
    counts.set(term.category, (counts.get(term.category) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get a random term, optionally filtered by category.
 */
export function getRandomTerm(category?: string): GlossaryTerm | undefined {
  if (!bundle) return undefined;

  const pool = category
    ? bundle.terms.filter((t) => t.category === category)
    : bundle.terms;

  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get the term by ID.
 */
export function getTermById(id: string): GlossaryTerm | undefined {
  return termsById.get(id);
}
