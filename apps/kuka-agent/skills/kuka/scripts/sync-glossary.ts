/**
 * Glossary Sync — synchronize local glossary with upstream repository
 *
 * Fetches the latest glossary data from the upstream repo, identifies
 * new community terms, reconciles local proposals, and reports changes.
 *
 * Usage:
 *   npx tsx@4 apps/kuka-agent/skills/kuka/scripts/sync-glossary.ts \
 *     --glossary-dir data/terms
 *     [--proposals-dir .kuka/proposals]
 *     [--upstream solanabr/solana-glossary]
 *     [--branch main]
 *     [--dry-run]
 *     [--apply]
 *     [--verbose]
 *
 * Modes:
 *   --dry-run   Show what would change without modifying files (default)
 *   --apply     Pull upstream changes and reconcile proposals
 *
 * Output: JSON to stdout with sync plan, new terms, reconciled proposals.
 */

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { GlossaryTerm } from "../../../../../src/index";

// ── Types ───────────────────────────────────────────────────────────────

interface SyncResult {
  script: string;
  version: string;
  mode: "dry-run" | "apply";
  upstream: string;
  upstream_total_terms: number;
  local_total_terms: number;
  new_from_upstream: string[];
  removed_upstream: string[];
  proposals_already_merged: string[];
  proposals_now_conflicting: string[];
  proposals_still_pending: string[];
  updated_categories: string[];
}

// ── CLI args ────────────────────────────────────────────────────────────

interface Args {
  glossaryDir: string;
  proposalsDir: string;
  upstream: string;
  branch: string;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = {
    glossaryDir: "data/terms",
    proposalsDir: ".kuka/proposals",
    upstream: "solanabr/solana-glossary",
    branch: "main",
    dryRun: true,
    verbose: false,
  };

  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(
      `
Glossary Sync — synchronize local glossary with upstream repository.

Options:
  --glossary-dir <path>    Local glossary data/terms/ directory (default: data/terms)
  --proposals-dir <path>   Local proposals staging (default: .kuka/proposals)
  --upstream <owner/repo>  Upstream repo (default: solanabr/solana-glossary)
  --branch <name>          Upstream branch (default: main)
  --dry-run                Show sync plan without changes (default)
  --apply                  Pull upstream and reconcile proposals
  --verbose                Print diagnostics to stderr
  --help, -h               Show this help

Output: JSON to stdout with sync plan, new terms, and reconciled proposals.
    `.trim(),
    );
    process.exit(0);
  }

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--glossary-dir":
i++;
                args.glossaryDir = argv[i];
        break;
      case "--proposals-dir":
i++;
                args.proposalsDir = argv[i];
        break;
      case "--upstream":
i++;
                args.upstream = argv[i];
        break;
      case "--branch":
i++;
                args.branch = argv[i];
        break;
      case "--apply":
        args.dryRun = false;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--verbose":
        args.verbose = true;
        break;
    }
  }

  return args;
}

// ── Upstream fetch ──────────────────────────────────────────────────────

function fetchUpstreamTerms(
  upstream: string,
  branch: string,
  tmpDir: string,
  verbose: boolean,
): Map<string, GlossaryTerm> {
  const terms = new Map<string, GlossaryTerm>();
  const upstreamDataDir = join(tmpDir, "upstream-terms");
  mkdirSync(upstreamDataDir, { recursive: true });

  const categories = [
    "ai-ml",
    "blockchain-general",
    "core-protocol",
    "defi",
    "dev-tools",
    "infrastructure",
    "network",
    "programming-fundamentals",
    "programming-model",
    "security",
    "solana-ecosystem",
    "token-ecosystem",
    "web3",
    "zk-compression",
  ];

  for (const cat of categories) {
    const filename = `${cat}.json`;
    const outputPath = join(upstreamDataDir, filename);

    try {
      const rawUrl = `https://raw.githubusercontent.com/${upstream}/${branch}/data/terms/${filename}`;
      if (verbose) {
        console.error(`Fetching ${rawUrl}`);
      }

      const content = execSync(`curl -sf "${rawUrl}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 15000,
      });

      writeFileSync(outputPath, content, "utf-8");

      const data: GlossaryTerm[] = JSON.parse(content);
      for (const term of data) {
        terms.set(term.id, term);
      }
    } catch (err: unknown) {
      if (verbose) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Warning: failed to fetch ${filename}: ${message}`);
      }
    }
  }

  return terms;
}

// ── Local data ──────────────────────────────────────────────────────────

function loadLocalTerms(glossaryDir: string): Map<string, GlossaryTerm> {
  const terms = new Map<string, GlossaryTerm>();
  if (!existsSync(glossaryDir)) return terms;

  for (const file of readdirSync(glossaryDir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const data: GlossaryTerm[] = JSON.parse(
        readFileSync(join(glossaryDir, file), "utf-8"),
      );
      for (const term of data) {
        terms.set(term.id, term);
      }
    } catch {
      // skip
    }
  }
  return terms;
}

function loadPendingProposals(
  proposalsDir: string,
): Map<string, Record<string, unknown>> {
  const proposals = new Map<string, Record<string, unknown>>();
  if (!existsSync(proposalsDir)) return proposals;

  for (const file of readdirSync(proposalsDir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const data = JSON.parse(readFileSync(join(proposalsDir, file), "utf-8"));
      if (data.id) proposals.set(data.id, data);
    } catch {
      // skip
    }
  }
  return proposals;
}

