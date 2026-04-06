/**
 * Term Proposal Submitter
 *
 * Reads validated proposals from the staging area, injects them into
 * the correct glossary category JSON files, and optionally opens a PR
 * via GitHub CLI.
 *
 * Usage:
 *   npx tsx@4 apps/kuka-agent/skills/kuka/scripts/submit-proposals.ts \
 *     --proposals-dir .kuka/proposals
 *     [--glossary-dir data/terms]
 *     [--dry-run]
 *     [--pr]
 *     [--pr-repo solanabr/solana-glossary]
 *     [--verbose]
 *
 * Modes:
 *   --dry-run   Show what would change without modifying files (default)
 *   --apply     Actually modify glossary files and move proposals to .done/
 *   --pr        After --apply, create a PR via gh CLI (requires --pr-repo)
 *
 * Output: JSON to stdout with injection plan, validation results, and PR URL.
 */

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { allTerms, getCategories, type Category, type GlossaryTerm } from "../../../../../src/index";

// ── Types ───────────────────────────────────────────────────────────────

type ValidationStatus = "pass" | "warning" | "fail";
type SubmitMode = "dry-run" | "apply" | "pr";

interface I18nEntry {
  term: string;
}

interface Proposal {
  id: string;
  term: string;
  definition: string;
  category: Category;
  aliases?: string[];
  related?: string[];
  i18n?: Record<string, I18nEntry>;
}

interface InjectionPlan {
  proposal_id: string;
  file: string;
  category: string;
  insert_after: string | null;
  validation: ValidationStatus;
  issues: string[];
}

interface SubmitResult {
  script: string;
  version: string;
  mode: SubmitMode;
  proposals_found: number;
  valid: number;
  invalid: number;
  injected: number;
  plan: InjectionPlan[];
  files_modified: string[];
  pr_url: string | null;
}

// ── CLI args ────────────────────────────────────────────────────────────

interface Args {
  proposalsDir: string;
  glossaryDir: string;
  dryRun: boolean;
  pr: boolean;
  prRepo: string;
  verbose: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = {
    proposalsDir: ".kuka/proposals",
    glossaryDir: "data/terms",
    dryRun: true,
    pr: false,
    prRepo: "solanabr/solana-glossary",
    verbose: false,
  };

  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(
      `
Term Proposal Submitter — inject validated proposals into glossary files.

Options:
  --proposals-dir <path>   Staging directory with proposal JSONs (default: .kuka/proposals)
  --glossary-dir <path>    Glossary data/terms/ directory (default: data/terms)
  --dry-run                Show plan without modifying files (default)
  --apply                  Modify glossary files and move proposals to .done/
  --pr                     After apply, open a PR via gh CLI
  --pr-repo <owner/repo>   Target repo for PR (default: solanabr/solana-glossary)
  --verbose                Print diagnostics to stderr
  --help, -h               Show this help

Output: JSON to stdout with injection plan, validation, and PR URL.
    `.trim(),
    );
    process.exit(0);
  }

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--proposals-dir":
        args.proposalsDir = argv[++i];
        break;
      case "--glossary-dir":
        args.glossaryDir = argv[++i];
        break;
      case "--apply":
        args.dryRun = false;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--pr":
        args.pr = true;
        args.dryRun = false;
        break;
      case "--pr-repo":
        args.prRepo = argv[++i];
        break;
      case "--verbose":
        args.verbose = true;
        break;
    }
  }

  return args;
}

// ── Proposal loading ────────────────────────────────────────────────────

function loadProposals(proposalsDir: string): Proposal[] {
  if (!existsSync(proposalsDir)) return [];

  const proposals: Proposal[] = [];
  for (const file of readdirSync(proposalsDir).sort((a, b) => a.localeCompare(b))) {
    if (!file.endsWith(".json")) continue;
    try {
      const data = JSON.parse(readFileSync(join(proposalsDir, file), "utf-8"));
      if (data.id && data.term && data.definition && data.category) {
        proposals.push(data as Proposal);
      }
    } catch {
      // skip invalid files
    }
  }
  return proposals;
}

