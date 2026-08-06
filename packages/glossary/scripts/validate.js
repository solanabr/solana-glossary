#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const termsDir = path.join(__dirname, "..", "data", "terms");
const i18nDir = path.join(__dirname, "..", "data", "i18n");
const files = fs.readdirSync(termsDir).filter((f) => f.endsWith(".json"));

const allTerms = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(termsDir, file), "utf8"));
  allTerms.push(...data);
}

let errors = 0;
let warnings = 0;

// Check for duplicate IDs
const ids = new Set();
for (const term of allTerms) {
  if (ids.has(term.id)) {
    console.error(`Duplicate ID: "${term.id}"`);
    errors++;
  }
  ids.add(term.id);
}

// Check for dangling related refs
for (const term of allTerms) {
  for (const ref of term.related ?? []) {
    if (!ids.has(ref)) {
      console.error(`Dangling ref: "${term.id}" -> "${ref}"`);
      errors++;
    }
  }
}

// Check required fields
for (const term of allTerms) {
  if (
    !term.id ||
    !term.term ||
    !term.definition ||
    !term.category ||
    !term.depth
  ) {
    console.error(`Missing required field in: "${term.id || "(no id)"}"`);
    errors++;
  }
}

// Check depth is valid integer 1-5
for (const term of allTerms) {
  if (
    typeof term.depth !== "number" ||
    !Number.isInteger(term.depth) ||
    term.depth < 1 ||
    term.depth > 5
  ) {
    console.error(
      `Invalid depth "${term.depth}" in: "${term.id}" (must be integer 1-5)`,
    );
    errors++;
  }
}

// Check for empty aliases arrays
for (const term of allTerms) {
  if (term.aliases && term.aliases.length === 0) {
    console.error(`Empty aliases array in: "${term.id}"`);
    errors++;
  }
}

// Check for empty tags arrays
for (const term of allTerms) {
  if (term.tags && term.tags.length === 0) {
    console.error(`Empty tags array in: "${term.id}"`);
    errors++;
  }
}

// Check tags are lowercase kebab-case
for (const term of allTerms) {
  for (const tag of term.tags ?? []) {
    if (tag !== tag.toLowerCase() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag)) {
      console.error(
        `Invalid tag "${tag}" in: "${term.id}" (must be lowercase kebab-case)`,
      );
      errors++;
    }
  }
}

// Check alias uniqueness across terms
const aliasOwner = new Map();
for (const term of allTerms) {
  for (const alias of term.aliases ?? []) {
    const key = alias.toLowerCase();
    if (aliasOwner.has(key)) {
      console.error(
        `Alias conflict: "${alias}" used by both "${aliasOwner.get(key)}" and "${term.id}"`,
      );
      errors++;
    }
    aliasOwner.set(key, term.id);
  }
}

// Check i18n file completeness
const locales = ["es", "pt"];
for (const locale of locales) {
  const i18nPath = path.join(i18nDir, `${locale}.json`);
  if (!fs.existsSync(i18nPath)) {
    console.error(`Missing i18n file: ${locale}.json`);
    errors++;
    continue;
  }
  const i18n = JSON.parse(fs.readFileSync(i18nPath, "utf8"));
  const i18nIds = new Set(Object.keys(i18n));
  for (const id of ids) {
    if (!i18nIds.has(id)) {
      console.warn(`Missing ${locale} translation for: "${id}"`);
      warnings++;
    }
  }
}

if (errors > 0) {
  console.error(
    `\n${errors} error(s)${warnings > 0 ? `, ${warnings} warning(s)` : ""} found.`,
  );
  process.exit(1);
} else {
  const tagCount = new Set(allTerms.flatMap((t) => t.tags ?? [])).size;
  console.log(
    `All ${allTerms.length} terms valid. No duplicates, no dangling refs, no alias conflicts. ${tagCount} unique tags.`,
  );
  if (warnings > 0) {
    console.warn(`${warnings} warning(s) — see above.`);
  }
}