function loadDoneProposals(proposalsDir: string): Set<string> {
  const done = new Set<string>();
  const doneDir = join(proposalsDir, ".done");
  if (!existsSync(doneDir)) return done;

  for (const file of readdirSync(doneDir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const data = JSON.parse(readFileSync(join(doneDir, file), "utf-8"));
      if (data.id) done.add(data.id);
    } catch {
      // skip
    }
  }
  return done;
}

// ── Sync logic ──────────────────────────────────────────────────────────

function updateLocalGlossary(
  glossaryDir: string,
  upstreamTerms: Map<string, GlossaryTerm>,
): string[] {
  const updatedCategories = new Set<string>();

  // Group upstream terms by category
  const byCategory = new Map<string, GlossaryTerm[]>();
  for (const term of upstreamTerms.values()) {
    if (!byCategory.has(term.category)) {
      byCategory.set(term.category, []);
    }
    byCategory.get(term.category)?.push(term);
  }

  // Write each category file
  for (const [category, terms] of byCategory) {
    const filename = `${category}.json`;
    const filepath = join(glossaryDir, filename);

    // Sort alphabetically by ID
    terms.sort((a, b) => a.id.localeCompare(b.id));

    const newContent = `${JSON.stringify(terms, null, 2)}\n`;

    if (existsSync(filepath)) {
      const oldContent = readFileSync(filepath, "utf-8");
      if (oldContent !== newContent) {
        updatedCategories.add(category);
      }
    } else {
      updatedCategories.add(category);
    }

    writeFileSync(filepath, newContent, "utf-8");
  }

  return [...updatedCategories];
}

function reconcileProposals(
  proposalsDir: string,
  upstreamIds: Set<string>,
  verbose: boolean,
): {
  alreadyMerged: string[];
  nowConflicting: string[];
  stillPending: string[];
} {
  const alreadyMerged: string[] = [];
  const nowConflicting: string[] = [];
  const stillPending: string[] = [];

  // Check pending proposals
  const pending = loadPendingProposals(proposalsDir);
  for (const [id] of pending) {
    if (upstreamIds.has(id)) {
      // This proposal's ID now exists upstream — it was merged (or someone else added it)
      alreadyMerged.push(id);
    } else {
      stillPending.push(id);
    }
  }

  // Check done proposals — clean up those that are now in upstream
  const done = loadDoneProposals(proposalsDir);
  for (const id of done) {
    if (upstreamIds.has(id) && verbose) {
      console.error(`Done proposal '${id}' confirmed merged upstream`);
    }
  }

  return { alreadyMerged, nowConflicting, stillPending };
}

function moveToMerged(proposalsDir: string, mergedIds: string[]) {
  const mergedDir = join(proposalsDir, ".merged");
  mkdirSync(mergedDir, { recursive: true });

  for (const id of mergedIds) {
    // Check pending
    const pendingPath = join(proposalsDir, `${id}.json`);
    if (existsSync(pendingPath)) {
      renameSync(pendingPath, join(mergedDir, `${id}.json`));
    }
    // Check done
    const donePath = join(proposalsDir, ".done", `${id}.json`);
    if (existsSync(donePath)) {
      renameSync(donePath, join(mergedDir, `${id}.json`));
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs();

  const tmpDir = join(args.proposalsDir, ".sync-tmp");
  mkdirSync(tmpDir, { recursive: true });

  if (args.verbose) {
    console.error(
      `Fetching upstream glossary from ${args.upstream}/${args.branch}...`,
    );
  }

  // Fetch upstream
  const upstreamTerms = fetchUpstreamTerms(
    args.upstream,
    args.branch,
    tmpDir,
    args.verbose,
  );

  if (args.verbose) {
    console.error(`Upstream has ${upstreamTerms.size} terms`);
  }

  // Load local
  const localTerms = loadLocalTerms(args.glossaryDir);
  if (args.verbose) {
    console.error(`Local has ${localTerms.size} terms`);
  }

  // Diff
  const upstreamIds = new Set(upstreamTerms.keys());
  const localIds = new Set(localTerms.keys());

  const newFromUpstream = [...upstreamIds].filter((id) => !localIds.has(id));
  const removedUpstream = [...localIds].filter((id) => !upstreamIds.has(id));

  // Reconcile proposals
  const { alreadyMerged, nowConflicting, stillPending } = reconcileProposals(
    args.proposalsDir,
    upstreamIds,
    args.verbose,
  );

  let updatedCategories: string[] = [];

  if (!args.dryRun) {
    // Update local glossary from upstream
    updatedCategories = updateLocalGlossary(args.glossaryDir, upstreamTerms);

    // Move merged proposals
    if (alreadyMerged.length > 0) {
      moveToMerged(args.proposalsDir, alreadyMerged);
    }

    if (args.verbose) {
      console.error(`Updated ${updatedCategories.length} category files`);
      console.error(`Moved ${alreadyMerged.length} merged proposals`);
    }
  }

  // Cleanup tmp
  rmSync(tmpDir, { recursive: true, force: true });

  const result: SyncResult = {
    script: "sync-glossary",
    version: "1.0.0",
    mode: args.dryRun ? "dry-run" : "apply",
    upstream: `${args.upstream}/${args.branch}`,
    upstream_total_terms: upstreamTerms.size,
    local_total_terms: localTerms.size,
    new_from_upstream: newFromUpstream,
    removed_upstream: removedUpstream,
    proposals_already_merged: alreadyMerged,
    proposals_now_conflicting: nowConflicting,
    proposals_still_pending: stillPending,
    updated_categories: updatedCategories,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main();
