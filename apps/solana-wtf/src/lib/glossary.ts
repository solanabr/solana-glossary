import path from "path";
import fs from "fs";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
  aliases?: string[];
}

interface I18nOverride {
  term?: string;
  definition?: string;
}

const DATA_DIR = path.join(
  process.cwd(),
  "node_modules/@stbr/solana-glossary/data"
);

let _allTerms: GlossaryTerm[] | null = null;
let _termMap: Map<string, GlossaryTerm> | null = null;
let _aliasMap: Map<string, string> | null = null;

function loadTerms(): GlossaryTerm[] {
  if (_allTerms) return _allTerms;

  const termsDir = path.join(DATA_DIR, "terms");
  const files = fs.readdirSync(termsDir).filter((f) => f.endsWith(".json"));

  _allTerms = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(termsDir, file), "utf-8");
    const terms: GlossaryTerm[] = JSON.parse(content);
    _allTerms.push(...terms);
  }

  _termMap = new Map();
  _aliasMap = new Map();

  for (const term of _allTerms) {
    _termMap.set(term.id.toLowerCase(), term);
    if (term.aliases) {
      for (const alias of term.aliases) {
        _aliasMap.set(alias.toLowerCase(), term.id);
      }
    }
  }

  return _allTerms;
}

export function getAllTerms(): GlossaryTerm[] {
  return loadTerms();
}

export function getTerm(idOrAlias: string): GlossaryTerm | undefined {
  loadTerms();
  const lower = idOrAlias.toLowerCase();
  const direct = _termMap!.get(lower);
  if (direct) return direct;
  const aliasId = _aliasMap!.get(lower);
  if (aliasId) return _termMap!.get(aliasId.toLowerCase());
  return undefined;
}

export function searchTerms(query: string): GlossaryTerm[] {
  const lower = query.toLowerCase();
  return getAllTerms().filter(
    (t) =>
      t.term.toLowerCase().includes(lower) ||
      t.definition.toLowerCase().includes(lower) ||
      (t.aliases?.some((a) => a.toLowerCase().includes(lower)) ?? false)
  );
}

export function getTermsByCategory(category: string): GlossaryTerm[] {
  return getAllTerms().filter((t) => t.category === category);
}

export function getCategories(): string[] {
  const cats = new Set(getAllTerms().map((t) => t.category));
  return Array.from(cats).sort();
}

export function getLocalizedTerms(locale: string): GlossaryTerm[] {
  const terms = getAllTerms();
  const i18nPath = path.join(DATA_DIR, "i18n", `${locale}.json`);

  if (!fs.existsSync(i18nPath)) return terms;

  const overrides: Record<string, I18nOverride> = JSON.parse(
    fs.readFileSync(i18nPath, "utf-8")
  );

  return terms.map((t) => {
    const override = overrides[t.id];
    if (!override) return t;
    return {
      ...t,
      term: override.term ?? t.term,
      definition: override.definition ?? t.definition,
    };
  });
}

export function getRandomTerm(): GlossaryTerm {
  const terms = getAllTerms();
  return terms[Math.floor(Math.random() * terms.length)];
}

export function getRelatedTerms(termId: string): GlossaryTerm[] {
  const term = getTerm(termId);
  if (!term?.related) return [];
  return term.related
    .map((id) => getTerm(id))
    .filter((t): t is GlossaryTerm => t !== undefined);
}

export const CATEGORY_LABELS: Record<string, string> = {
  "ai-ml": "AI & ML",
  "blockchain-general": "Blockchain",
  "core-protocol": "Core Protocol",
  defi: "DeFi",
  "dev-tools": "Dev Tools",
  infrastructure: "Infrastructure",
  network: "Network",
  "programming-fundamentals": "Programming",
  "programming-model": "Solana Programming",
  security: "Security",
  "solana-ecosystem": "Ecosystem",
  "token-ecosystem": "Tokens",
  web3: "Web3",
  "zk-compression": "ZK & Compression",
};
