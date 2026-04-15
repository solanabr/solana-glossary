import * as fs from "fs";
import * as path from "path";
import { GlossaryTerm, Category, CATEGORIES } from "./types";

// When built, __dirname = dist/, so we need to go up to the package root
const dataDir = path.resolve(__dirname, "..", "data");

function loadTerms(): GlossaryTerm[] {
  const termsDir = path.join(dataDir, "terms");
  const files = fs.readdirSync(termsDir).filter((f) => f.endsWith(".json"));
  const all: GlossaryTerm[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(termsDir, file), "utf-8");
    const terms: GlossaryTerm[] = JSON.parse(content);
    all.push(...terms);
  }
  return all;
}

type TranslationMap = Record<string, { term: string; definition: string }>;

function loadTranslations(): Record<string, TranslationMap> {
  const i18nDir = path.join(dataDir, "i18n");
  const result: Record<string, TranslationMap> = {};
  for (const file of ["pt.json", "es.json"]) {
    const filePath = path.join(i18nDir, file);
    if (fs.existsSync(filePath)) {
      const locale = file.replace(".json", "");
      result[locale] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  }
  return result;
}

export const allTerms = loadTerms();
const translations = loadTranslations();

const termMap = new Map<string, GlossaryTerm>();
const aliasMap = new Map<string, string>();

for (const t of allTerms) {
  termMap.set(t.id, t);
  if (t.aliases) {
    for (const alias of t.aliases) {
      aliasMap.set(alias.toLowerCase(), t.id);
    }
  }
}

export function getTerm(idOrAlias: string): GlossaryTerm | undefined {
  const lower = idOrAlias.toLowerCase();
  return (
    termMap.get(lower) ||
    termMap.get(idOrAlias) ||
    (aliasMap.has(lower) ? termMap.get(aliasMap.get(lower)!) : undefined)
  );
}

export function searchTerms(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return allTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.id.includes(q) ||
      t.definition.toLowerCase().includes(q) ||
      t.aliases?.some((a) => a.toLowerCase().includes(q)),
  );
}

export function getTermsByCategory(category: Category): GlossaryTerm[] {
  return allTerms.filter((t) => t.category === category);
}

export function getCategories(): Category[] {
  return CATEGORIES;
}

export function localizeTerm(
  term: GlossaryTerm,
  locale?: string,
): GlossaryTerm {
  if (!locale || locale === "en") return term;
  const localeData = translations[locale];
  if (!localeData) return term;
  const override = localeData[term.id];
  if (!override) return term;
  return { ...term, term: override.term, definition: override.definition };
}

export function getRelatedTermsBFS(
  termId: string,
  depth: number = 1,
): GlossaryTerm[] {
  const visited = new Set<string>();
  const queue: { id: string; level: number }[] = [{ id: termId, level: 0 }];
  visited.add(termId);
  const result: GlossaryTerm[] = [];

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (level > 0) {
      const t = termMap.get(id);
      if (t) result.push(t);
    }
    if (level < depth) {
      const t = termMap.get(id);
      if (t?.related) {
        for (const rid of t.related) {
          if (!visited.has(rid)) {
            visited.add(rid);
            queue.push({ id: rid, level: level + 1 });
          }
        }
      }
    }
  }

  return result;
}
