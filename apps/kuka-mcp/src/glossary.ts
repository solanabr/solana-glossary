import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
  aliases?: string[];
}

interface LocaleOverride {
  term?: string;
  definition?: string;
}

// Resolve data directory relative to the repo root
const DATA_DIR = resolve(__dirname, "..", "..", "..", "data");
const TERMS_DIR = join(DATA_DIR, "terms");
const I18N_DIR = join(DATA_DIR, "i18n");

// Load all terms at startup
function loadAllTerms(): GlossaryTerm[] {
  const terms: GlossaryTerm[] = [];
  const files = readdirSync(TERMS_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(TERMS_DIR, file), "utf-8"));
    terms.push(...data);
  }
  return terms;
}

export const allTerms = loadAllTerms();

// Build lookup maps
const termMap = new Map<string, GlossaryTerm>(
  allTerms.map((t) => [t.id, t])
);

const aliasMap = new Map<string, string>();
for (const t of allTerms) {
  for (const alias of t.aliases ?? []) {
    aliasMap.set(alias.toLowerCase(), t.id);
  }
}

// Load i18n overrides
const i18nCache = new Map<string, Record<string, LocaleOverride>>();

function loadLocale(locale: string): Record<string, LocaleOverride> {
  if (i18nCache.has(locale)) return i18nCache.get(locale)!;
  try {
    const data = JSON.parse(
      readFileSync(join(I18N_DIR, `${locale}.json`), "utf-8")
    );
    i18nCache.set(locale, data);
    return data;
  } catch {
    return {};
  }
}

function applyLocale(term: GlossaryTerm, locale?: string): GlossaryTerm {
  if (!locale || locale === "en") return term;
  const overrides = loadLocale(locale);
  const o = overrides[term.id];
  if (!o) return term;
  return { ...term, term: o.term ?? term.term, definition: o.definition ?? term.definition };
}

// --- Public API ---

export function getTerm(
  idOrAlias: string,
  locale?: string
): GlossaryTerm | undefined {
  const lower = idOrAlias.toLowerCase();
  const term =
    termMap.get(idOrAlias) ??
    termMap.get(lower) ??
    termMap.get(aliasMap.get(lower) ?? "");
  return term ? applyLocale(term, locale) : undefined;
}

export function searchTerms(query: string, locale?: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return allTerms
    .filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.id.includes(q) ||
        t.aliases?.some((a) => a.toLowerCase().includes(q))
    )
    .slice(0, 20)
    .map((t) => applyLocale(t, locale));
}

export function getTermsByCategory(
  category: string,
  locale?: string
): GlossaryTerm[] {
  return allTerms
    .filter((t) => t.category === category)
    .map((t) => applyLocale(t, locale));
}

export function getCategories(): string[] {
  return [...new Set(allTerms.map((t) => t.category))].sort();
}

export function getRelated(
  termId: string,
  depth: number = 2,
  locale?: string
): GlossaryTerm[] {
  const visited = new Set<string>();
  const result: GlossaryTerm[] = [];

  function walk(id: string, currentDepth: number) {
    if (currentDepth > depth || visited.has(id)) return;
    visited.add(id);
    const term = termMap.get(id);
    if (!term) return;
    if (id !== termId) result.push(applyLocale(term, locale));
    for (const relId of term.related ?? []) {
      walk(relId, currentDepth + 1);
    }
  }

  walk(termId, 0);
  return result;
}

export function generateQuiz(
  category?: string,
  count: number = 5,
  locale?: string
): Array<{
  question: string;
  answer: string;
  term_id: string;
  category: string;
}> {
  let pool = category
    ? allTerms.filter((t) => t.category === category)
    : allTerms;

  // Filter terms with non-empty definitions
  pool = pool.filter((t) => t.definition.length > 10);

  // Shuffle and pick
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((t) => {
    const localized = applyLocale(t, locale);
    return {
      question: `What is "${localized.term}"?`,
      answer: localized.definition,
      term_id: t.id,
      category: t.category,
    };
  });
}

export function generateContext(
  termIds?: string[],
  category?: string,
  locale?: string
): { context: string; term_count: number; estimated_tokens: number } {
  let terms: GlossaryTerm[];

  if (termIds && termIds.length > 0) {
    terms = termIds
      .map((id) => getTerm(id, locale))
      .filter((t): t is GlossaryTerm => t !== undefined);
  } else if (category) {
    terms = getTermsByCategory(category, locale);
  } else {
    // Default: core concepts
    terms = getTermsByCategory("core-protocol", locale).slice(0, 20);
  }

  const lines = terms.map((t) => {
    const related = t.related?.length
      ? ` [Related: ${t.related.join(", ")}]`
      : "";
    return `- ${t.term}: ${t.definition}${related}`;
  });

  const context = `# Solana Glossary Context (${terms.length} terms)\n\n${lines.join("\n")}`;
  const estimated_tokens = Math.ceil(context.length / 4);

  return { context, term_count: terms.length, estimated_tokens };
}
