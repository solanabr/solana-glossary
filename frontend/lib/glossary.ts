// Server-only — do NOT import in Client Components
import "server-only";
import fs from "fs";
import path from "path";
import {
  CATEGORIES,
  type Category,
  type GlossaryTerm,
  type Locale,
} from "./glossary-config";

export type { Category, GlossaryTerm, Locale };
export { CATEGORIES, CATEGORY_LABELS, CATEGORY_EMOJI } from "./glossary-config";

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function getDataDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "node_modules/@stbr/solana-glossary/data"),
    path.resolve(__dirname, "../../node_modules/@stbr/solana-glossary/data"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Cannot find @stbr/solana-glossary data directory");
}

interface LocalizedEntry {
  term: string;
  definition: string;
}

let _allTerms: GlossaryTerm[] | null = null;

export function getAllTerms(): GlossaryTerm[] {
  if (_allTerms) return _allTerms;
  const dir = getDataDir();
  const terms: GlossaryTerm[] = [];
  for (const cat of CATEGORIES) {
    const file = path.join(dir, "terms", `${cat}.json`);
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as GlossaryTerm[];
      terms.push(...raw);
    }
  }
  _allTerms = terms;
  return terms;
}

const _i18nCache = new Map<string, Record<string, LocalizedEntry>>();

function getI18n(locale: Locale): Record<string, LocalizedEntry> {
  if (locale === "en") return {};
  if (_i18nCache.has(locale)) return _i18nCache.get(locale)!;
  const dir = getDataDir();
  const file = path.join(dir, "i18n", `${locale}.json`);
  const data = fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, LocalizedEntry>)
    : {};
  _i18nCache.set(locale, data);
  return data;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export function getTerm(idOrAlias: string): GlossaryTerm | undefined {
  const terms = getAllTerms();
  const lower = idOrAlias.toLowerCase();
  return (
    terms.find((t) => t.id === idOrAlias) ??
    terms.find((t) => t.aliases?.some((a) => a.toLowerCase() === lower))
  );
}

export function searchTerms(query: string, limit = 50): GlossaryTerm[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return getAllTerms()
    .filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.aliases?.some((a) => a.toLowerCase().includes(q))
    )
    .slice(0, limit);
}

export function getTermsByCategory(cat: Category): GlossaryTerm[] {
  return getAllTerms().filter((t) => t.category === cat);
}

export function getRelatedTerms(id: string): GlossaryTerm[] {
  const term = getTerm(id);
  if (!term?.related?.length) return [];
  return term.related.flatMap((r) => {
    const found = getTerm(r);
    return found ? [found] : [];
  });
}

export function localizeTerm(
  term: GlossaryTerm,
  locale: Locale
): { term: string; definition: string } {
  if (locale === "en") return { term: term.term, definition: term.definition };
  const i18n = getI18n(locale);
  const loc = i18n[term.id];
  return {
    term: loc?.term ?? term.term,
    definition: loc?.definition ?? term.definition,
  };
}

export function getCategoryStats(): Record<Category, number> {
  const all = getAllTerms();
  return Object.fromEntries(
    CATEGORIES.map((cat) => [cat, all.filter((t) => t.category === cat).length])
  ) as Record<Category, number>;
}
