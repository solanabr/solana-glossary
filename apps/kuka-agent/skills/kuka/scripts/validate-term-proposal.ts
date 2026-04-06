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
i++;
                args.proposal = argv[i];
        break;
      case "--proposals-dir":
i++;
                args.proposalsDir = argv[i];
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

function checkRequiredFields(
  proposal: Record<string, unknown>,
  findings: Finding[],
): boolean {
  const requiredFields = ["id", "term", "definition", "category"];
  for (const field of requiredFields) {
    if (!(field in proposal)) {
      findings.push({
        severity: "critical",
        category: "structure",
        issue: `Missing required field: ${field}`,
        fix: `Add '${field}' to the proposal`,
      });
    }
  }
  return requiredFields.every((f) => f in proposal);
}

function checkIdAndCategory(
  termId: string,
  category: string,
  existingIds: Set<string>,
  findings: Finding[],
): void {
  if (!/^[a-z][a-z0-9-]*$/.test(termId)) {
    findings.push({
      severity: "critical",
      category: "structure",
      issue: `ID '${termId}' is not valid kebab-case`,
      fix: "Use lowercase letters, numbers, and hyphens only",
    });
  }
  if (existingIds.has(termId)) {
    findings.push({
      severity: "critical",
      category: "consistency",
      issue: `ID '${termId}' already exists in the glossary`,
      fix: "Choose a different ID or update the existing term",
    });
  }
  if (!VALID_CATEGORIES.includes(category as Category)) {
    findings.push({
      severity: "critical",
      category: "structure",
      issue: `Invalid category: '${category}'`,
      fix: `Use one of: ${VALID_CATEGORIES.join(", ")}`,
    });
  }
}

function checkDefinitionLength(definition: string, findings: Finding[]): void {
  if (definition.length < MIN_DEFINITION_LENGTH) {
    findings.push({
      severity: "high",
      category: "structure",
      issue: `Definition too short (${definition.length} chars, min ${MIN_DEFINITION_LENGTH})`,
      fix: "Expand the definition with more context",
    });
  }
  if (definition.length > MAX_DEFINITION_LENGTH) {
    findings.push({
      severity: "medium",
      category: "structure",
      issue: `Definition too long (${definition.length} chars, max ${MAX_DEFINITION_LENGTH})`,
      fix: "Condense the definition to be more concise",
    });
  }
}

function checkRelatedTerms(
  proposal: Record<string, unknown>,
  existingIds: Set<string>,
  pendingIds: Set<string>,
  findings: Finding[],
): void {
  const related = (proposal.related as string[]) ?? [];
  const knownIds = new Set([...existingIds, ...pendingIds]);
  for (const rel of related) {
    if (!knownIds.has(rel)) {
      findings.push({
        severity: "medium",
        category: "consistency",
        issue: `Related term '${rel}' not found in glossary or pending proposals`,
        fix: `Remove '${rel}' or ensure it exists/is being proposed`,
      });
    }
  }
}

function checkAliasCollisions(
  proposal: Record<string, unknown>,
  existingAliases: Map<string, string>,
  findings: Finding[],
): void {
  const aliases = (proposal.aliases as string[]) ?? [];
  for (const alias of aliases) {
    const collidesWith = existingAliases.get(alias.toLowerCase());
    if (collidesWith) {
      findings.push({
        severity: "high",
        category: "consistency",
        issue: `Alias '${alias}' collides with existing term '${collidesWith}'`,
        fix: "Remove this alias or rename it",
      });
    }
  }

  const termName = proposal.term as string;
  const nameCollision = existingAliases.get(termName.toLowerCase());
  if (nameCollision) {
    findings.push({
      severity: "medium",
      category: "consistency",
      issue: `Term name '${termName}' matches an alias of '${nameCollision}'`,
      fix: "Consider if this should be an update to the existing term instead",
    });
  }
}

function validateProposal(
  proposal: Record<string, unknown>,
  existingIds: Set<string>,
  existingAliases: Map<string, string>,
  pendingIds: Set<string>,
): Finding[] {
  const findings: Finding[] = [];

  const hasRequired = checkRequiredFields(proposal, findings);
  if (!hasRequired) {
    return findings;
  }

  const termId = proposal.id as string;
  const category = proposal.category as string;
  const definition = proposal.definition as string;

  checkIdAndCategory(termId, category, existingIds, findings);
  checkDefinitionLength(definition, findings);
  checkRelatedTerms(proposal, existingIds, pendingIds, findings);
  checkAliasCollisions(proposal, existingAliases, findings);

  return findings;
}

// ── Result building ────────────────────────────────────────────────────

function computeSeverityCounts(findings: Finding[]): Record<Finding["severity"], number> {
  const severity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) {
    severity[f.severity]++;
  }
  return severity;
}

function determineStatus(severity: Record<Finding["severity"], number>): "pass" | "warning" | "fail" {
  if (severity.critical > 0) return "fail";
  if (severity.high > 0) return "warning";
  return "pass";
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

  const findings = validateProposal(proposal, existingIds, existingAliases, pendingIds);
  const severity = computeSeverityCounts(findings);
  const status = determineStatus(severity);

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
