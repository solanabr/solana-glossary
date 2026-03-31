#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { getTerm, searchTerms, getTermsByCategory, getCategories } from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";

const program = new Command();

// ── helpers ──────────────────────────────────────────────────────────────────

function getLang(options: { lang?: string }) {
  return options.lang === "pt" ? "pt" : undefined;
}

function renderTerm(
  term: { id: string; term: string; definition: string; category: string; related?: string[]; aliases?: string[] },
  lang?: string
) {
  // apply i18n if pt requested
  let displayTerm = term.term;
  let displayDef = term.definition;

  if (lang === "pt") {
    try {
      const localized = getLocalizedTerms("pt");
      const loc = localized.find((t: { id: string; term: string; definition: string }) => t.id === term.id);
      if (loc) {
        displayTerm = loc.term;
        if (loc.definition && loc.definition !== term.definition) {
          displayDef = loc.definition;
        }
      }
    } catch {}
  }

  const header = `${chalk.bold.hex("#9945FF")(displayTerm)}  ${chalk.dim("·")}  ${chalk.cyan(term.category)}`;
  const id = chalk.dim(`id: ${term.id}`);
  const aliases = term.aliases?.length
    ? chalk.dim(`aliases: ${term.aliases.join(", ")}`)
    : "";
  const definition = chalk.white(displayDef);
  const related = term.related?.length
    ? chalk.dim(`related: `) + chalk.hex("#14F195")(term.related.slice(0, 5).join("  ·  "))
    : "";

  const lines = [header, id];
  if (aliases) lines.push(aliases);
  lines.push("", definition);
  if (related) lines.push("", related);

  return boxen(lines.join("\n"), {
    padding: 1,
    margin: { top: 1, bottom: 0, left: 0, right: 0 },
    borderStyle: "round",
    borderColor: "#9945FF",
  });
}

function renderList(
  terms: { id: string; term: string; definition: string; category: string }[],
  label: string
) {
  console.log(chalk.bold.hex("#9945FF")(`\n  ${label}`) + chalk.dim(` (${terms.length} terms)\n`));
  for (const t of terms) {
    const def = t.definition.length > 72 ? t.definition.slice(0, 72) + "…" : t.definition;
    console.log(`  ${chalk.hex("#14F195")(t.term.padEnd(32))} ${chalk.dim(def)}`);
  }
  console.log();
}

// ── commands ──────────────────────────────────────────────────────────────────

program
  .name("solana-glossary")
  .description(chalk.bold("Solana Glossary CLI") + " — 1001 terms at your fingertips")
  .version("1.0.0");

// lookup <term>
program
  .command("lookup <term>")
  .alias("l")
  .description("Look up a term by ID or alias")
  .option("--lang <lang>", "Language: en (default) or pt")
  .action((id: string, options) => {
    const term = getTerm(id);
    if (!term) {
      console.log(chalk.red(`\n  Term not found: "${id}"\n`));
      console.log(chalk.dim(`  Try: solana-glossary search "${id}"\n`));
      process.exit(1);
    }
    console.log(renderTerm(term, getLang(options)));
  });

// search <query>
program
  .command("search <query>")
  .alias("s")
  .description("Full-text search across all 1001 terms")
  .option("--lang <lang>", "Language: en (default) or pt")
  .option("--limit <n>", "Max results to show", "10")
  .action((query: string, options) => {
    const results = searchTerms(query).slice(0, parseInt(options.limit));
    if (!results.length) {
      console.log(chalk.red(`\n  No results for: "${query}"\n`));
      process.exit(1);
    }
    renderList(results, `Results for "${query}"`);
  });

// category <id>
program
  .command("category <id>")
  .alias("c")
  .description("List all terms in a category")
  .option("--limit <n>", "Max results to show", "20")
  .action((id: string, options) => {
    const cats = getCategories();
    if (!cats.includes(id as never)) {
      console.log(chalk.red(`\n  Unknown category: "${id}"\n`));
      console.log(chalk.dim(`  Available: ${cats.join(", ")}\n`));
      process.exit(1);
    }
    const terms = getTermsByCategory(id as never).slice(0, parseInt(options.limit));
    renderList(terms, `Category: ${id}`);
  });

// categories
program
  .command("categories")
  .description("List all available categories")
  .action(() => {
    const cats = getCategories();
    console.log(chalk.bold.hex("#9945FF")("\n  Categories\n"));
    for (const c of cats) {
      console.log(`  ${chalk.hex("#14F195")("▸")} ${c}`);
    }
    console.log();
  });

// default: treat bare argument as lookup
program
  .argument("[term]", "Term to look up (shorthand for lookup)")
  .option("--lang <lang>", "Language: en (default) or pt")
  .action((term?: string, options?: { lang?: string }) => {
    if (!term) {
      program.help();
      return;
    }
    const found = getTerm(term);
    if (!found) {
      console.log(chalk.red(`\n  Term not found: "${term}"\n`));
      console.log(chalk.dim(`  Try: solana-glossary search "${term}"\n`));
      process.exit(1);
    }
    console.log(renderTerm(found, options ? getLang(options) : undefined));
  });

program.parse();
