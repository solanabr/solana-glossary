/**
 * Term Proposal Validator
 *
 * Validate a proposed glossary term against the Solana Glossary schema
 * and existing data. Ensures proposals are ready for review and submission.
 *
 * Usage:
 *   npx tsx@4 apps/kuka-agent/skills/kuka/scripts/validate-term-proposal.ts \
 *     --proposal .kuka/proposals/jito-bundles.json
 *     [--proposals-dir .kuka/proposals/]
 *     [--verbose]
 *
 *   echo '{"id":"jito-bundles",...}' | npx tsx@4 validate-term-proposal.ts --proposal -
 *
 * Output: JSON to stdout with pass/fail status and detailed findings.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  allTerms,
  type Category,
  getCategories,
} from "../../../../../src/index";

// ── Constants ───────────────────────────────────────────────────────────

const VALID_CATEGORIES = getCategories();
const MIN_DEFINITION_LENGTH = 50;
const MAX_DEFINITION_LENGTH = 500;

// ── Types ───────────────────────────────────────────────────────────────

interface Finding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: "structure" | "consistency";
  issue: string;
  fix: string;
}

interface ValidationResult {
  script: string;
  version: string;
  proposal_id: string;
  status: "pass" | "warning" | "fail";
  findings: Finding[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

// ── CLI args ────────────────────────────────────────────────────────────

interface Args {
  proposal: string;
  proposalsDir?: string;
  verbose: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = { proposal: "", verbose: false };

  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(
      `
Term Proposal Validator — validate proposed glossary terms against schema and existing data.

Options:
  --proposal <path>       Path to proposal JSON file, or '-' for stdin (required)
  --proposals-dir <path>  Path to .kuka/proposals/ for pending proposals
  --verbose               Print diagnostics to stderr
  --help, -h              Show this help

Output: JSON to stdout with pass/fail status and detailed findings.
    `.trim(),
    );
    process.exit(0);
  }

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--proposal":
        args.proposal = argv[++i];
        break;
      case "--proposals-dir":
        args.proposalsDir = argv[++i];
        break;
      case "--verbose":
        args.verbose = true;
        break;
    }
  }

  if (!args.proposal) {
    console.error("Error: --proposal is required");
    process.exit(2);
  }

  return args;
}

// ── Loaders ─────────────────────────────────────────────────────────────

function loadExistingData(): {
  ids: Set<string>;
  aliases: Map<string, string>;
} {
  const ids = new Set<string>();
  const aliases = new Map<string, string>();

  for (const term of allTerms) {
    ids.add(term.id);
    for (const alias of term.aliases ?? []) {
      aliases.set(alias.toLowerCase(), term.id);
    }
  }

  return { ids, aliases };
}

function loadPendingProposals(proposalsDir?: string): Set<string> {
  const pending = new Set<string>();
  if (!proposalsDir || !existsSync(proposalsDir)) return pending;

  for (const file of readdirSync(proposalsDir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const data = JSON.parse(readFileSync(join(proposalsDir, file), "utf-8"));
      if (data.id) pending.add(data.id);
    } catch {
      // skip invalid files
    }
  }

  return pending;
}

function loadProposal(proposalPath: string): Record<string, unknown> {
  if (proposalPath === "-") {
    return JSON.parse(readFileSync(0, "utf-8"));
  }
  if (!existsSync(proposalPath)) {
    console.error(`Error: proposal file not found: ${proposalPath}`);
    process.exit(2);
  }
  return JSON.parse(readFileSync(proposalPath, "utf-8"));
}

// ── Validation ──────────────────────────────────────────────────────────

function validateProposal(
  proposal: Record<string, unknown>,
  existingIds: Set<string>,
  existingAliases: Map<string, string>,
  pendingIds: Set<string>,
): Finding[] {
  const findings: Finding[] = [];

  const finding = (
    severity: Finding["severity"],
    category: Finding["category"],
    issue: string,
    fix: string,
  ) => {
    findings.push({ severity, category, issue, fix });
  };

  // Required fields
  const requiredFields = ["id", "term", "definition", "category"];
  for (const field of requiredFields) {
    if (!(field in proposal)) {
      finding(
        "critical",
        "structure",
        `Missing required field: ${field}`,
        `Add '${field}' to the proposal`,
      );
    }
  }

  if (!requiredFields.every((f) => f in proposal)) {
    return findings; // Can't continue without required fields
  }

  const termId = proposal.id as string;
  const category = proposal.category as string;
  const definition = proposal.definition as string;

  // ID format
  if (!/^[a-z][a-z0-9-]*$/.test(termId)) {
    finding(
      "critical",
      "structure",
      `ID '${termId}' is not valid kebab-case`,
      "Use lowercase letters, numbers, and hyphens only",
    );
  }

  // ID uniqueness
  if (existingIds.has(termId)) {
    finding(
      "critical",
      "consistency",
      `ID '${termId}' already exists in the glossary`,
      "Choose a different ID or update the existing term",
    );
  }

  // Category validity
  if (!VALID_CATEGORIES.includes(category as Category)) {
    finding(
      "critical",
      "structure",
      `Invalid category: '${category}'`,
      `Use one of: ${VALID_CATEGORIES.join(", ")}`,
    );
  }

  // Definition length
  if (definition.length < MIN_DEFINITION_LENGTH) {
    finding(
      "high",
      "structure",
      `Definition too short (${definition.length} chars, min ${MIN_DEFINITION_LENGTH})`,
      "Expand the definition with more context",
    );
  }
  if (definition.length > MAX_DEFINITION_LENGTH) {
    finding(
      "medium",
      "structure",
      `Definition too long (${definition.length} chars, max ${MAX_DEFINITION_LENGTH})`,
      "Condense the definition to be more concise",
    );
  }

  // Related terms existence
  const related = (proposal.related as string[]) ?? [];
  const knownIds = new Set([...existingIds, ...pendingIds]);
  for (const rel of related) {
    if (!knownIds.has(rel)) {
      finding(
        "medium",
        "consistency",
        `Related term '${rel}' not found in glossary or pending proposals`,
        `Remove '${rel}' or ensure it exists/is being proposed`,
      );
    }
  }

  // Alias collisions
  const aliases = (proposal.aliases as string[]) ?? [];
  for (const alias of aliases) {
    const collidesWith = existingAliases.get(alias.toLowerCase());
    if (collidesWith) {
      finding(
        "high",
        "consistency",
        `Alias '${alias}' collides with existing term '${collidesWith}'`,
        "Remove this alias or rename it",
      );
    }
  }

  // Term name collision with existing alias
  const termName = proposal.term as string;
  const nameCollision = existingAliases.get(termName.toLowerCase());
  if (nameCollision) {
    finding(
      "medium",
      "consistency",
      `Term name '${termName}' matches an alias of '${nameCollision}'`,
      "Consider if this should be an update to the existing term instead",
    );
  }

  return findings;
}

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs();

  const proposal = loadProposal(args.proposal);
  const { ids: existingIds, aliases: existingAliases } = loadExistingData();
  const pendingIds = loadPendingProposals(args.proposalsDir);

  if (args.verbose) {
    console.error(
      `Glossary: ${existingIds.size} terms, ${existingAliases.size} aliases`,
    );
    console.error(`Pending proposals: ${pendingIds.size}`);
  }

  const findings = validateProposal(
    proposal,
    existingIds,
    existingAliases,
    pendingIds,
  );

  const severity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) {
    severity[f.severity]++;
  }

  let status: "pass" | "warning" | "fail";
  if (severity.critical > 0) status = "fail";
  else if (severity.high > 0) status = "warning";
  else status = "pass";

  const result: ValidationResult = {
    script: "validate-term-proposal",
    version: "1.0.0",
    proposal_id: (proposal.id as string) ?? "unknown",
    status,
    findings,
    summary: {
      total: findings.length,
      ...severity,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(status === "pass" ? 0 : 1);
}

main();