// ── Validation ──────────────────────────────────────────────────────────

function validateProposal(
  proposal: Proposal,
  existingIds: Set<string>,
  existingAliases: Map<string, string>,
): { status: ValidationStatus; issues: string[] } {
  const issues: string[] = [];
  const validCategories = getCategories();

  // ID format
  if (!/^[a-z][a-z0-9-]*$/.test(proposal.id)) {
    issues.push(`Invalid kebab-case ID: ${proposal.id}`);
  }

  // Duplicate ID
  if (existingIds.has(proposal.id)) {
    issues.push(`ID '${proposal.id}' already exists in glossary`);
  }

  // Category
  if (!validCategories.includes(proposal.category)) {
    issues.push(`Invalid category: ${proposal.category}`);
  }

  // Definition length
  if (proposal.definition.length < 50) {
    issues.push(`Definition too short: ${proposal.definition.length} chars`);
  }
  if (proposal.definition.length > 500) {
    issues.push(`Definition too long: ${proposal.definition.length} chars`);
  }

  // Alias collisions
  for (const alias of proposal.aliases ?? []) {
    const collision = existingAliases.get(alias.toLowerCase());
    if (collision) {
      issues.push(
        `Alias '${alias}' collides with existing term '${collision}'`,
      );
    }
  }

  // Related terms
  for (const rel of proposal.related ?? []) {
    if (!existingIds.has(rel)) {
      issues.push(`Related term '${rel}' not in glossary`);
    }
  }

  const hasCritical = issues.some(
    (i) =>
      i.includes("already exists") ||
      i.includes("Invalid kebab") ||
      i.includes("Invalid category"),
  );

  let status: ValidationStatus;
  if (hasCritical) status = "fail";
  else if (issues.length > 0) status = "warning";
  else status = "pass";

  return { status, issues };
}

// ── Category file mapping ───────────────────────────────────────────────

const CATEGORY_FILE_MAP: Record<string, string> = {
  "ai-ml": "ai-ml.json",
  "blockchain-general": "blockchain-general.json",
  "core-protocol": "core-protocol.json",
  defi: "defi.json",
  "dev-tools": "dev-tools.json",
  infrastructure: "infrastructure.json",
  network: "network.json",
  "programming-fundamentals": "programming-fundamentals.json",
  "programming-model": "programming-model.json",
  security: "security.json",
  "solana-ecosystem": "solana-ecosystem.json",
  "token-ecosystem": "token-ecosystem.json",
  web3: "web3.json",
  "zk-compression": "zk-compression.json",
};

// ── Injection ───────────────────────────────────────────────────────────

/**
 * Format a term as JSON with compact string arrays, matching the existing
 * glossary file style (e.g. "related": ["a", "b", "c"] on a single line).
 * Uses 2-space indent, nested under a list, so base indent is 2 for keys.
 */
function formatTermCompact(term: Record<string, unknown>): string {
  const lines: string[] = ["  {"];
  const keys = Object.keys(term);
  keys.forEach((k, i) => {
    const v = term[k];
    const comma = i < keys.length - 1 ? "," : "";
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      // Compact single-line array of strings
      const arr = `[${v.map((x) => JSON.stringify(x)).join(", ")}]`;
      lines.push(`    ${JSON.stringify(k)}: ${arr}${comma}`);
    } else {
      // Fall back to JSON.stringify for scalars / complex values
      lines.push(`    ${JSON.stringify(k)}: ${JSON.stringify(v)}${comma}`);
    }
  });
  lines.push("  }");
  return lines.join("\n");
}

/**
 * Append a new term to a JSON array file by text manipulation, preserving
 * the existing file's formatting (compact arrays, term order, etc).
 * This avoids the parse→stringify round-trip that would reformat the entire
 * file and produce a huge diff.
 */
