#!/usr/bin/env node
/**
 * solana-glossary CLI
 * Search, explore and quiz yourself on 1001 Solana terms from the terminal.
 */

import {
  allTerms,
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import type { GlossaryTerm, Category } from "@stbr/solana-glossary";
import * as readline from "readline";

// ── ANSI colours ────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  purple: "\x1b[35m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  bgPurple: "\x1b[45m",
  bgGreen: "\x1b[42m",
};

function c(color: keyof typeof C, text: string) {
  return `${C[color]}${text}${C.reset}`;
}

function bold(text: string) {
  return `${C.bold}${text}${C.reset}`;
}
function dim(text: string) {
  return `${C.dim}${text}${C.reset}`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function wrap(text: string, width = 72): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + w).length > width) {
      lines.push(line.trimEnd());
      line = "";
    }
    line += w + " ";
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines.join("\n  ");
}

function catLabel(cat: string): string {
  const labels: Record<string, string> = {
    "core-protocol": "Core Protocol",
    "programming-model": "Programming Model",
    "token-ecosystem": "Token Ecosystem",
    defi: "DeFi",
    "zk-compression": "ZK Compression",
    infrastructure: "Infrastructure",
    security: "Security",
    "dev-tools": "Dev Tools",
    network: "Network",
    "blockchain-general": "Blockchain General",
    web3: "Web3",
    "programming-fundamentals": "Prog. Fundamentals",
    "ai-ml": "AI / ML",
    "solana-ecosystem": "Solana Ecosystem",
  };
  return labels[cat] ?? cat;
}

function printTerm(term: GlossaryTerm) {
  console.log();
  console.log(bold(c("purple", `  ${term.term}`)) + dim(`  [${term.id}]`));
  console.log(dim(`  ${catLabel(term.category)}`));
  console.log();
  console.log(`  ${wrap(term.definition)}`);
  if (term.aliases?.length) {
    console.log();
    console.log(dim("  Also known as: ") + term.aliases.slice(0, 5).join(", "));
  }
  if (term.related?.length) {
    console.log();
    console.log(dim("  Related: ") + term.related.slice(0, 5).join(", "));
  }
  console.log();
}

function printHeader() {
  console.log();
  console.log(
    c("purple", "  ◆") +
      " " +
      bold(c("green", "Solana Glossary")) +
      dim("  1001 terms · 14 categories"),
  );
  console.log();
}

function printHelp() {
  printHeader();
  console.log(`  ${bold("Usage:")} solana-glossary <command> [options]`);
  console.log();
  console.log(`  ${bold("Commands:")}`);
  console.log(
    `    ${c("cyan", "search")} <query>          Full-text search across terms, definitions and aliases`,
  );
  console.log(
    `    ${c("cyan", "get")} <id-or-alias>       Show full details for a specific term`,
  );
  console.log(
    `    ${c("cyan", "cat")} <category>          List all terms in a category`,
  );
  console.log(`    ${c("cyan", "random")}                  Show a random term`);
  console.log(
    `    ${c("cyan", "quiz")}                    Interactive multiple-choice quiz`,
  );
  console.log(
    `    ${c("cyan", "stats")}                   Show term counts by category`,
  );
  console.log(
    `    ${c("cyan", "list")}                    List all 1001 term IDs`,
  );
  console.log();
  console.log(`  ${bold("Options (quiz):")}`);
  console.log(
    `    ${dim("--count N")}                Number of questions (default: 10)`,
  );
  console.log(
    `    ${dim("--cat <category>")}         Quiz only a specific category`,
  );
  console.log(
    `    ${dim("--lang pt|es|en")}          Language for quiz (default: pt)`,
  );
  console.log();
  console.log(`  ${bold("Examples:")}`);
  console.log(`    ${dim("$ solana-glossary search pda")}`);
  console.log(`    ${dim("$ solana-glossary get proof-of-history")}`);
  console.log(`    ${dim("$ solana-glossary cat defi")}`);
  console.log(`    ${dim("$ solana-glossary quiz --count 20 --cat security")}`);
  console.log(`    ${dim("$ solana-glossary random")}`);
  console.log(`    ${dim("$ solana-glossary stats")}`);
  console.log();
  console.log(`  ${bold("Categories:")} ${getCategories().join(", ")}`);
  console.log();
}

// ── Commands ─────────────────────────────────────────────────────────────────

