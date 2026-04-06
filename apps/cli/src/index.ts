#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import {
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
  allTerms,
  type GlossaryTerm,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";

const program = new Command();

function getLang(options: { lang?: string }) {
  const l = options.lang?.toLowerCase();
  if (l === "pt" || l === "es") return l;
  return undefined;
}

function getLocalized(lang?: string): GlossaryTerm[] {
  if (!lang) return [];
  try { return getLocalizedTerms(lang); } catch { return []; }
}

function localizeTerm(term: GlossaryTerm, localized: GlossaryTerm[]): GlossaryTerm {
  if (!localized.length) return term;
  const loc = localized.find((t) => t.id === term.id);
  if (!loc) return term;
  return { ...term, term: loc.term, definition: loc.definition || term.definition };
}

function renderTerm(term: GlossaryTerm, lang?: string) {
  const localized = getLocalized(lang);
  const t = localizeTerm(term, localized);

  const header = `${chalk.bold.hex("#9945FF")(t.term)}  ${chalk.dim("·")}  ${chalk.cyan(t.category)}`;
  const id = chalk.dim(`id: ${t.id}`);
  const aliases = t.aliases?.length ? chalk.dim(`aliases: ${t.aliases.join(", ")}`) : "";
  const definition = chalk.white(t.definition);
  const related = t.related?.length
    ? chalk.dim("related: ") + chalk.hex("#14F195")(t.related.slice(0, 5).join("  ·  "))
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

function renderList(terms: GlossaryTerm[], label: string) {
  console.log(chalk.bold.hex("#9945FF")(`\n  ${label}`) + chalk.dim(` (${terms.length} terms)\n`));
  for (const t of terms) {
    const def = t.definition.length > 72 ? t.definition.slice(0, 72) + "…" : t.definition;
    console.log(`  ${chalk.hex("#14F195")(t.term.padEnd(32))} ${chalk.dim(def)}`);
  }
  console.log();
}

program
  .name("solana-glossary")
  .description(chalk.bold("Solana Glossary CLI") + ` — ${allTerms.length} terms at your fingertips`)
  .version("1.0.0");

// lookup
program
  .command("lookup <term>")
  .alias("l")
  .description("Look up a term by ID or alias")
  .option("--lang <lang>", "Language: en (default), pt, or es")
  .action((id: string, options) => {
    const term = getTerm(id);
    if (!term) {
      console.log(chalk.red(`\n  Term not found: "${id}"\n`));
      console.log(chalk.dim(`  Try: solana-glossary search "${id}"\n`));
      process.exit(1);
    }
    console.log(renderTerm(term, getLang(options)));
  });

// search
program
  .command("search <query>")
  .alias("s")
  .description(`Full-text search across all ${allTerms.length} terms`)
  .option("--lang <lang>", "Language: en (default), pt, or es")
  .option("--limit <n>", "Max results to show", "10")
  .action((query: string, options) => {
    const results = searchTerms(query).slice(0, parseInt(options.limit));
    if (!results.length) {
      console.log(chalk.red(`\n  No results for: "${query}"\n`));
      process.exit(1);
    }
    renderList(results, `Results for "${query}"`);
  });

// category
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

// related --depth
program
  .command("related <term>")
  .alias("r")
  .description("Show related terms with optional depth traversal")
  .option("--depth <n>", "Traversal depth 1-3", "1")
  .option("--lang <lang>", "Language: en (default), pt, or es")
  .action((id: string, options) => {
    const found = getTerm(id);
    if (!found) {
      console.log(chalk.red(`\n  Term not found: "${id}"\n`));
      process.exit(1);
    }
    const depth = Math.min(3, Math.max(1, parseInt(options.depth) || 1));
    const lang = getLang(options);
    const localized = getLocalized(lang);
    const visited = new Set<string>();

    const getName = (termId: string) => {
      const t = getTerm(termId);
      if (!t) return termId;
      return localizeTerm(t, localized).term;
    };

    console.log(chalk.bold.hex("#9945FF")(`\n  Related terms for: ${chalk.white(found.term)}`));
    console.log(chalk.dim(`  depth: ${depth}\n`));

    const traverse = (termId: string, currentDepth: number, prefix: string) => {
      if (visited.has(termId) || currentDepth > depth) return;
      visited.add(termId);
      const t = getTerm(termId);
      if (!t?.related?.length) return;
      for (const relId of t.related.slice(0, 5)) {
        const relTerm = getTerm(relId);
        if (!relTerm) continue;
        const connector = currentDepth === 1 ? chalk.hex("#14F195")("▸") : chalk.hex("#9945FF")("◦");
        console.log(`  ${prefix}${connector} ${chalk.white(getName(relId))} ${chalk.dim("(" + relTerm.category + ")")}`);
        if (currentDepth < depth) traverse(relId, currentDepth + 1, prefix + "  ");
      }
    };

    traverse(found.id, 1, "");
    console.log();
  });

// quiz
program
  .command("quiz")
  .alias("q")
  .description("Interactive multiple-choice quiz from glossary terms")
  .option("--category <id>", "Quiz from a specific category")
  .option("--count <n>", "Number of questions", "5")
  .option("--lang <lang>", "Language: en (default), pt, or es")
  .action(async (options) => {
    const { default: readline } = await import("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

    let pool = allTerms;
    if (options.category) {
      const cats = getCategories();
      if (!cats.includes(options.category as never)) {
        console.log(chalk.red(`\n  Unknown category: "${options.category}"\n`));
        rl.close();
        process.exit(1);
      }
      pool = getTermsByCategory(options.category as never);
    }

    const lang = getLang(options);
    const localized = getLocalized(lang);
    const loc = (t: GlossaryTerm) => localizeTerm(t, localized);

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, parseInt(options.count));
    let score = 0;

    console.log(chalk.bold.hex("#9945FF")("\n  Solana Glossary Quiz"));
    console.log(chalk.dim(`  ${shuffled.length} questions · type the letter to answer\n`));

    for (let i = 0; i < shuffled.length; i++) {
      const term = loc(shuffled[i]);
      const wrong = [...pool]
        .filter((t) => t.id !== shuffled[i].id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(loc);

      const choices = [...wrong, term].sort(() => Math.random() - 0.5);
      const correctIdx = choices.findIndex((o) => o.id === term.id);
      const shortDef = term.definition.length > 120 ? term.definition.slice(0, 120) + "…" : term.definition;

      console.log(chalk.bold(`  Q${i + 1}/${shuffled.length}: ${chalk.white(shortDef)}\n`));
      choices.forEach((o, idx) => {
        console.log(`    ${chalk.hex("#14F195")(String.fromCharCode(65 + idx) + ")")} ${o.term}`);
      });

      const answer = await ask(chalk.dim("\n  Your answer: "));
      const answerIdx = answer.trim().toUpperCase().charCodeAt(0) - 65;

      if (answerIdx === correctIdx) {
        score++;
        console.log(chalk.green("\n  Correct!\n"));
      } else {
        console.log(chalk.red(`\n  Wrong. Answer: ${String.fromCharCode(65 + correctIdx)}) ${term.term}\n`));
      }
    }

    rl.close();
    const pct = Math.round((score / shuffled.length) * 100);
    const color = pct >= 80 ? "#14F195" : pct >= 50 ? "#f5a623" : "#ef5350";
    console.log(boxen(
      chalk.bold("Score: ") + chalk.hex(color)(`${score}/${shuffled.length} (${pct}%)`),
      { padding: 1, borderColor: color as any, borderStyle: "round" }
    ));
  });

// default: bare argument as lookup
program
  .argument("[term]", "Term to look up (shorthand for lookup)")
  .option("--lang <lang>", "Language: en (default), pt, or es")
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