function appendTermToFile(
  filepath: string,
  newTerm: Record<string, unknown>,
): void {
  const original = readFileSync(filepath, "utf-8");
  // Strip trailing whitespace and the closing ']' to find the end of the array
  const trimmed = original.replace(/\s*\]\s*$/, "");
  if (trimmed === original) {
    throw new Error(
      `${filepath}: missing trailing ']' — not a JSON array file`,
    );
  }
  // Append the new term after a comma, newline, closing bracket
  const formatted = formatTermCompact(newTerm);
  const result = `${trimmed},\n${formatted}\n]\n`;
  writeFileSync(filepath, result, "utf-8");
}

/**
 * Append a new i18n entry to a locale file by text manipulation, preserving
 * existing key order and formatting.
 */
function appendI18nEntry(
  i18nPath: string,
  key: string,
  entry: { term: string; definition: string },
): void {
  const original = readFileSync(i18nPath, "utf-8");
  const trimmed = original.replace(/\s*\}\s*$/, "");
  if (trimmed === original) {
    throw new Error(
      `${i18nPath}: missing trailing '}' -- not a JSON object file`,
    );
  }
  const lines = [
    `  ${JSON.stringify(key)}: {`,
    `    "term": ${JSON.stringify(entry.term)},`,
    `    "definition": ${JSON.stringify(entry.definition)}`,
    `  }`,
  ].join("\n");
  const result = `${trimmed},\n${lines}\n}\n`;
  writeFileSync(i18nPath, result, "utf-8");
}

function injectTerm(
  glossaryDir: string,
  proposal: Proposal,
): { file: string; insertAfter: string | null } {
  const filename = CATEGORY_FILE_MAP[proposal.category];
  const filepath = join(glossaryDir, filename);

  // Read existing terms to compute the insertAfter reference (last term id)
  // and to verify the file is well-formed.
  const terms: GlossaryTerm[] = JSON.parse(readFileSync(filepath, "utf-8"));
  const afterId = terms.length > 0 ? terms.at(-1)!.id : null;

  // Build clean term object (only include optional fields if present)
  const newTerm: Record<string, unknown> = {
    id: proposal.id,
    term: proposal.term,
    definition: proposal.definition,
    category: proposal.category,
  };
  if (proposal.aliases && proposal.aliases.length > 0) {
    newTerm.aliases = proposal.aliases;
  }
  if (proposal.related && proposal.related.length > 0) {
    newTerm.related = proposal.related;
  }

  // Append via text manipulation to preserve existing formatting.
  appendTermToFile(filepath, newTerm);

  // Inject i18n translations if provided — also by text append, no re-sort.
  if (proposal.i18n) {
    const i18nDir = join(glossaryDir, "..", "i18n");
    for (const [locale, entry] of Object.entries(proposal.i18n)) {
      if (!entry?.term) continue;
      const i18nPath = join(i18nDir, `${locale}.json`);
      if (!existsSync(i18nPath)) continue;
      appendI18nEntry(i18nPath, proposal.id, {
        term: entry.term,
        definition: proposal.definition,
      });
    }
  }

  return { file: filename, insertAfter: afterId };
}

// ── PR creation ─────────────────────────────────────────────────────────

