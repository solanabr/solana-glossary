import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Category =
  | "core-protocol"
  | "programming-model"
  | "token-ecosystem"
  | "defi"
  | "zk-compression"
  | "infrastructure"
  | "security"
  | "dev-tools"
  | "network"
  | "blockchain-general"
  | "web3"
  | "programming-fundamentals"
  | "ai-ml"
  | "solana-ecosystem";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: Category;
  related?: string[];
  aliases?: string[];
}

export type Locale = "en" | "pt" | "es";

export interface LocalizedTerm {
  term: string;
  definition: string;
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

const CATEGORIES: Category[] = [
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

function resolveDataDir(): string {
  // Works whether running from src/ (tsx) or dist/ (node)
  const candidates = [
    path.resolve(__dirname, "../node_modules/@stbr/solana-glossary/data"),
    path.resolve(__dirname, "../../node_modules/@stbr/solana-glossary/data"),
    path.resolve(process.cwd(), "node_modules/@stbr/solana-glossary/data"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Could not locate @stbr/solana-glossary data directory");
}

function loadAllTerms(): GlossaryTerm[] {
  const dataDir = resolveDataDir();
  const terms: GlossaryTerm[] = [];
  for (const cat of CATEGORIES) {
    const file = path.join(dataDir, "terms", `${cat}.json`);
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as GlossaryTerm[];
      terms.push(...raw);
    }
  }
  return terms;
}

function loadI18n(locale: Locale): Record<string, LocalizedTerm> {
  if (locale === "en") return {};
  const dataDir = resolveDataDir();
  const file = path.join(dataDir, "i18n", `${locale}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, LocalizedTerm>;
}

// Eager load once
const _allTerms: GlossaryTerm[] = loadAllTerms();

// Build indexes for O(1) lookups
const _byId = new Map<string, GlossaryTerm>();
const _byAlias = new Map<string, GlossaryTerm>();

for (const t of _allTerms) {
  _byId.set(t.id, t);
  for (const alias of t.aliases ?? []) {
    _byAlias.set(alias.toLowerCase(), t);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All 1001 terms */
export const allTerms: readonly GlossaryTerm[] = _allTerms;

/** All 14 categories */
export function getCategories(): Category[] {
  return [...CATEGORIES];
}

/** Lookup a term by exact ID or alias (case-insensitive for aliases) */
export function getTerm(idOrAlias: string): GlossaryTerm | undefined {
  return _byId.get(idOrAlias) ?? _byAlias.get(idOrAlias.toLowerCase());
}

/** Full-text search across term name, definition, and aliases */
export function searchTerms(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return _allTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.definition.toLowerCase().includes(q) ||
      (t.aliases ?? []).some((a) => a.toLowerCase().includes(q))
  );
}

/** All terms in a given category */
export function getTermsByCategory(category: Category): GlossaryTerm[] {
  return _allTerms.filter((t) => t.category === category);
}

/** Related terms for a given term ID or alias */
export function getRelatedTerms(idOrAlias: string): GlossaryTerm[] {
  const term = getTerm(idOrAlias);
  if (!term || !term.related?.length) return [];
  return term.related.flatMap((id) => {
    const found = getTerm(id);
    return found ? [found] : [];
  });
}

/** Return a term with its localized definition if available */
export function getLocalizedTerm(
  idOrAlias: string,
  locale: Locale
): (GlossaryTerm & { localizedTerm?: string; localizedDefinition?: string }) | undefined {
  const term = getTerm(idOrAlias);
  if (!term) return undefined;
  if (locale === "en") return term;
  const i18n = loadI18n(locale);
  const loc = i18n[term.id];
  if (!loc) return term;
  return { ...term, localizedTerm: loc.term, localizedDefinition: loc.definition };
}

/** Category display labels (pt-BR) */
export const CATEGORY_LABELS: Record<Category, string> = {
  "core-protocol": "Protocolo Central",
  "programming-model": "Modelo de Programação",
  "token-ecosystem": "Ecossistema de Tokens",
  defi: "DeFi",
  "zk-compression": "ZK Compression",
  infrastructure: "Infraestrutura",
  security: "Segurança",
  "dev-tools": "Ferramentas de Dev",
  network: "Rede",
  "blockchain-general": "Blockchain Geral",
  web3: "Web3",
  "programming-fundamentals": "Fundamentos de Programação",
  "ai-ml": "IA / ML",
  "solana-ecosystem": "Ecossistema Solana",
};
