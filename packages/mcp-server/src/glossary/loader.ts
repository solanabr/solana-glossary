import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { GlossaryTerm, Locale, LocaleOverride, LocalizedGlossaryTerm } from "../types/glossary.js";

type LocaleFile = Record<string, LocaleOverride>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../../../../");
const termsDir = resolve(repoRoot, "data/terms");
const i18nDir = resolve(repoRoot, "data/i18n");

const termFiles = [
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
];

let baseTermsCache: GlossaryTerm[] | null = null;
const localizedTermsCache = new Map<Locale, LocalizedGlossaryTerm[]>();

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function loadBaseTerms(): GlossaryTerm[] {
  if (baseTermsCache) return baseTermsCache;

  baseTermsCache = termFiles.flatMap((filename) =>
    readJsonFile<GlossaryTerm[]>(resolve(termsDir, filename)),
  );

  return baseTermsCache;
}

function loadLocaleOverrides(locale: Exclude<Locale, "en">): LocaleFile {
  const path = resolve(i18nDir, `${locale}.json`);
  return readJsonFile<LocaleFile>(path);
}

export function getAllTerms(locale: Locale = "en"): LocalizedGlossaryTerm[] {
  if (localizedTermsCache.has(locale)) {
    return localizedTermsCache.get(locale)!;
  }

  const baseTerms = loadBaseTerms();
  if (locale === "en") {
    localizedTermsCache.set(locale, baseTerms);
    return baseTerms;
  }

  const overrides = loadLocaleOverrides(locale);
  const localized = baseTerms.map((term) => {
    const override = overrides[term.id];
    if (!override) return term;
    return {
      ...term,
      term: override.term ?? term.term,
      definition: override.definition ?? term.definition,
    };
  });

  localizedTermsCache.set(locale, localized);
  return localized;
}

export function getTerm(idOrAlias: string, locale: Locale = "en"): LocalizedGlossaryTerm | undefined {
  const normalized = idOrAlias.trim().toLowerCase();
  if (!normalized) return undefined;

  return getAllTerms(locale).find((term) => {
    if (term.id.toLowerCase() === normalized) return true;
    if (term.term.toLowerCase() === normalized) return true;
    return (term.aliases ?? []).some((alias) => alias.toLowerCase() === normalized);
  });
}

export function searchGlossary(query: string, locale: Locale = "en", limit = 10): LocalizedGlossaryTerm[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return getAllTerms(locale)
    .map((term) => {
      let score = 0;
      if (term.id.toLowerCase() === normalized) score += 100;
      if (term.term.toLowerCase() === normalized) score += 90;
      if (term.term.toLowerCase().includes(normalized)) score += 40;
      if (term.definition.toLowerCase().includes(normalized)) score += 15;
      if ((term.aliases ?? []).some((alias) => alias.toLowerCase() === normalized)) score += 60;
      if ((term.aliases ?? []).some((alias) => alias.toLowerCase().includes(normalized))) score += 20;

      return { term, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.term.term.localeCompare(right.term.term);
    })
    .slice(0, limit)
    .map((entry) => entry.term);
}

export function getTermsSafe(ids: string[], locale: Locale = "en"): LocalizedGlossaryTerm[] {
  const seen = new Set<string>();
  const resolved: LocalizedGlossaryTerm[] = [];

  for (const id of ids) {
    const term = getTerm(id, locale);
    if (!term || seen.has(term.id)) continue;
    seen.add(term.id);
    resolved.push(term);
  }

  return resolved;
}

export function getRelatedTerms(idOrAlias: string, locale: Locale = "en"): LocalizedGlossaryTerm[] {
  const term = getTerm(idOrAlias, locale);
  if (!term?.related?.length) return [];
  return getTermsSafe(term.related, locale);
}