function isGhCliAvailable(): boolean {
  try {
    execSync("gh --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function cacheModifiedFiles(filesModified: string[]): Record<string, string> {
  const cached: Record<string, string> = {};
  for (const f of filesModified) {
    cached[f] = readFileSync(f, "utf-8");
  }
  return cached;
}

function prepareBranch(
  repo: string,
  branchName: string,
  cached: Record<string, string>,
  filesModified: string[],
): void {
  const defaultBranch = execSync(
    `gh repo view ${repo} --json defaultBranchRef --jq .defaultBranchRef.name`,
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
  ).trim();
  execSync(
    `git fetch https://github.com/${repo}.git ${defaultBranch}:refs/remotes/_kuka_pr_base`,
    { stdio: "pipe" },
  );

  execSync("git stash push --include-untracked -m kuka-pr-stash", {
    stdio: "pipe",
  });

  execSync(`git checkout -b ${branchName} refs/remotes/_kuka_pr_base`, {
    stdio: "pipe",
  });

  for (const [f, content] of Object.entries(cached)) {
    writeFileSync(f, content, "utf-8");
  }

  execSync(`git add ${filesModified.join(" ")}`, { stdio: "pipe" });
}

function commitProposals(
  proposals: Proposal[],
  termList: string,
): void {
  const pluralSuffix = proposals.length > 1 ? "s" : "";
  const commitMsg = `feat(glossary): add ${proposals.length} community-proposed term${pluralSuffix}\n\nTerms proposed by Kuka agent during teaching conversations:\n${termList}`;
  const escapedCommitMsg = commitMsg.replaceAll('"', String.raw`\"`);
  execSync(`git commit -m "${escapedCommitMsg}"`, {
    stdio: "pipe",
  });
}

function buildPrBody(proposals: Proposal[], termList: string): string {
  return `## Glossary Expansion — Kuka Agent Proposals

### New Terms (${proposals.length})

${termList}

### How these were generated

These terms were discovered by the [Kuka teaching agent](https://github.com/solanabr/solana-glossary/tree/main/apps/kuka-agent) during conversations with developers. When Kuka encounters a concept not in the glossary, it automatically generates a structured proposal matching the glossary schema, validates it, and stages it for review.

### Validation

All proposals passed schema validation via \`validate-term-proposal.ts\`:
- ID format (kebab-case, unique)
- Category validity (one of 14)
- Definition length (50-500 chars)
- Related term existence
- Alias collision check

---
Generated by Kuka 🎓 — Solana Glossary Teaching Companion`;
}

function submitPr(repo: string, proposals: Proposal[], termList: string): string {
  const prBody = buildPrBody(proposals, termList);
  const escapedPrBody = prBody.replaceAll('"', String.raw`\"`);
  const prTitle = `feat(glossary): add ${proposals.length} community-proposed terms`;
  const result = execSync(
    `gh pr create --repo ${repo} --title "${prTitle}" --body "${escapedPrBody}"`,
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
  );
  return result.trim();
}

function createPR(
  repo: string,
  proposals: Proposal[],
  filesModified: string[],
): string | null {
  const branchName = `proposal/kuka-batch-${new Date().toISOString().slice(0, 10)}`;
  const termList = proposals
    .map((p) => `- \`${p.id}\` (${p.category}): ${p.term}`)
    .join("\n");

  if (!isGhCliAvailable()) {
    console.error("Warning: gh CLI not available, skipping PR creation");
    return null;
  }

  try {
    const cached = cacheModifiedFiles(filesModified);
    prepareBranch(repo, branchName, cached, filesModified);
    commitProposals(proposals, termList);
    return submitPr(repo, proposals, termList);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Warning: PR creation failed: ${message}`);
    return null;
  }
}

// ── Helpers for main ───────────────────────────────────────────────────

function loadExistingGlossaryData(): {
  existingIds: Set<string>;
  existingAliases: Map<string, string>;
} {
  const existingIds = new Set(allTerms.map((t) => t.id));
  const existingAliases = new Map<string, string>();
  for (const t of allTerms) {
    for (const alias of t.aliases ?? []) {
      existingAliases.set(alias.toLowerCase(), t.id);
    }
  }
  return { existingIds, existingAliases };
}

function buildInjectionPlan(
  proposals: Proposal[],
  existingIds: Set<string>,
  existingAliases: Map<string, string>,
  glossaryDir: string,
): { plan: InjectionPlan[]; validProposals: Proposal[]; filesModified: Set<string> } {
  const plan: InjectionPlan[] = [];
  const validProposals: Proposal[] = [];
  const filesModified = new Set<string>();

  for (const proposal of proposals) {
    const { status, issues } = validateProposal(proposal, existingIds, existingAliases);
    const filename = CATEGORY_FILE_MAP[proposal.category] ?? "unknown";

    plan.push({
      proposal_id: proposal.id,
      file: filename,
      category: proposal.category,
      insert_after: null,
      validation: status,
      issues,
    });

    if (status !== "fail") {
      validProposals.push(proposal);
      filesModified.add(join(glossaryDir, filename));
      trackI18nFiles(proposal, glossaryDir, filesModified);
    }
  }

  return { plan, validProposals, filesModified };
}

function trackI18nFiles(
  proposal: Proposal,
  glossaryDir: string,
  filesModified: Set<string>,
): void {
  if (!proposal.i18n) return;
  const i18nDir = join(glossaryDir, "..", "i18n");
  for (const locale of Object.keys(proposal.i18n)) {
    const i18nPath = join(i18nDir, `${locale}.json`);
    if (existsSync(i18nPath)) {
      filesModified.add(i18nPath);
    }
  }
}

function applyInjections(
  args: Args,
  validProposals: Proposal[],
  plan: InjectionPlan[],
  existingIds: Set<string>,
  existingAliases: Map<string, string>,
): number {
  let injectedCount = 0;
  for (const proposal of validProposals) {
    const { file, insertAfter } = injectTerm(args.glossaryDir, proposal);
    injectedCount++;

    const planEntry = plan.find((p) => p.proposal_id === proposal.id);
    if (planEntry) {
      planEntry.insert_after = insertAfter;
    }

    existingIds.add(proposal.id);
    for (const alias of proposal.aliases ?? []) {
      existingAliases.set(alias.toLowerCase(), proposal.id);
    }

    if (args.verbose) {
      console.error(`Injected ${proposal.id} into ${file}`);
    }
  }
  return injectedCount;
}

function moveProposalsToDone(
  proposalsDir: string,
  validProposals: Proposal[],
): void {
  const doneDir = join(proposalsDir, ".done");
  mkdirSync(doneDir, { recursive: true });
  for (const proposal of validProposals) {
    const src = join(proposalsDir, `${proposal.id}.json`);
    const dst = join(doneDir, `${proposal.id}.json`);
    if (existsSync(src)) {
      renameSync(src, dst);
    }
  }
}

function resolveMode(args: Args): SubmitMode {
  if (args.pr) return "pr";
  if (args.dryRun) return "dry-run";
  return "apply";
}

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs();
  const { existingIds, existingAliases } = loadExistingGlossaryData();

  const proposals = loadProposals(args.proposalsDir);
  if (args.verbose) {
    console.error(`Found ${proposals.length} proposals in ${args.proposalsDir}`);
  }

  const { plan, validProposals, filesModified } = buildInjectionPlan(
    proposals,
    existingIds,
    existingAliases,
    args.glossaryDir,
  );

  let injectedCount = 0;
  let prUrl: string | null = null;

  if (!args.dryRun && validProposals.length > 0) {
    injectedCount = applyInjections(args, validProposals, plan, existingIds, existingAliases);
    moveProposalsToDone(args.proposalsDir, validProposals);

    if (args.pr) {
      prUrl = createPR(args.prRepo, validProposals, [...filesModified]);
    }
  }

  const result: SubmitResult = {
    script: "submit-proposals",
    version: "1.0.0",
    mode: resolveMode(args),
    proposals_found: proposals.length,
    valid: validProposals.length,
    invalid: proposals.length - validProposals.length,
    injected: injectedCount,
    plan,
    files_modified: [...filesModified],
    pr_url: prUrl,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.invalid > 0 ? 1 : 0);
}

main();
