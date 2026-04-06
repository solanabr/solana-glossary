// loader.js
// Reads all 14 data/terms/*.json files at startup and builds
// three fast in-memory lookup maps. No SDK needed — reads raw JSON directly.

import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path from contributions/dns-cli/ up to the repo's data/terms/
const TERMS_DIR = join(__dirname, "../../data/terms");

// The three indexes we build at startup
const byId    = new Map(); // "proof-of-history" → GlossaryTerm
const byAlias = new Map(); // "poh"               → GlossaryTerm (lowercase)
const byCat   = new Map(); // "defi"              → GlossaryTerm[]

let allTerms = [];
let loaded = false;

export async function loadGlossary() {
  if (loaded) return;

  const files = await readdir(TERMS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  for (const file of jsonFiles) {
    const raw = await readFile(join(TERMS_DIR, file), "utf-8");
    const terms = JSON.parse(raw);

    for (const term of terms) {
      // Index by ID
      byId.set(term.id, term);

      // Index by aliases (case-insensitive)
      if (term.aliases) {
        for (const alias of term.aliases) {
          byAlias.set(alias.toLowerCase(), term);
        }
      }

      // Index by category
      if (!byCat.has(term.category)) {
        byCat.set(term.category, []);
      }
      byCat.get(term.category).push(term);

      allTerms.push(term);
    }
  }

  loaded = true;
  console.log(`Glossary loaded: ${allTerms.length} terms across ${byCat.size} categories`);
}

// --- Lookup functions ---

// Look up by exact ID ("proof-of-history") or alias ("poh")
export function getTerm(query) {
  const q = query.toLowerCase().trim();
  // Try ID first (exact match)
  if (byId.has(q)) return byId.get(q);
  // Then try alias
  if (byAlias.has(q)) return byAlias.get(q);
  return null;
}

// Get all terms in a category
export function getTermsByCategory(category) {
  return byCat.get(category.toLowerCase()) || [];
}

// Get all category names
export function getCategories() {
  return [...byCat.keys()].sort();
}

// Get a random term
export function getRandomTerm() {
  return allTerms[Math.floor(Math.random() * allTerms.length)];
}

// Get total count
export function getTotalCount() {
  return allTerms.length;
}
