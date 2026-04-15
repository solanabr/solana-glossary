#!/usr/bin/env node
/**
 * Copies monorepo `data/` into `public/data/` for Next static JSON.
 * Walks up from this script to find `data/terms/`, max 4 levels.
 * Builds `terms-all.json` from merging every `data/terms/*.json` array.
 */

const fs = require("fs");
const path = require("path");

function findRepoRoot(startDir, maxLevels = 4) {
  let dir = startDir;
  for (let i = 0; i <= maxLevels; i++) {
    if (fs.existsSync(path.join(dir, "data", "terms"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const SCRIPT_DIR = __dirname;
const repoRoot = findRepoRoot(SCRIPT_DIR);

if (!repoRoot) {
  console.error(
    "[copy-data] Could not find data/terms/ — run from solana-glossary/apps/web with repo data/ present.",
  );
  process.exit(1);
}

const DATA_SRC = path.join(repoRoot, "data");
const DATA_DEST = path.join(SCRIPT_DIR, "..", "public", "data");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else if (entry.name.endsWith(".json")) {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

console.log(`[copy-data] Repo root: ${repoRoot}`);
console.log(`[copy-data] From: ${DATA_SRC}`);
console.log(`[copy-data] To:   ${DATA_DEST}`);

const n = copyDir(DATA_SRC, DATA_DEST);
console.log(`[copy-data] Copied ${n} JSON file(s).`);

const TERMS_SRC = path.join(DATA_SRC, "terms");
const TERMS_BUNDLE = path.join(DATA_DEST, "terms-all.json");
if (fs.existsSync(TERMS_SRC)) {
  const merged = [];
  for (const entry of fs.readdirSync(TERMS_SRC, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const raw = fs.readFileSync(path.join(TERMS_SRC, entry.name), "utf8");
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) merged.push(...arr);
    } catch (e) {
      console.warn(`[copy-data] Skipping ${entry.name}:`, e.message);
    }
  }
  fs.writeFileSync(TERMS_BUNDLE, JSON.stringify(merged));
  console.log(`[copy-data] terms-all.json (${merged.length} terms)`);
} else {
  console.warn("[copy-data] data/terms/ missing — terms-all.json not built.");
}

const CONTRIBUTING_SRC = path.join(repoRoot, "CONTRIBUTING.md");
const CONTRIBUTING_DEST = path.join(
  SCRIPT_DIR,
  "..",
  "public",
  "contributing.md",
);
if (fs.existsSync(CONTRIBUTING_SRC)) {
  fs.copyFileSync(CONTRIBUTING_SRC, CONTRIBUTING_DEST);
  console.log("[copy-data] contributing.md");
} else {
  console.error(
    "[copy-data] CONTRIBUTING.md not found at repo root — required for /[lang]/contributing.",
  );
  process.exit(1);
}
