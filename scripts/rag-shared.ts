import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type BaseTerm = {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
  aliases?: string[];
};

type LocaleOverride = Record<string, { term?: string; definition?: string }>;

export type RagLang = "en" | "pt-BR" | "es";

export type RagChunk = {
  chunkId: string;
  termId: string;
  lang: RagLang;
  term: string;
  category: string;
  aliases: string[];
  related: string[];
  text: string;
};

export type RagIndex = {
  model: string;
  createdAt: string;
  dims: number;
  chunks: RagChunk[];
  vectors: number[][];
};

export const ROOT = path.resolve(__dirname, "..");
export const OUTPUT_DIR = path.join(ROOT, ".rag");
export const OUTPUT_FILE = path.join(OUTPUT_DIR, "index.json");
const TERMS_DIR = path.join(ROOT, "data", "terms");
const I18N_DIR = path.join(ROOT, "data", "i18n");

const TERM_FILES = [
  "core-protocol.json",
  "programming-model.json",
  "token-ecosystem.json",
  "defi.json",
  "zk-compression.json",
  "infrastructure.json",
  "security.json",
  "dev-tools.json",
  "network.json",
  "blockchain-general.json",
  "web3.json",
  "programming-fundamentals.json",
  "ai-ml.json",
  "solana-ecosystem.json",
] as const;

function compactWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trim()}…`;
}

function normalizeToken(raw: string): string {
  return raw.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
}

export function tokenize(text: string): string[] {
  return compactWhitespace(text)
    .split(/\s+/)
    .map(normalizeToken)
    .filter((x) => x.length > 1);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  const den = Math.sqrt(na) * Math.sqrt(nb);
  return den === 0 ? 0 : dot / den;
}

export function lexicalScore(query: string, chunk: RagChunk): number {
  const q = new Set(tokenize(query));
  if (q.size === 0) return 0;
  const t = new Set(
    tokenize(
      `${chunk.term} ${chunk.category} ${chunk.aliases.join(" ")} ${chunk.related.join(" ")}`,
    ),
  );
  let overlap = 0;
  for (const token of q) {
    if (t.has(token)) overlap++;
  }
  return overlap / q.size;
}

export function relatedBoost(query: string, chunk: RagChunk): number {
  const q = new Set(tokenize(query));
  if (q.size === 0) return 0;
  for (const rel of chunk.related) {
    if (q.has(normalizeToken(rel))) return 0.03;
  }
  return 0;
}

export function finalScore(
  query: string,
  chunk: RagChunk,
  semanticSimilarity: number,
): number {
  const lex = lexicalScore(query, chunk);
  const rel = relatedBoost(query, chunk);
  return semanticSimilarity * 0.75 + lex * 0.2 + rel;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function loadBaseTerms(): Promise<BaseTerm[]> {
  const result: BaseTerm[] = [];
  for (const file of TERM_FILES) {
    const items = await readJsonFile<BaseTerm[]>(path.join(TERMS_DIR, file));
    result.push(...items);
  }
  return result;
}

async function loadLocaleOverride(
  locale: "pt" | "es",
): Promise<LocaleOverride> {
  return readJsonFile<LocaleOverride>(path.join(I18N_DIR, `${locale}.json`));
}

function mergeLocale(base: BaseTerm[], override: LocaleOverride): BaseTerm[] {
  return base.map((term) => {
    const translated = override[term.id];
    if (!translated) return term;
    return {
      ...term,
      term: translated.term ?? term.term,
      definition: translated.definition ?? term.definition,
    };
  });
}

function toChunk(term: BaseTerm, lang: RagLang): RagChunk {
  const definition = truncate(compactWhitespace(term.definition), 420);
  const related = (term.related ?? []).slice(0, 6);
  const aliases = (term.aliases ?? []).slice(0, 6);
  const text = [
    `Term: ${term.term}`,
    `Category: ${term.category}`,
    aliases.length > 0 ? `Aliases: ${aliases.join(", ")}` : "",
    `Definition: ${definition}`,
    related.length > 0 ? `Related: ${related.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    chunkId: `${lang}:${term.id}:0`,
    termId: term.id,
    lang,
    term: term.term,
    category: term.category,
    aliases,
    related,
    text,
  };
}

export async function buildChunks(): Promise<RagChunk[]> {
  const base = await loadBaseTerms();
  const pt = mergeLocale(base, await loadLocaleOverride("pt"));
  const es = mergeLocale(base, await loadLocaleOverride("es"));

  const chunks: RagChunk[] = [];
  for (const term of base) chunks.push(toChunk(term, "en"));
  for (const term of pt) chunks.push(toChunk(term, "pt-BR"));
  for (const term of es) chunks.push(toChunk(term, "es"));
  return chunks;
}

async function requestEmbeddings(
  input: string[],
  model: string,
  apiKey: string,
): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    data: Array<{ embedding: number[] }>;
  };
  return data.data.map((x) => x.embedding);
}

export async function embedTexts(
  texts: string[],
  model: string,
  apiKey: string,
  batchSize = 64,
): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchVectors = await requestEmbeddings(batch, model, apiKey);
    vectors.push(...batchVectors);
    const done = Math.min(i + batch.length, texts.length);
    process.stdout.write(`\rEmbedding ${done}/${texts.length} chunks...`);
  }
  process.stdout.write("\n");
  return vectors;
}

export async function writeIndex(index: RagIndex): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(index), "utf8");
}

export async function readIndex(filePath = OUTPUT_FILE): Promise<RagIndex> {
  return readJsonFile<RagIndex>(filePath);
}

export function parseFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

export function parseIntFlag(
  args: string[],
  name: string,
  fallback: number,
): number {
  const value = parseFlag(args, name);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

export function parseLang(args: string[]): RagLang | undefined {
  const value = parseFlag(args, "--lang");
  if (!value) return undefined;
  if (value === "en" || value === "pt-BR" || value === "es") return value;
  throw new Error(`Invalid --lang value "${value}". Use en, pt-BR, or es.`);
}
