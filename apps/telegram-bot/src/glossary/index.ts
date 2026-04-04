import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Category, GlossaryTerm } from "./types.js";

export type { Category, GlossaryTerm } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readJsonFile<T>(relativePath: string): T {
  const filePath = resolve(__dirname, relativePath);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

export const allTerms: GlossaryTerm[] = [
  ...readJsonFile<GlossaryTerm[]>("./data/terms/core-protocol.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/programming-model.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/token-ecosystem.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/defi.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/zk-compression.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/infrastructure.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/security.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/dev-tools.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/network.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/blockchain-general.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/web3.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/programming-fundamentals.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/ai-ml.json"),
  ...readJsonFile<GlossaryTerm[]>("./data/terms/solana-ecosystem.json"),
];

const termMap = new Map<string, GlossaryTerm>(
  allTerms.map((term) => [term.id, term]),
);

const aliasMap = new Map<string, string>();
for (const term of allTerms) {
  for (const alias of term.aliases ?? []) {
    aliasMap.set(alias.toLowerCase(), term.id);
  }
}

interface I18nEntry {
  term: string;
  definition: string;
}

const ptMap = new Map<string, I18nEntry>();
const esMap = new Map<string, I18nEntry>();

for (const [id, entry] of Object.entries(
  readJsonFile<Record<string, I18nEntry>>("./data/i18n/pt.json"),
)) {
  ptMap.set(id, entry as I18nEntry);
}

for (const [id, entry] of Object.entries(
  readJsonFile<Record<string, I18nEntry>>("./data/i18n/es.json"),
)) {
  esMap.set(id, entry as I18nEntry);
}

export function getTerm(idOrAlias: string): GlossaryTerm | undefined {
  const lower = idOrAlias.toLowerCase();
  return termMap.get(idOrAlias) ?? termMap.get(aliasMap.get(lower) ?? "");
}

export function getTermLocalized(
  id: string,
  locale: "pt" | "en" | "es",
): { term: string; definition: string } | undefined {
  const term = getTerm(id);
  if (!term) return undefined;

  if (locale === "en") {
    return { term: term.term, definition: term.definition };
  }

  const localized = (locale === "pt" ? ptMap : esMap).get(id);
  if (!localized) {
    return { term: term.term, definition: term.definition };
  }

  return {
    term: localized.term || term.term,
    definition: localized.definition || term.definition,
  };
}

export function getTermsByCategory(category: Category): GlossaryTerm[] {
  return allTerms.filter((term) => term.category === category);
}

export function searchTerms(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return allTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(q) ||
      term.definition.toLowerCase().includes(q) ||
      term.id.includes(q) ||
      term.aliases?.some((alias) => alias.toLowerCase().includes(q)),
  );
}

export function getCategories(): Category[] {
  return [
    "core-protocol",
    "programming-model",
    "token-ecosystem",
    "defi",
    "zk-compression",
    "infrastructure",
    "security",
    "dev-tools",
    "network",
    "blockchain-general",
    "web3",
    "programming-fundamentals",
    "ai-ml",
    "solana-ecosystem",
  ];
}
