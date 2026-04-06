#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const termsDir = process.argv[2] ?? path.join(__dirname, "..", "data", "terms");
const files = fs.readdirSync(termsDir).filter((f) => f.endsWith(".json"));

const allTerms = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(termsDir, file), "utf8"));
  allTerms.push(...data);
}

let errors = 0;

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
  if (!term.id || !term.term || !term.definition || !term.category) {
    console.error(`Missing required field in: "${term.id ?? "(no id)"}"`);
    errors++;
  }
}

// Check for empty aliases arrays
for (const term of allTerms) {
  if (term.aliases?.length === 0) {
    console.error(`Empty aliases array in: "${term.id}"`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n${errors} error(s) found.`);
  process.exit(1);
} else {
  console.log(
    `All ${allTerms.length} terms valid. No duplicates, no dangling refs.`,
  );
}
