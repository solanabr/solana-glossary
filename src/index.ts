import type { GlossaryTerm, Category } from "./types";

import coreProtocol from "../data/terms/core-protocol.json";
import programmingModel from "../data/terms/programming-model.json";
import tokenEcosystem from "../data/terms/token-ecosystem.json";
import defi from "../data/terms/defi.json";
import zkCompression from "../data/terms/zk-compression.json";
import infrastructure from "../data/terms/infrastructure.json";
import security from "../data/terms/security.json";
import devTools from "../data/terms/dev-tools.json";
import network from "../data/terms/network.json";
import blockchainGeneral from "../data/terms/blockchain-general.json";
import web3 from "../data/terms/web3.json";
import programmingFundamentals from "../data/terms/programming-fundamentals.json";
import aiMl from "../data/terms/ai-ml.json";
import solanaEcosystem from "../data/terms/solana-ecosystem.json";

// i18n data
import ptI18n from "../data/i18n/pt.json";
import esI18n from "../data/i18n/es.json";

export type { GlossaryTerm, Category } from "./types";

export const allTerms: GlossaryTerm[] = [
  ...coreProtocol,
  ...programmingModel,
  ...tokenEcosystem,
  ...defi,
  ...zkCompression,
  ...infrastructure,
  ...security,
  ...devTools,
  ...network,
  ...blockchainGeneral,
  ...web3,
  ...programmingFundamentals,
  ...aiMl,
  ...solanaEcosystem,
] as GlossaryTerm[];

// Lookup maps built once at import time
const termMap = new Map<string, GlossaryTerm>(allTerms.map((t) => [t.id, t]));

const aliasMap = new Map<string, string>();
for (const t of allTerms) {
  for (const alias of t.aliases ?? []) {
    aliasMap.set(alias.toLowerCase(), t.id);
  }
}

// i18n lookup maps
interface I18nEntry {
  term: string;
  definition: string;
}

const ptMap = new Map<string, I18nEntry>();
const esMap = new Map<string, I18nEntry>();

for (const [id, entry] of Object.entries(ptI18n)) {
  ptMap.set(id, entry as I18nEntry);
}
for (const [id, entry] of Object.entries(esI18n)) {
  esMap.set(id, entry as I18nEntry);
}

/** Get a term by its id or any of its aliases */
export function getTerm(idOrAlias: string): GlossaryTerm | undefined {
  const lower = idOrAlias.toLowerCase();
  return termMap.get(idOrAlias) ?? termMap.get(aliasMap.get(lower) ?? "");
}

/** Get localized term and definition. Falls back to original fields for English or missing translations */
export function getTermLocalized(
  id: string,
  locale: "pt" | "en" | "es",
): { term: string; definition: string } | undefined {
  const term = getTerm(id);
  if (!term) return undefined;

  if (locale === "en") {
    return { term: term.term, definition: term.definition };
  }

  const map = locale === "pt" ? ptMap : esMap;
  const localized = map.get(id);

  if (localized) {
    return {
      term: localized.term || term.term,
      definition: localized.definition || term.definition,
    };
  }

  // Fallback to English
  return { term: term.term, definition: term.definition };
}

/** Get all terms in a given category */
export function getTermsByCategory(category: Category): GlossaryTerm[] {
  return allTerms.filter((t) => t.category === category);
}

/** Search terms by query string (matches term name, definition, and aliases) */
export function searchTerms(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return allTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.definition.toLowerCase().includes(q) ||
      t.id.includes(q) ||
      t.aliases?.some((a) => a.toLowerCase().includes(q)),
  );
}

/** Get all available categories */
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
