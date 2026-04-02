#!/usr/bin/env node
/**
 * Builds dist/glossary-bundle.json from @stbr/solana-glossary (SDK + packaged data/i18n).
 * Run from apps/glossary-glance: npm install && npm run build
 *
 * Prerequisite: the SDK must be compiled — from repo root: npm run build
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../dist");
const OUT_FILE = path.join(OUT_DIR, "glossary-bundle.json");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function loadAllTerms() {
  try {
    const mod = await import("@stbr/solana-glossary");
    if (!mod.allTerms || !Array.isArray(mod.allTerms)) {
      throw new Error("allTerms missing from @stbr/solana-glossary");
    }
    return mod.allTerms;
  } catch (e) {
    console.error(e);
    console.error(`
Could not load @stbr/solana-glossary.

From the solana-glossary repository root, run once:
  npm install
  npm run build

Then in apps/glossary-glance:
  npm install
  npm run build
`);
    process.exit(1);
  }
}

/** Package does not export ./package.json — resolve via main entry (dist/). */
function resolvePackageRoot() {
  const entry = require.resolve("@stbr/solana-glossary");
  const dir = path.dirname(entry);
  return dir.endsWith(path.join("dist")) || dir.endsWith("dist")
    ? path.dirname(dir)
    : dir;
}

function loadI18nFromPackage(pkgRoot) {
  const dir = path.join(pkgRoot, "data", "i18n");
  const out = { pt: {}, es: {} };
  for (const loc of Object.keys(out)) {
    const p = path.join(dir, `${loc}.json`);
    if (fs.existsSync(p)) {
      out[loc] = loadJson(p);
    }
  }
  return out;
}

function addPhrase(matchPhrases, phrase, id) {
  if (!phrase || typeof phrase !== "string") return;
  const trimmed = phrase.trim();
  if (trimmed.length < 2) return;
  matchPhrases.push({ phrase: trimmed, id });
}

/**
 * English plural / inflection heuristics so we match page copy ("validators",
 * "PDAs", "liquidity pools") against glossary singular entries ("Validator", "PDA").
 */
function englishPluralToken(word) {
  const w = word.trim();
  if (w.length < 2) return null;

  // Acronyms NFT, PDA, ZK, AMM, RPC (2–6 caps)
  if (/^[A-Z]{2,6}$/.test(w)) return w + "s";

  if (w.length < 4) return null;

  // glass, class, pass → +es
  if (/ss$/i.test(w)) return w + "es";

  // consensus, address, gas: already ends in s — do not fake plural
  if (/s$/i.test(w)) return null;

  if (/[bcdfghjklmnpqrstvwxyz]y$/i.test(w)) return w.slice(0, -1) + "ies";
  if (/([sxz]|ch|sh)$/i.test(w)) return w + "es";

  return w + "s";
}

/** All surface forms we should match for one dictionary phrase */
function expandPhraseForms(raw) {
  if (!raw || typeof raw !== "string") return [];
  const phrase = raw.trim();
  if (phrase.length < 2) return [];

  const forms = new Set([phrase]);
  const add = (s) => {
    const v = (s || "").trim();
    if (v.length >= 2) forms.add(v);
  };

  const words = phrase.split(/\s+/);

  // Multi-word: pluralize last token only ("liquidity pool" → "liquidity pools")
  if (words.length >= 2) {
    const last = words[words.length - 1];
    const pl = englishPluralToken(last);
    if (pl && pl.toLowerCase() !== last.toLowerCase()) {
      add([...words.slice(0, -1), pl].join(" "));
    }
    return [...forms];
  }

  // Hyphenated (kebab-style display): "merkle-tree" → "merkle-trees"
  if (phrase.includes("-") && !phrase.includes(" ")) {
    const segs = phrase.split("-");
    const last = segs[segs.length - 1];
    if (/^[a-zA-Z]+$/.test(last) && last.length >= 3) {
      const pl = englishPluralToken(last);
      if (pl && pl.toLowerCase() !== last.toLowerCase()) {
        add([...segs.slice(0, -1), pl].join("-"));
      }
    }
    return [...forms];
  }

  const pl = englishPluralToken(phrase);
  if (pl && pl.toLowerCase() !== phrase.toLowerCase()) add(pl);

  return [...forms];
}

function addPhrasesForTerm(matchPhrases, sourcePhrase, id) {
  for (const form of expandPhraseForms(sourcePhrase)) {
    addPhrase(matchPhrases, form, id);
    // "Token-2022" / "v0-transaction" often written with spaces in prose
    if (form.includes("-") && /[0-9a-zA-Z]-[0-9a-zA-Z]/.test(form)) {
      addPhrase(matchPhrases, form.replace(/-/g, " "), id);
    }
  }
}

async function main() {
  const allTerms = await loadAllTerms();
  const pkgRoot = resolvePackageRoot();
  const { pt, es } = loadI18nFromPackage(pkgRoot);

  const byId = Object.create(null);
  for (const t of allTerms) {
    if (byId[t.id]) {
      console.warn("duplicate id", t.id);
    }
    byId[t.id] = t;
  }

  const matchPhrases = [];
  for (const t of allTerms) {
    addPhrasesForTerm(matchPhrases, t.term, t.id);
    addPhrasesForTerm(matchPhrases, t.id.replace(/-/g, " "), t.id);
    for (const a of t.aliases ?? []) {
      addPhrasesForTerm(matchPhrases, a, t.id);
    }
  }

  matchPhrases.sort((a, b) => b.phrase.length - a.phrase.length);

  const seen = new Set();
  const unique = [];
  for (const m of matchPhrases) {
    const k = `${m.phrase.toLowerCase()}\0${m.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(m);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const bundle = {
    version: 1,
    builtAt: new Date().toISOString(),
    sdkVersion: (() => {
      try {
        const pj = loadJson(path.join(pkgRoot, "package.json"));
        return pj.version ?? "unknown";
      } catch {
        return "unknown";
      }
    })(),
    termCount: allTerms.length,
    terms: byId,
    matchPhrases: unique,
    i18n: { pt, es },
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(bundle));
  console.log(
    "Wrote",
    OUT_FILE,
    `(${allTerms.length} terms, ${unique.length} match phrases, @stbr/solana-glossary@${bundle.sdkVersion})`,
  );
}

main();
