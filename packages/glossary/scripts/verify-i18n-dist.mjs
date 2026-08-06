#!/usr/bin/env node
// Regression guard for the i18n bug class: asserts that the BUILT (dist)
// output localizes correctly when loaded the way a published-package consumer
// loads it. Runs in a plain Node process (no vitest/vite transform in the
// loader path) and exercises BOTH the ESM (.mjs) and CJS (.js) artifacts, so a
// build that stopped inlining data/i18n/*.json — silently falling back to
// English — fails here instead of shipping. Exits 0 on success, 1 on failure.

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const distEsmIndex = join(pkgRoot, "dist/src/index.mjs");
const distEsmI18n = join(pkgRoot, "dist/src/i18n.mjs");
const distCjsIndex = join(pkgRoot, "dist/src/index.js");
const distCjsI18n = join(pkgRoot, "dist/src/i18n.js");

for (const p of [distEsmIndex, distEsmI18n, distCjsIndex, distCjsI18n]) {
  if (!existsSync(p)) {
    console.error(
      `[verify-i18n-dist] Missing built artifact: ${p}\nRun \`npm run build\` first.`,
    );
    process.exit(1);
  }
}

// A term id known to be translated in both pt and es (also asserted in mcp.test.ts).
const PROBE = "proof-of-history";
const failures = [];

function assertLocalized(label, localized, english) {
  const l = localized.find((t) => t.id === PROBE);
  const e = english.find((t) => t.id === PROBE);
  if (!e) {
    failures.push(`${label}: English baseline missing "${PROBE}"`);
    return;
  }
  if (!l) {
    failures.push(`${label}: localized set missing "${PROBE}"`);
    return;
  }
  if (l.term === e.term) {
    failures.push(`${label}: term name equals English (localization not applied)`);
  }
  if (l.definition === e.definition) {
    failures.push(`${label}: definition equals English (localization not applied)`);
  }
}

function assertFallsBackToEnglish(label, getLocalizedTerms, english) {
  const en = english.find((t) => t.id === PROBE);
  const fr = getLocalizedTerms("fr").find((t) => t.id === PROBE);
  if (!fr || !en || fr.definition !== en.definition) {
    failures.push(`${label}: unsupported locale did not fall back to English`);
  }
}

// ---- ESM artifact (bundler / ESM consumer) ----
const esmIndex = await import(pathToFileURL(distEsmIndex).href);
const esmI18n = await import(pathToFileURL(distEsmI18n).href);
const enEsm = esmIndex.allTerms;
assertLocalized("esm:pt", esmI18n.getLocalizedTerms("pt"), enEsm);
assertLocalized("esm:es", esmI18n.getLocalizedTerms("es"), enEsm);
assertFallsBackToEnglish("esm:fr", esmI18n.getLocalizedTerms, enEsm);

// ---- CJS artifact (require() consumer) ----
const cjsIndex = require(distCjsIndex);
const cjsI18n = require(distCjsI18n);
const enCjs = cjsIndex.allTerms;
assertLocalized("cjs:pt", cjsI18n.getLocalizedTerms("pt"), enCjs);
assertLocalized("cjs:es", cjsI18n.getLocalizedTerms("es"), enCjs);
assertFallsBackToEnglish("cjs:fr", cjsI18n.getLocalizedTerms, enCjs);

if (failures.length > 0) {
  console.error("[verify-i18n-dist] FAILED:\n - " + failures.join("\n - "));
  process.exit(1);
}

console.log(
  "[verify-i18n-dist] OK — pt & es localize from built ESM and CJS; unsupported locale falls back to English.",
);
