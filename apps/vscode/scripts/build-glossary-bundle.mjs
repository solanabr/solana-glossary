/**
 * Build script: bundles @stbr/solana-glossary data into a single JSON
 * that the VS Code extension can load without requiring the SDK at runtime.
 *
 * Run from repo root after `npm run build`:
 *   node apps/vscode/scripts/build-glossary-bundle.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outDir = join(__dirname, "..", "dist");

mkdirSync(outDir, { recursive: true });

// ── Load all terms from data/terms/*.json ──
const termsDir = join(repoRoot, "data", "terms");
const allTerms = [];

for (const file of readdirSync(termsDir).filter((f) => f.endsWith(".json"))) {
  const raw = JSON.parse(readFileSync(join(termsDir, file), "utf-8"));
  if (Array.isArray(raw)) {
    allTerms.push(...raw);
  } else if (raw.terms && Array.isArray(raw.terms)) {
    allTerms.push(...raw.terms);
  }
}

// ── Load i18n ──
const i18nDir = join(repoRoot, "data", "i18n");
const i18n = {};

if (existsSync(i18nDir)) {
  for (const file of readdirSync(i18nDir).filter((f) => f.endsWith(".json"))) {
    const locale = file.replace(".json", "");
    i18n[locale] = JSON.parse(readFileSync(join(i18nDir, file), "utf-8"));
  }
}

// ── Build lookup index: id → term, alias → id ──
const aliasMap = {};
for (const term of allTerms) {
  // Map ID to itself
  aliasMap[term.id.toLowerCase()] = term.id;
  // Map term name
  aliasMap[term.term.toLowerCase()] = term.id;
  // Map aliases
  if (term.aliases) {
    for (const alias of term.aliases) {
      aliasMap[alias.toLowerCase()] = term.id;
    }
  }
}

const bundle = {
  terms: allTerms,
  aliasMap,
  i18n,
  meta: {
    totalTerms: allTerms.length,
    categories: [...new Set(allTerms.map((t) => t.category))],
    locales: Object.keys(i18n),
    builtAt: new Date().toISOString(),
  },
};

const outPath = join(outDir, "glossary-bundle.json");
writeFileSync(outPath, JSON.stringify(bundle));

console.log(
  `✅ Bundled ${allTerms.length} terms, ${Object.keys(aliasMap).length} aliases, ${Object.keys(i18n).length} locales → ${outPath}`
);
