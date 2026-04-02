/**
 * Term Proposal Submitter
 *
 * Reads validated proposals from the staging area, injects them into
 * the correct glossary category JSON files, and optionally opens a PR
 * via GitHub CLI.
 *
 * Usage:
 *   npx tsx apps/kuka-agent/skills/kuka/scripts/submit-proposals.ts \
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

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  renameSync,
} from "node:fs";
import { join, basename } from "node:path";
import { execSync } from "node:child_process";
import {
  allTerms,
  getCategories,
  type GlossaryTerm,
  type Category,
} from "../../../../../src/index";

// ── Types ───────────────────────────────────────────────────────────────

interface Proposal {
  id: string;
  term: string;
  definition: string;
  category: Category;
  aliases?: string[];
  related?: string[];
}

interface InjectionPlan {
  proposal_id: string;
  file: string;
  category: string;
  insert_after: string | null;
  validation: "pass" | "warning" | "fail";
  issues: string[];
}

interface SubmitResult {
  script: string;
  version: string;
  mode: "dry-run" | "apply" | "pr";
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
  for (const file of readdirSync(proposalsDir).sort()) {
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
): { status: "pass" | "warning" | "fail"; issues: string[] } {
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
      issues.push(`Alias '${alias}' collides with existing term '${collision}'`);
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

  return {
    status: hasCritical ? "fail" : issues.length > 0 ? "warning" : "pass",
    issues,
  };
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

function findInsertPosition(
  terms: GlossaryTerm[],
  newId: string,
): { index: number; afterId: string | null } {
  // Insert alphabetically by ID
  for (let i = 0; i < terms.length; i++) {
    if (newId.localeCompare(terms[i].id) < 0) {
      return { index: i, afterId: i > 0 ? terms[i - 1].id : null };
    }
  }
  return {
    index: terms.length,
    afterId: terms.length > 0 ? terms[terms.length - 1].id : null,
  };
}

function injectTerm(
  glossaryDir: string,
  proposal: Proposal,
): { file: string; insertAfter: string | null } {
  const filename = CATEGORY_FILE_MAP[proposal.category];
  const filepath = join(glossaryDir, filename);

  const terms: GlossaryTerm[] = JSON.parse(
    readFileSync(filepath, "utf-8"),
  );

  const { index, afterId } = findInsertPosition(terms, proposal.id);

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

  terms.splice(index, 0, newTerm as GlossaryTerm);

  writeFileSync(filepath, JSON.stringify(terms, null, 2) + "\n", "utf-8");

  return { file: filename, insertAfter: afterId };
}

// ── PR creation ─────────────────────────────────────────────────────────

function createPR(
  repo: string,
  proposals: Proposal[],
  filesModified: string[],
): string | null {
  const branchName = `proposal/kuka-batch-${new Date().toISOString().slice(0, 10)}`;
  const termList = proposals.map((p) => `- \`${p.id}\` (${p.category}): ${p.term}`).join("\n");

  try {
    // Check if gh is available
    execSync("gh --version", { stdio: "pipe" });
  } catch {
    console.error("Warning: gh CLI not available, skipping PR creation", );
    return null;
  }

  try {
    // Create branch, add, commit
    execSync(`git checkout -b ${branchName}`, { stdio: "pipe" });
    execSync(`git add ${filesModified.join(" ")}`, { stdio: "pipe" });

    const commitMsg = `feat(glossary): add ${proposals.length} community-proposed term${proposals.length > 1 ? "s" : ""}\n\nTerms proposed by Kuka agent during teaching conversations:\n${termList}`;
    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
      stdio: "pipe",
    });

    // Create PR
    const prBody = `## Glossary Expansion — Kuka Agent Proposals

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

    const result = execSync(
      `gh pr create --repo ${repo} --title "feat(glossary): add ${proposals.length} community-proposed terms" --body "${prBody.replace(/"/g, '\\"')}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );

    return result.trim();
  } catch (err: any) {
    console.error(`Warning: PR creation failed: ${err.message}`, );
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs();

  // Load existing glossary data for validation
  const existingIds = new Set(allTerms.map((t) => t.id));
  const existingAliases = new Map<string, string>();
  for (const t of allTerms) {
    for (const alias of t.aliases ?? []) {
      existingAliases.set(alias.toLowerCase(), t.id);
    }
  }

  // Load proposals
  const proposals = loadProposals(args.proposalsDir);
  if (args.verbose) {
    console.error(`Found ${proposals.length} proposals in ${args.proposalsDir}`);
  }

  // Validate and build plan
  const plan: InjectionPlan[] = [];
  const validProposals: Proposal[] = [];
  const filesModified = new Set<string>();

  for (const proposal of proposals) {
    const { status, issues } = validateProposal(
      proposal,
      existingIds,
      existingAliases,
    );

    const filename = CATEGORY_FILE_MAP[proposal.category] ?? "unknown";

    plan.push({
      proposal_id: proposal.id,
      file: filename,
      category: proposal.category,
      insert_after: null, // filled during injection
      validation: status,
      issues,
    });

    if (status !== "fail") {
      validProposals.push(proposal);
      filesModified.add(join(args.glossaryDir, filename));
    }
  }

  let injectedCount = 0;
  let prUrl: string | null = null;

  if (!args.dryRun && validProposals.length > 0) {
    // Apply injections
    for (const proposal of validProposals) {
      const { file, insertAfter } = injectTerm(args.glossaryDir, proposal);
      injectedCount++;

      // Update plan with insert position
      const planEntry = plan.find((p) => p.proposal_id === proposal.id);
      if (planEntry) {
        planEntry.insert_after = insertAfter;
      }

      // Add to existing IDs so subsequent proposals don't collide
      existingIds.add(proposal.id);
      for (const alias of proposal.aliases ?? []) {
        existingAliases.set(alias.toLowerCase(), proposal.id);
      }

      if (args.verbose) {
        console.error(`Injected ${proposal.id} into ${file}`);
      }
    }

    // Move injected proposals to .done/
    const doneDir = join(args.proposalsDir, ".done");
    mkdirSync(doneDir, { recursive: true });
    for (const proposal of validProposals) {
      const src = join(args.proposalsDir, `${proposal.id}.json`);
      const dst = join(doneDir, `${proposal.id}.json`);
      if (existsSync(src)) {
        renameSync(src, dst);
      }
    }

    // Create PR if requested
    if (args.pr) {
      prUrl = createPR(args.prRepo, validProposals, [...filesModified]);
    }
  }

  const mode = args.pr ? "pr" : args.dryRun ? "dry-run" : "apply";

  const result: SubmitResult = {
    script: "submit-proposals",
    version: "1.0.0",
    mode,
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