function cmdSearch(query: string) {
  const results = searchTerms(query);
  printHeader();
  if (results.length === 0) {
    console.log(`  ${c("yellow", "No results")} for "${bold(query)}"\n`);
    return;
  }
  console.log(
    `  ${c("green", `${results.length} results`)} for "${bold(query)}"\n`,
  );
  for (const t of results.slice(0, 20)) {
    const aliasStr = t.aliases?.length
      ? dim(` (${t.aliases.slice(0, 2).join(", ")})`)
      : "";
    console.log(`  ${c("purple", "▸")} ${bold(t.term)}${aliasStr}`);
    console.log(
      `    ${dim(catLabel(t.category))}  ${t.definition.slice(0, 80)}${t.definition.length > 80 ? "…" : ""}`,
    );
    console.log(`    ${dim(`id: ${t.id}`)}`);
    console.log();
  }
  if (results.length > 20) {
    console.log(
      dim(`  … and ${results.length - 20} more results. Refine your query.\n`),
    );
  }
}

function cmdGet(idOrAlias: string) {
  const term = getTerm(idOrAlias);
  if (!term) {
    console.log(`\n  ${c("red", "Term not found:")} "${idOrAlias}"`);
    console.log(`  Try: ${dim("solana-glossary search " + idOrAlias)}\n`);
    process.exit(1);
  }
  printTerm(term);
}

function cmdCategory(cat: string) {
  const valid = getCategories() as string[];
  if (!valid.includes(cat)) {
    console.log(`\n  ${c("red", "Unknown category:")} "${cat}"`);
    console.log(`  Valid categories: ${valid.join(", ")}\n`);
    process.exit(1);
  }
  const terms = getTermsByCategory(cat as Category);
  printHeader();
  console.log(
    `  ${bold(c("cyan", catLabel(cat)))}  ${dim(`${terms.length} terms`)}\n`,
  );
  for (const t of terms) {
    const aliasStr = t.aliases?.length
      ? dim(` · ${t.aliases.slice(0, 2).join(", ")}`)
      : "";
    console.log(`  ${c("purple", "▸")} ${bold(t.term)}${aliasStr}`);
    console.log(
      `    ${t.definition.slice(0, 90)}${t.definition.length > 90 ? "…" : ""}`,
    );
    console.log(`    ${dim("id: " + t.id)}`);
    console.log();
  }
}

function cmdRandom() {
  const term = allTerms[Math.floor(Math.random() * allTerms.length)];
  printHeader();
  console.log(dim("  Random term:\n"));
  printTerm(term);
}

function cmdStats() {
  const cats = getCategories();
  printHeader();
  console.log(`  ${bold("Terms by category:")}\n`);
  let max = 0;
  const counts: [string, number][] = cats.map((cat) => {
    const n = getTermsByCategory(cat).length;
    if (n > max) max = n;
    return [cat, n];
  });
  for (const [cat, n] of counts.sort((a, b) => b[1] - a[1])) {
    const bar = "█".repeat(Math.round((n / max) * 20));
    const pad = " ".repeat(22 - catLabel(cat).length);
    console.log(
      `  ${c("cyan", catLabel(cat))}${pad}${c("purple", bar.padEnd(20))}  ${bold(String(n))}`,
    );
  }
  console.log();
  console.log(
    `  ${bold("Total:")} ${c("green", String(allTerms.length))} terms\n`,
  );
}

