#!/usr/bin/env node

/**
 * Solana Glossary CLI
 *
 * Search and browse 1001 Solana ecosystem terms from your terminal.
 * Uses the @stbr/solana-glossary data layer directly.
 *
 * Usage:
 *   npx ts-node cli/glossary.ts search "proof of history"
 *   npx ts-node cli/glossary.ts lookup pda --locale pt
 *   npx ts-node cli/glossary.ts browse defi
 *   npx ts-node cli/glossary.ts categories
 *   npx ts-node cli/glossary.ts stats
 *   npx ts-node cli/glossary.ts quiz --category security
 *   npx ts-node cli/glossary.ts related pda --depth 2
 *   npx ts-node cli/glossary.ts explain tower-bft
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Data Layer
// ---------------------------------------------------------------------------

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
  aliases?: string[];
}

type LocaleOverride = Record<string, { term?: string; definition?: string }>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../data/terms");
const I18N_DIR = path.resolve(__dirname, "../data/i18n");

function loadAllTerms(): GlossaryTerm[] {
  const terms: GlossaryTerm[] = [];
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith(".json")) continue;
    terms.push(...JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")));
  }
  return terms;
}

const allTerms = loadAllTerms();
const termMap = new Map(allTerms.map((t) => [t.id, t]));
const aliasMap = new Map<string, string>();
for (const t of allTerms) {
  for (const a of t.aliases ?? []) aliasMap.set(a.toLowerCase(), t.id);
}
const CATEGORIES = [...new Set(allTerms.map((t) => t.category))].sort();

function loadLocale(locale: string): LocaleOverride {
  const file = path.join(I18N_DIR, `${locale}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function localize(t: GlossaryTerm, ov: LocaleOverride): GlossaryTerm {
  const o = ov[t.id];
  return o ? { ...t, term: o.term ?? t.term, definition: o.definition ?? t.definition } : t;
}

function resolveTerm(input: string): GlossaryTerm | undefined {
  const lower = input.toLowerCase();
  return termMap.get(input) ?? termMap.get(lower) ?? termMap.get(aliasMap.get(lower) ?? "");
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function printTerm(t: GlossaryTerm, i?: number) {
  const prefix = i !== undefined ? `${DIM}${i + 1}.${RESET} ` : "";
  console.log(`${prefix}${BOLD}${CYAN}${t.term}${RESET} ${DIM}(${t.category})${RESET}`);
  console.log(`   ${t.definition || "No definition yet."}`);
  if (t.aliases?.length) console.log(`   ${DIM}Aliases: ${t.aliases.join(", ")}${RESET}`);
  if (t.related?.length) console.log(`   ${DIM}Related: ${t.related.join(", ")}${RESET}`);
  console.log();
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdLookup(args: string[]) {
  const locale = extractFlag(args, "--locale");
  const term = args[0];
  if (!term) return console.log("Usage: glossary lookup <term> [--locale pt|es]");

  let entry = resolveTerm(term);
  if (!entry) return console.log(`Term "${term}" not found. Try: glossary search "${term}"`);
  if (locale) entry = localize(entry, loadLocale(locale));
  printTerm(entry);
}

function cmdSearch(args: string[]) {
  const locale = extractFlag(args, "--locale");
  const limit = parseInt(extractFlag(args, "--limit") ?? "20");
  const query = args.join(" ").toLowerCase();
  if (!query) return console.log("Usage: glossary search <query> [--locale pt|es] [--limit N]");

  const ov = locale ? loadLocale(locale) : {};
  let results = allTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(query) ||
      t.definition.toLowerCase().includes(query) ||
      t.id.includes(query) ||
      t.aliases?.some((a) => a.toLowerCase().includes(query))
  );
  if (locale) results = results.map((t) => localize(t, ov));

  console.log(`${GREEN}Found ${results.length} result(s) for "${query}"${RESET}\n`);
  results.slice(0, limit).forEach((t, i) => printTerm(t, i));
  if (results.length > limit) console.log(`${DIM}...and ${results.length - limit} more (use --limit)${RESET}`);
}

function cmdBrowse(args: string[]) {
  const locale = extractFlag(args, "--locale");
  const cat = args[0];
  if (!cat) return console.log(`Usage: glossary browse <category>\nCategories: ${CATEGORIES.join(", ")}`);

  const ov = locale ? loadLocale(locale) : {};
  let terms = allTerms.filter((t) => t.category === cat);
  if (terms.length === 0) return console.log(`Category "${cat}" not found.\nAvailable: ${CATEGORIES.join(", ")}`);
  if (locale) terms = terms.map((t) => localize(t, ov));

  console.log(`${BOLD}${cat}${RESET} — ${terms.length} terms\n`);
  terms.forEach((t, i) => printTerm(t, i));
}

function cmdCategories() {
  const counts = new Map<string, number>();
  for (const t of allTerms) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  console.log(`${BOLD}Solana Glossary${RESET} — ${allTerms.length} terms across ${CATEGORIES.length} categories\n`);
  CATEGORIES.forEach((c) => console.log(`  ${CYAN}${c.padEnd(25)}${RESET} ${counts.get(c)} terms`));
}

function cmdStats() {
  const withDef = allTerms.filter((t) => t.definition.length > 0).length;
  const withRel = allTerms.filter((t) => t.related && t.related.length > 0).length;
  const totalRels = allTerms.reduce((s, t) => s + (t.related?.length ?? 0), 0);
  const locales = fs.readdirSync(I18N_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));

  console.log(`${BOLD}Solana Glossary Stats${RESET}\n`);
  console.log(`  Total terms:      ${GREEN}${allTerms.length}${RESET}`);
  console.log(`  With definitions: ${withDef} (${((withDef / allTerms.length) * 100).toFixed(1)}%)`);
  console.log(`  Cross-references: ${withRel} terms (${totalRels} links)`);
  console.log(`  Categories:       ${CATEGORIES.length}`);
  console.log(`  Languages:        en${locales.length ? ", " + locales.join(", ") : ""}`);
}

function cmdRelated(args: string[]) {
  const locale = extractFlag(args, "--locale");
  const depth = parseInt(extractFlag(args, "--depth") ?? "1");
  const input = args[0];
  if (!input) return console.log("Usage: glossary related <term> [--depth 1-3] [--locale pt|es]");

  const ov = locale ? loadLocale(locale) : {};
  const maxD = Math.min(depth, 3);
  const visited = new Set<string>();
  let currentIds = [input.toLowerCase()];
  if (!termMap.has(currentIds[0])) {
    const a = aliasMap.get(currentIds[0]);
    if (a) currentIds = [a];
  }

  for (let d = 0; d <= maxD; d++) {
    const nextIds: string[] = [];
    const label = d === 0 ? "Source" : `Depth ${d}`;
    let found = false;

    for (const id of currentIds) {
      if (visited.has(id)) continue;
      visited.add(id);
      const t = termMap.get(id);
      if (!t) continue;
      if (!found) { console.log(`${BOLD}${YELLOW}--- ${label} ---${RESET}\n`); found = true; }
      printTerm(locale ? localize(t, ov) : t);
      for (const r of t.related ?? []) if (!visited.has(r)) nextIds.push(r);
    }

    currentIds = nextIds;
    if (nextIds.length === 0) break;
  }
}

function cmdQuiz(args: string[]) {
  const cat = extractFlag(args, "--category");
  let pool = cat ? allTerms.filter((t) => t.category === cat) : allTerms;
  pool = pool.filter((t) => t.definition.length > 30);
  if (pool.length < 4) return console.log("Not enough terms for a quiz.");

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const answer = shuffled[0];
  const distractors = shuffled.slice(1, 4);
  const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
  const correctIdx = options.indexOf(answer);

  console.log(`${BOLD}${YELLOW}Quiz: What term is this?${RESET}\n`);
  console.log(`  "${answer.definition}"\n`);
  options.forEach((o, i) => {
    const letter = String.fromCharCode(65 + i);
    console.log(`  ${CYAN}${letter})${RESET} ${o.term}`);
  });
  console.log(`\n${DIM}Answer: ${String.fromCharCode(65 + correctIdx)}) ${answer.term}${RESET}`);
}

function cmdExplain(args: string[]) {
  const locale = extractFlag(args, "--locale");
  const input = args[0];
  if (!input) return console.log("Usage: glossary explain <term> [--locale pt|es]");

  const ov = locale ? loadLocale(locale) : {};
  let entry = resolveTerm(input);
  if (!entry) return console.log(`Term "${input}" not found.`);
  if (locale) entry = localize(entry, ov);

  console.log(`\n${BOLD}${CYAN}${entry.term}${RESET}`);
  console.log(`${DIM}Category: ${entry.category}${RESET}`);
  if (entry.aliases?.length) console.log(`${DIM}Also known as: ${entry.aliases.join(", ")}${RESET}`);
  console.log(`\n${entry.definition}\n`);

  if (entry.related?.length) {
    console.log(`${BOLD}${YELLOW}Related Concepts${RESET}\n`);
    for (const relId of entry.related) {
      let r = termMap.get(relId);
      if (!r) continue;
      if (locale) r = localize(r, ov);
      const def = r.definition.length > 120 ? r.definition.slice(0, 120) + "..." : r.definition;
      console.log(`  ${CYAN}${r.term}${RESET}: ${def}`);
    }
  }

  const referencedBy = allTerms.filter((t) => t.related?.includes(entry!.id) && t.id !== entry!.id);
  if (referencedBy.length > 0) {
    console.log(`\n${BOLD}${YELLOW}Referenced By${RESET}\n`);
    for (const ref of referencedBy.slice(0, 10)) {
      console.log(`  ${ref.term} ${DIM}(${ref.category})${RESET}`);
    }
    if (referencedBy.length > 10) console.log(`  ${DIM}...and ${referencedBy.length - 10} more${RESET}`);
  }
}

// ---------------------------------------------------------------------------
// CLI Router
// ---------------------------------------------------------------------------

function extractFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  const val = args[idx + 1];
  args.splice(idx, 2);
  return val;
}

const [, , cmd, ...args] = process.argv;

switch (cmd) {
  case "lookup":  cmdLookup(args); break;
  case "search":  cmdSearch(args); break;
  case "browse":  cmdBrowse(args); break;
  case "categories": cmdCategories(); break;
  case "stats":   cmdStats(); break;
  case "related": cmdRelated(args); break;
  case "quiz":    cmdQuiz(args); break;
  case "explain": cmdExplain(args); break;
  default:
    console.log(`${BOLD}Solana Glossary CLI${RESET} — ${allTerms.length} terms\n`);
    console.log("Commands:");
    console.log("  lookup  <term>     Look up a term by ID or alias");
    console.log("  search  <query>    Full-text search");
    console.log("  browse  <category> List terms in a category");
    console.log("  categories         Show all categories");
    console.log("  stats              Glossary statistics");
    console.log("  related <term>     Knowledge graph traversal");
    console.log("  quiz               Random quiz question");
    console.log("  explain <term>     Deep explanation with context");
    console.log(`\nFlags: --locale pt|es  --limit N  --depth 1-3  --category <cat>`);
}
