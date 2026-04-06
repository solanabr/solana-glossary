/**
 * Glossary Coverage Checker
 *
 * Match topics/code against the Solana Glossary (1,001 terms)
 * and identify knowledge gaps based on developer progress.
 *
 * Usage:
 *   npx tsx@4 apps/kuka-agent/skills/kuka/scripts/glossary-coverage.ts \
 *     --topic "compressed tokens with light protocol"
 *     [--progress .kuka/memory/progress.md]
 *     [--code-file program.rs]
 *     [--terms pda,cpi,merkle-tree]
 *     [--max-results 30]
 *     [--verbose]
 *
 * Output: JSON to stdout with matched terms, explored/gap breakdown, and suggested path.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { allTerms, type GlossaryTerm } from "../../../../../src/index";

// ── CLI args ────────────────────────────────────────────────────────────

interface Args {
  topic?: string;
  codeFile?: string;
  terms?: string;
  progress?: string;
  maxResults: number;
  verbose: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = { maxResults: 30, verbose: false };

  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(
      `
Glossary Coverage Checker — match topics/code against the Solana Glossary.

Options:
  --topic <text>        Natural language topic to match
  --code-file <path>    Source code file to analyze for Solana concepts
  --terms <ids>         Comma-separated term IDs (e.g., pda,cpi,merkle-tree)
  --progress <path>     Path to .kuka/memory/progress.md
  --max-results <n>     Maximum matched terms to return (default: 30)
  --verbose             Print diagnostics to stderr
  --help, -h            Show this help

Output: JSON to stdout with matched terms, explored/gap breakdown, and suggested path.
    `.trim(),
    );
    process.exit(0);
  }

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--topic":
i++;
                args.topic = argv[i];
        break;
      case "--code-file":
i++;
                args.codeFile = argv[i];
        break;
      case "--terms":
i++;
                args.terms = argv[i];
        break;
      case "--progress":
i++;
                args.progress = argv[i];
        break;
      case "--max-results":
i++;
                args.maxResults = Number.parseInt(argv[i], 10);
        break;
      case "--verbose":
        args.verbose = true;
        break;
    }
  }

  if (!args.topic && !args.codeFile && !args.terms) {
    console.error(
      "Error: at least one of --topic, --code-file, or --terms is required",
    );
    process.exit(2);
  }

  return args;
}

// ── Search index ────────────────────────────────────────────────────────

function addToIndex(index: Map<string, Set<string>>, keyword: string, termId: string): void {
  const lower = keyword.toLowerCase();
  if (lower.length < 3) return;
  if (!index.has(lower)) index.set(lower, new Set());
  index.get(lower)?.add(termId);
}

function indexSingleTerm(index: Map<string, Set<string>>, term: GlossaryTerm): void {
  for (const part of term.id.split("-")) {
    addToIndex(index, part, term.id);
  }
  for (const word of term.term.match(/[a-zA-Z]{3,}/g) ?? []) {
    addToIndex(index, word, term.id);
  }
  for (const alias of term.aliases ?? []) {
    for (const word of alias.match(/[a-zA-Z]{3,}/g) ?? []) {
      addToIndex(index, word, term.id);
    }
  }
}

function buildSearchIndex(terms: GlossaryTerm[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const term of terms) {
    indexSingleTerm(index, term);
  }
  return index;
}

// ── Progress loader ─────────────────────────────────────────────────────

function loadProgress(progressPath?: string): Set<string> {
  const explored = new Set<string>();
  if (!progressPath || !existsSync(progressPath)) return explored;

  const content = readFileSync(progressPath, "utf-8");

  // Match backtick-wrapped IDs: `proof-of-history`
  for (const match of content.matchAll(/`([a-z][a-z0-9-]*)`/g)) {
    explored.add(match[1]);
  }
  // Match bullet-list IDs: - pda (2026-03-15)
  for (const match of content.matchAll(/^[-*]\s+([a-z][a-z0-9-]*)/gm)) {
    explored.add(match[1]);
  }

  return explored;
}

// ── Keyword extraction ──────────────────────────────────────────────────

function extractKeywords(text: string): string[] {
  // Strip code blocks and comments
  let clean = text.replaceAll(/```[\s\S]*?```/g, " ");
  clean = clean.replaceAll(/\/\/.*$/gm, " ");
  clean = clean.replaceAll(/#.*$/gm, " ");

  const words = clean.match(/[a-zA-Z][a-zA-Z0-9_-]{2,}/g) ?? [];
  const seen = new Set<string>();
  return words
    .map((w) => w.toLowerCase())
    .filter((w) => {
      if (seen.has(w)) return false;
      seen.add(w);
      return true;
    });
}

// ── Term matching ───────────────────────────────────────────────────────

function addScore(
  scores: Map<string, number>,
  id: string,
  score: number,
): void {
  scores.set(id, (scores.get(id) ?? 0) + score);
}

function fuzzyMatchKeyword(
  keyword: string,
  searchIndex: Map<string, Set<string>>,
  scores: Map<string, number>,
): void {
  for (const [indexKey, termIds] of searchIndex) {
    if (keyword.includes(indexKey) || indexKey.includes(keyword)) {
      for (const termId of termIds) {
        addScore(scores, termId, 0.5);
      }
    }
  }
}

function scoreKeyword(
  keyword: string,
  searchIndex: Map<string, Set<string>>,
  termLookup: Map<string, GlossaryTerm>,
  scores: Map<string, number>,
): void {
  if (termLookup.has(keyword)) {
    addScore(scores, keyword, 10);
  }

  const directMatch = searchIndex.get(keyword);
  if (directMatch) {
    for (const termId of directMatch) {
      addScore(scores, termId, 1);
    }
  }

  if (keyword.length >= 4) {
    fuzzyMatchKeyword(keyword, searchIndex, scores);
  }
}

function matchTerms(
  keywords: string[],
  searchIndex: Map<string, Set<string>>,
  termLookup: Map<string, GlossaryTerm>,
  maxResults: number,
): string[] {
  const scores = new Map<string, number>();

  for (const keyword of keywords) {
    scoreKeyword(keyword, searchIndex, termLookup, scores);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxResults)
    .map(([id]) => id);
}

// ── Path suggestion ─────────────────────────────────────────────────────

function suggestPath(
  gaps: string[],
  termLookup: Map<string, GlossaryTerm>,
): string[] {
  if (gaps.length === 0) return [];

  const gapSet = new Set(gaps);
  const refCount = new Map<string, number>();
  for (const g of gapSet) refCount.set(g, 0);

  for (const g of gapSet) {
    const related = termLookup.get(g)?.related ?? [];
    for (const r of related) {
      if (refCount.has(r)) {
        refCount.set(r, (refCount.get(r) ?? 0) + 1);
      }
    }
  }

  return [...gapSet].sort(
    (a, b) => (refCount.get(b) ?? 0) - (refCount.get(a) ?? 0),
  );
}

// ── Input building ─────────────────────────────────────────────────────

function buildInputText(args: Args): string {
  let inputText = "";
  if (args.topic) inputText += `${args.topic} `;
  if (args.codeFile) {
    const codePath = resolve(args.codeFile);
    if (existsSync(codePath)) {
      inputText += `${readFileSync(codePath, "utf-8")} `;
    } else {
      console.error(`Warning: code file not found: ${args.codeFile}`);
    }
  }
  if (args.terms) inputText += `${args.terms.split(",").join(" ")} `;
  return inputText;
}

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs();

  const termLookup = new Map(allTerms.map((t) => [t.id, t]));
  const searchIndex = buildSearchIndex(allTerms);
  const explored = loadProgress(args.progress);

  if (args.verbose) {
    console.error(`Loaded ${allTerms.length} glossary terms`);
    console.error(`Developer explored ${explored.size} terms`);
  }

  const inputText = buildInputText(args);
  const keywords = extractKeywords(inputText);
  if (args.verbose) {
    console.error(`Extracted ${keywords.length} keywords`);
  }

  const matchedIds = matchTerms(
    keywords,
    searchIndex,
    termLookup,
    args.maxResults,
  );
  const exploredMatches = matchedIds.filter((t) => explored.has(t));
  const gapMatches = matchedIds.filter((t) => !explored.has(t));
  const suggested = suggestPath(gapMatches, termLookup);

  const result = {
    script: "glossary-coverage",
    version: "1.0.0",
    input: {
      topic: args.topic ?? null,
      code_file: args.codeFile ?? null,
      terms: args.terms ?? null,
    },
    matched_terms: matchedIds.length,
    explored: exploredMatches.length,
    gaps: gapMatches.length,
    terms: {
      explored: exploredMatches,
      gaps: gapMatches,
    },
    suggested_path: suggested,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(gapMatches.length === 0 ? 0 : 1);
}

main();