function cmdList() {
  for (const t of allTerms) {
    console.log(`${t.id}\t${t.term}\t${t.category}`);
  }
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function cmdQuiz(opts: { count: number; cat?: string; lang: string }) {
  const pool =
    opts.lang === "en"
      ? opts.cat
        ? getTermsByCategory(opts.cat as Category)
        : allTerms
      : opts.cat
        ? getLocalizedTerms(opts.lang).filter((t) => t.category === opts.cat)
        : getLocalizedTerms(opts.lang);

  if (pool.length < 4) {
    console.log(
      `\n  ${c("red", "Not enough terms")} in that category for a quiz.\n`,
    );
    process.exit(1);
  }

  const questions = shuffle(pool).slice(0, Math.min(opts.count, pool.length));
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

  printHeader();
  console.log(
    `  ${bold("Quiz")}  ${dim(`${questions.length} questions${opts.cat ? " · " + catLabel(opts.cat) : ""}`)}\n`,
  );

  let score = 0;

  for (let i = 0; i < questions.length; i++) {
    const term = questions[i];
    const distractors = shuffle(pool.filter((t) => t.id !== term.id)).slice(
      0,
      3,
    );
    const options = shuffle([term, ...distractors]);
    const correctIdx = options.findIndex((o) => o.id === term.id);

    console.log(
      `  ${c("yellow", `Q${i + 1}/${questions.length}`)}  ${dim(catLabel(term.category))}`,
    );
    console.log();
    console.log(`  "${wrap(term.definition, 68)}"`);
    console.log();

    options.forEach((opt, j) => {
      console.log(`  ${bold(String(j + 1) + ".")} ${opt.term}`);
    });
    console.log();

    let answer: string;
    let picked: number;
    while (true) {
      answer = await ask(`  ${dim("Your answer (1-4): ")}`);
      picked = parseInt(answer.trim(), 10) - 1;
      if (picked >= 0 && picked < 4) break;
      console.log(`  ${c("yellow", "Enter a number 1-4")}`);
    }

    if (picked === correctIdx) {
      score++;
      console.log(`\n  ${c("green", "✓ Correct!")}  ${bold(term.term)}\n`);
    } else {
      console.log(
        `\n  ${c("red", "✗ Wrong.")}  Answer: ${bold(c("green", options[correctIdx].term))}\n`,
      );
    }

    const pct = Math.round((score / (i + 1)) * 100);
    console.log(
      dim(`  Score: ${score}/${i + 1}  (${pct}%)`) +
        "  " +
        "█".repeat(Math.round(pct / 10)).padEnd(10, "░"),
    );
    console.log();
  }

  rl.close();

  const pct = Math.round((score / questions.length) * 100);
  console.log("  " + "─".repeat(50));
  console.log();
  if (pct === 100) {
    console.log(
      `  ${c("green", bold("🏆 Perfect score!"))} ${score}/${questions.length}`,
    );
  } else if (pct >= 80) {
    console.log(
      `  ${c("green", bold("🎉 Excellent!"))} ${score}/${questions.length} (${pct}%)`,
    );
  } else if (pct >= 60) {
    console.log(
      `  ${c("cyan", bold("👍 Good work!"))} ${score}/${questions.length} (${pct}%)`,
    );
  } else {
    console.log(
      `  ${c("yellow", bold("📚 Keep studying!"))} ${score}/${questions.length} (${pct}%)`,
    );
  }
  console.log();
  console.log(dim("  Run again: solana-glossary quiz"));
  console.log(dim("  Study a term: solana-glossary get <id>"));
  console.log();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
    printHelp();
    return;
  }

  switch (cmd) {
    case "search": {
      const query = args.slice(1).join(" ");
      if (!query) {
        console.log("\n  Usage: solana-glossary search <query>\n");
        process.exit(1);
      }
      cmdSearch(query);
      break;
    }

    case "get": {
      const id = args[1];
      if (!id) {
        console.log("\n  Usage: solana-glossary get <id-or-alias>\n");
        process.exit(1);
      }
      cmdGet(id);
      break;
    }

    case "cat":
    case "category": {
      const cat = args[1];
      if (!cat) {
        console.log(`\n  Usage: solana-glossary cat <category>\n`);
        console.log(`  Categories: ${getCategories().join(", ")}\n`);
        process.exit(1);
      }
      cmdCategory(cat);
      break;
    }

    case "random": {
      cmdRandom();
      break;
    }

    case "stats": {
      cmdStats();
      break;
    }

    case "list": {
      cmdList();
      break;
    }

    case "quiz": {
      let count = 10;
      let cat: string | undefined;
      let lang = "pt";

      for (let i = 1; i < args.length; i++) {
        if (args[i] === "--count" && args[i + 1]) {
          count = parseInt(args[i + 1], 10);
          i++;
        } else if (
          (args[i] === "--cat" || args[i] === "--category") &&
          args[i + 1]
        ) {
          cat = args[i + 1];
          i++;
        } else if (args[i] === "--lang" && args[i + 1]) {
          lang = args[i + 1];
          i++;
        }
      }

      await cmdQuiz({ count, cat, lang });
      break;
    }

    default: {
      // Try treating unknown command as a search query
      const result = getTerm(cmd);
      if (result) {
        printTerm(result);
      } else {
        console.log(`\n  ${c("red", "Unknown command:")} "${cmd}"`);
        console.log(`  Run ${dim("solana-glossary --help")} for usage.\n`);
        process.exit(1);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
