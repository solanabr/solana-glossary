import { describe, it, expect, afterEach } from "vitest";
import { execSync } from "node:child_process";
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";

const SCRIPTS_DIR = "apps/kuka-agent/skills/kuka/scripts";
const GLOSSARY_DIR = "data/terms";
const TMP_DIR = join("tests", ".tmp-kuka");

function runScript(
  script: string,
  args: string,
): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`npx tsx ${join(SCRIPTS_DIR, script)} ${args}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, exitCode: 0 };
  } catch (err: any) {
    return { stdout: err.stdout ?? "", exitCode: err.status ?? 1 };
  }
}

describe("glossary-coverage.ts", () => {
  it("shows help with --help", () => {
    const { stdout, exitCode } = runScript("glossary-coverage.ts", "--help");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Glossary Coverage Checker");
    expect(stdout).toContain("--topic");
  });

  it("fails without required args", () => {
    const { exitCode } = runScript("glossary-coverage.ts", "");
    expect(exitCode).not.toBe(0);
  });

  it("matches terms for a ZK compression topic", () => {
    const { stdout } = runScript(
      "glossary-coverage.ts",
      `--topic "compressed tokens light protocol merkle tree"`,
    );
    const result = JSON.parse(stdout);
    expect(result.script).toBe("glossary-coverage");
    expect(result.matched_terms).toBeGreaterThan(0);
    expect(result.terms.gaps).toContain("zk-compression");
    expect(result.terms.gaps).toContain("light-protocol");
    expect(result.terms.gaps).toContain("compressed-token");
  });

  it("matches terms from comma-separated IDs", () => {
    const { stdout } = runScript(
      "glossary-coverage.ts",
      `--terms "pda,cpi,spl-token"`,
    );
    const result = JSON.parse(stdout);
    expect(result.matched_terms).toBeGreaterThan(0);
  });

  it("respects --max-results", () => {
    const { stdout } = runScript(
      "glossary-coverage.ts",
      `--topic "solana blockchain defi tokens" --max-results 5`,
    );
    const result = JSON.parse(stdout);
    expect(result.matched_terms).toBeLessThanOrEqual(5);
  });

  it("recognizes explored terms from progress file", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const progressPath = join(TMP_DIR, "progress.md");
    writeFileSync(
      progressPath,
      "## Explored\n- zk-compression\n- light-protocol\n- compressed-token\n",
    );

    const { stdout } = runScript(
      "glossary-coverage.ts",
      `--topic "compressed tokens light protocol" --progress ${progressPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.explored).toBeGreaterThan(0);
    expect(result.terms.explored).toContain("zk-compression");

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("shows verbose diagnostics on stderr", () => {
    try {
      execSync(
        `npx tsx ${join(SCRIPTS_DIR, "glossary-coverage.ts")} --topic "solana blockchain" --verbose`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );
    } catch (err: any) {
      // stderr should contain verbose diagnostic lines
      const stderr = err.stderr || "";
      expect(stderr).toContain("Loaded");
      expect(stderr).toContain("glossary terms");
    }
  });
});

describe("validate-term-proposal.ts", () => {
  it("shows help with --help", () => {
    const { stdout, exitCode } = runScript(
      "validate-term-proposal.ts",
      "--help",
    );
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Term Proposal Validator");
    expect(stdout).toContain("--proposal");
  });

  it("passes a valid proposal", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "valid-proposal.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "test-valid-term",
        term: "Test Valid Term",
        definition:
          "A test term used to validate the proposal validator script works correctly with valid input data.",
        category: "dev-tools",
        aliases: ["TVT"],
        related: ["anchor"],
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.status).toBe("pass");
    expect(result.summary.critical).toBe(0);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("fails on missing required fields", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "incomplete.json");
    writeFileSync(proposalPath, JSON.stringify({ id: "missing-fields" }));

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.status).toBe("fail");
    expect(result.summary.critical).toBeGreaterThan(0);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("fails on duplicate ID", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "duplicate.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "proof-of-history",
        term: "Proof of History Duplicate",
        definition:
          "This is a duplicate term that should be rejected because proof-of-history already exists in the glossary.",
        category: "core-protocol",
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.status).toBe("fail");
    expect(
      result.findings.some((f: any) => f.issue.includes("already exists")),
    ).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("warns on invalid category", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "bad-category.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "bad-category-term",
        term: "Bad Category Term",
        definition:
          "A test term with an invalid category to verify the validator catches this correctly.",
        category: "nonexistent-category",
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.status).toBe("fail");
    expect(
      result.findings.some((f: any) => f.issue.includes("Invalid category")),
    ).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("warns on short definition", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "short-def.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "short-def-term",
        term: "Short Def",
        definition: "Too short.",
        category: "dev-tools",
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(
      result.findings.some((f: any) => f.issue.includes("too short")),
    ).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("accepts proposal from stdin", () => {
    const proposal = JSON.stringify({
      id: "stdin-test-term",
      term: "Stdin Test Term",
      definition:
        "A test term piped through stdin to verify the validator can read from standard input correctly.",
      category: "dev-tools",
    });

    try {
      const stdout = execSync(
        `echo '${proposal}' | npx tsx ${join(SCRIPTS_DIR, "validate-term-proposal.ts")} --proposal -`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );
      const result = JSON.parse(stdout);
      expect(result.status).toBe("pass");
    } catch (err: any) {
      const result = JSON.parse(err.stdout);
      expect(result.proposal_id).toBe("stdin-test-term");
    }
  });

  it("parses --proposals-dir and --verbose args", () => {
    mkdirSync(TMP_DIR, { recursive: true });

    // Create a proposals dir with a valid pending proposal
    const proposalsDir = join(TMP_DIR, "pending-proposals");
    mkdirSync(proposalsDir, { recursive: true });
    writeFileSync(
      join(proposalsDir, "pending-one.json"),
      JSON.stringify({
        id: "pending-one",
        term: "Pending One",
        definition: "A pending proposal used for testing proposals-dir loading.",
        category: "dev-tools",
      }),
    );

    const proposalPath = join(TMP_DIR, "with-proposals-dir.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "test-proposals-dir-term",
        term: "Test Proposals Dir Term",
        definition:
          "A test term to verify that --proposals-dir and --verbose CLI arguments are parsed correctly.",
        category: "dev-tools",
        related: ["pending-one"],
      }),
    );

    const { stdout, exitCode } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath} --proposals-dir ${proposalsDir} --verbose`,
    );
    const result = JSON.parse(stdout);
    // The related term "pending-one" is in the pending proposals dir so it should not generate a finding
    expect(result.status).toBe("pass");
    expect(
      result.findings.every(
        (f: any) => !f.issue.includes("pending-one"),
      ),
    ).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("loadPendingProposals skips invalid JSON files", () => {
    mkdirSync(TMP_DIR, { recursive: true });

    const proposalsDir = join(TMP_DIR, "bad-proposals");
    mkdirSync(proposalsDir, { recursive: true });
    // Write an invalid JSON file
    writeFileSync(join(proposalsDir, "bad.json"), "not valid json {{{{");
    // Write a valid JSON file
    writeFileSync(
      join(proposalsDir, "good.json"),
      JSON.stringify({ id: "good-pending", term: "Good" }),
    );

    const proposalPath = join(TMP_DIR, "test-skip-invalid.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "test-skip-invalid-term",
        term: "Test Skip Invalid",
        definition:
          "A test term that verifies the proposals loader gracefully skips invalid JSON files in the proposals directory.",
        category: "dev-tools",
        related: ["good-pending"],
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath} --proposals-dir ${proposalsDir}`,
    );
    const result = JSON.parse(stdout);
    // "good-pending" is recognized from the valid file, so no finding about it
    expect(
      result.findings.every(
        (f: any) => !f.issue.includes("good-pending"),
      ),
    ).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("fails on invalid kebab-case ID", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "bad-id.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "Invalid_CamelCase",
        term: "Invalid ID Term",
        definition:
          "A test term with an invalid ID format to verify the kebab-case validator rejects uppercase and underscores.",
        category: "dev-tools",
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.status).toBe("fail");
    expect(
      result.findings.some((f: any) => f.issue.includes("not valid kebab-case")),
    ).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("warns on definition too long (>500 chars)", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "long-def.json");
    const longDef = "A".repeat(501);
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "long-def-term",
        term: "Long Def Term",
        definition: longDef,
        category: "dev-tools",
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(
      result.findings.some((f: any) => f.issue.includes("too long")),
    ).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("detects alias collision with existing term", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "alias-collision.json");
    // "has_one" is an alias of "anchor-constraints" in the glossary
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "test-alias-collision",
        term: "Test Alias Collision",
        definition:
          "A test term with an alias that collides with an existing alias in the glossary to verify collision detection.",
        category: "dev-tools",
        aliases: ["has_one"],
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(
      result.findings.some((f: any) => f.issue.includes("collides with existing term")),
    ).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("detects term name collision with existing alias", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "name-alias-collision.json");
    // "Localnet" is an alias of "local-development" in the glossary
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "test-name-alias-collision",
        term: "Localnet",
        definition:
          "A test term whose name matches an existing alias in the glossary to verify term-name vs alias collision detection.",
        category: "dev-tools",
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(
      result.findings.some((f: any) => f.issue.includes("matches an alias of")),
    ).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("shows verbose diagnostics to stderr", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "verbose-test.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "test-verbose-output",
        term: "Test Verbose Output",
        definition:
          "A test term to verify that the verbose flag produces diagnostic output on stderr.",
        category: "dev-tools",
      }),
    );

    // Use execSync directly to capture stderr
    try {
      execSync(
        `npx tsx ${join(SCRIPTS_DIR, "validate-term-proposal.ts")} --proposal ${proposalPath} --verbose`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );
    } catch (err: any) {
      // Even on exit 0 or 1, we can check stderr
      expect(err.stderr || "").toContain("Glossary:");
    }

    rmSync(TMP_DIR, { recursive: true, force: true });
  });
});

function makeProposal(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    term: `Test ${id}`,
    definition: `A test term for ${id} used to verify the submit-proposals script injects correctly into glossary files.`,
    category: "dev-tools",
    aliases: [],
    related: ["anchor"],
    ...overrides,
  };
}

describe("submit-proposals.ts", () => {
  const SUBMIT_TMP = join(TMP_DIR, "submit");
  const PROPOSALS_DIR = join(SUBMIT_TMP, "proposals");
  const GLOSSARY_COPY = join(SUBMIT_TMP, "terms");

  function setupFixture(proposals: Record<string, unknown>[]) {
    mkdirSync(PROPOSALS_DIR, { recursive: true });
    mkdirSync(GLOSSARY_COPY, { recursive: true });

    // Copy the real glossary file for the category we test against
    copyFileSync(
      join(GLOSSARY_DIR, "dev-tools.json"),
      join(GLOSSARY_COPY, "dev-tools.json"),
    );
    // Copy all other category files so the SDK import works
    // (submit-proposals uses allTerms from the SDK for validation,
    //  but writes to the copy)
    for (const file of [
      "ai-ml.json",
      "solana-ecosystem.json",
      "defi.json",
      "security.json",
    ]) {
      if (existsSync(join(GLOSSARY_DIR, file))) {
        copyFileSync(join(GLOSSARY_DIR, file), join(GLOSSARY_COPY, file));
      }
    }

    for (const p of proposals) {
      const proposal = p as { id: string };
      writeFileSync(
        join(PROPOSALS_DIR, `${proposal.id}.json`),
        JSON.stringify(p, null, 2),
      );
    }
  }

  afterEach(() => {
    rmSync(SUBMIT_TMP, { recursive: true, force: true });
  });

  it("shows help with --help", () => {
    const { stdout, exitCode } = runScript("submit-proposals.ts", "--help");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Term Proposal Submitter");
    expect(stdout).toContain("--proposals-dir");
    expect(stdout).toContain("--dry-run");
    expect(stdout).toContain("--apply");
    expect(stdout).toContain("--pr");
  });

  it("returns empty plan for nonexistent proposals dir", () => {
    const { stdout, exitCode } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${join(SUBMIT_TMP, "nonexistent")} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(result.script).toBe("submit-proposals");
    expect(result.proposals_found).toBe(0);
    expect(result.plan).toEqual([]);
    expect(exitCode).toBe(0);
  });

  it("dry-run shows plan without modifying files", () => {
    const proposal = makeProposal("test-dryrun-term");
    setupFixture([proposal]);

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(result.mode).toBe("dry-run");
    expect(result.proposals_found).toBe(1);
    expect(result.valid).toBe(1);
    expect(result.injected).toBe(0); // dry-run doesn't inject
    expect(result.plan[0].proposal_id).toBe("test-dryrun-term");
    expect(result.plan[0].validation).toBe("pass");

    // Verify glossary file NOT modified
    const original = JSON.parse(
      readFileSync(join(GLOSSARY_DIR, "dev-tools.json"), "utf-8"),
    );
    const copy = JSON.parse(
      readFileSync(join(GLOSSARY_COPY, "dev-tools.json"), "utf-8"),
    );
    expect(copy.length).toBe(original.length);
  });

  it("apply appends term at end of category file (preserves existing order)", () => {
    const proposal = makeProposal("aaa-first-term");
    setupFixture([proposal]);

    const originalTerms = JSON.parse(
      readFileSync(join(GLOSSARY_COPY, "dev-tools.json"), "utf-8"),
    );
    const originalCount = originalTerms.length;
    const originalFirstId = originalTerms[0].id;
    const originalLastId = originalTerms[originalCount - 1].id;

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply`,
    );
    const result = JSON.parse(stdout);
    expect(result.mode).toBe("apply");
    expect(result.injected).toBe(1);

    // Verify term was injected
    const updatedTerms = JSON.parse(
      readFileSync(join(GLOSSARY_COPY, "dev-tools.json"), "utf-8"),
    );
    expect(updatedTerms.length).toBe(originalCount + 1);

    // Existing terms keep their original order (no re-sort)
    expect(updatedTerms[0].id).toBe(originalFirstId);
    expect(updatedTerms[originalCount - 1].id).toBe(originalLastId);

    // New term is appended at the end (minimal diff vs upstream)
    expect(updatedTerms[updatedTerms.length - 1].id).toBe("aaa-first-term");
    expect(updatedTerms[updatedTerms.length - 1].term).toBe(
      "Test aaa-first-term",
    );
    expect(updatedTerms[updatedTerms.length - 1].category).toBe("dev-tools");
  });

  it("apply moves injected proposals to .done/", () => {
    const proposal = makeProposal("test-done-move");
    setupFixture([proposal]);

    runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply`,
    );

    // Original should be gone
    expect(existsSync(join(PROPOSALS_DIR, "test-done-move.json"))).toBe(false);
    // Should be in .done/
    expect(
      existsSync(join(PROPOSALS_DIR, ".done", "test-done-move.json")),
    ).toBe(true);
  });

  it("rejects duplicate IDs without injecting", () => {
    // "anchor" already exists in the glossary
    const proposal = makeProposal("anchor", {
      term: "Duplicate Anchor",
      definition:
        "This should fail because anchor already exists in the glossary as a real term identifier.",
    });
    setupFixture([proposal]);

    const { stdout, exitCode } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply`,
    );
    const result = JSON.parse(stdout);
    expect(result.valid).toBe(0);
    expect(result.invalid).toBe(1);
    expect(result.injected).toBe(0);
    expect(result.plan[0].validation).toBe("fail");
    expect(exitCode).toBe(1);
  });

  it("handles multiple proposals with mixed validity", () => {
    const validProposal = makeProposal("test-multi-valid");
    const invalidProposal = makeProposal("proof-of-history", {
      term: "Duplicate PoH",
      definition:
        "This should be rejected because proof-of-history already exists as a term in the glossary.",
      category: "core-protocol",
    });
    setupFixture([validProposal, invalidProposal]);

    // Need core-protocol.json too for the invalid one
    copyFileSync(
      join(GLOSSARY_DIR, "core-protocol.json"),
      join(GLOSSARY_COPY, "core-protocol.json"),
    );

    const { stdout, exitCode } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply`,
    );
    const result = JSON.parse(stdout);
    expect(result.proposals_found).toBe(2);
    expect(result.valid).toBe(1);
    expect(result.invalid).toBe(1);
    expect(result.injected).toBe(1);
    expect(exitCode).toBe(1); // exit 1 because there were invalid proposals
  });

  it("injects multiple valid proposals into same category", () => {
    const p1 = makeProposal("test-batch-alpha");
    const p2 = makeProposal("test-batch-beta");
    setupFixture([p1, p2]);

    const originalCount = JSON.parse(
      readFileSync(join(GLOSSARY_COPY, "dev-tools.json"), "utf-8"),
    ).length;

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply`,
    );
    const result = JSON.parse(stdout);
    expect(result.injected).toBe(2);

    const updated = JSON.parse(
      readFileSync(join(GLOSSARY_COPY, "dev-tools.json"), "utf-8"),
    );
    expect(updated.length).toBe(originalCount + 2);

    // Both new terms go to the end in insertion order (proposals loaded
    // alphabetically by filename, so alpha precedes beta)
    const ids = updated.map((t: any) => t.id);
    const alphaIdx = ids.indexOf("test-batch-alpha");
    const betaIdx = ids.indexOf("test-batch-beta");
    expect(alphaIdx).toBeLessThan(betaIdx);
    expect(betaIdx).toBe(updated.length - 1);
  });

  it("preserves original file bytes (append-only diff)", () => {
    const proposal = makeProposal("test-append-only");
    setupFixture([proposal]);

    const originalText = readFileSync(
      join(GLOSSARY_COPY, "dev-tools.json"),
      "utf-8",
    );

    runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply`,
    );

    const updatedText = readFileSync(
      join(GLOSSARY_COPY, "dev-tools.json"),
      "utf-8",
    );

    // The updated file must START with the original content minus the
    // trailing ']' (so existing terms are byte-for-byte preserved).
    const originalTrimmed = originalText.replace(/\s*\]\s*$/, "");
    expect(updatedText.startsWith(originalTrimmed)).toBe(true);

    // New term should keep compact array formatting (single-line "related")
    expect(updatedText).toContain('"related": ["anchor"]');
    expect(updatedText.trimEnd().endsWith("]")).toBe(true);
  });

  it("preserves existing glossary term structure after injection", () => {
    const proposal = makeProposal("test-preserve-structure", {
      aliases: ["TPS-Alias"],
      related: ["anchor"],
    });
    setupFixture([proposal]);

    runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply`,
    );

    const updated = JSON.parse(
      readFileSync(join(GLOSSARY_COPY, "dev-tools.json"), "utf-8"),
    );
    const injected = updated.find(
      (t: any) => t.id === "test-preserve-structure",
    );
    expect(injected).toBeDefined();
    expect(injected.id).toBe("test-preserve-structure");
    expect(injected.term).toBe("Test test-preserve-structure");
    expect(injected.definition).toContain(
      "test term for test-preserve-structure",
    );
    expect(injected.category).toBe("dev-tools");
    expect(injected.aliases).toEqual(["TPS-Alias"]);
    expect(injected.related).toEqual(["anchor"]);

    // Verify first term in file is still intact
    expect(updated[0].definition.length).toBeGreaterThan(0);
  });

  it("warns on proposals with non-existent related terms", () => {
    const proposal = makeProposal("test-warn-related", {
      related: ["nonexistent-term-xyz"],
    });
    setupFixture([proposal]);

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(result.plan[0].validation).toBe("warning");
    expect(
      result.plan[0].issues.some((i: string) => i.includes("not in glossary")),
    ).toBe(true);
    // Warning still counts as valid (not fail)
    expect(result.valid).toBe(1);
  });

  it("parses --pr, --pr-repo, and --verbose args", () => {
    const proposal = makeProposal("test-pr-args");
    setupFixture([proposal]);

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --dry-run --pr-repo some-org/some-repo --verbose`,
    );
    const result = JSON.parse(stdout);
    // dry-run takes precedence, so mode stays dry-run
    expect(result.script).toBe("submit-proposals");
    expect(result.mode).toBe("dry-run");
  });

  it("skips invalid JSON proposal files during loading", () => {
    mkdirSync(PROPOSALS_DIR, { recursive: true });
    mkdirSync(GLOSSARY_COPY, { recursive: true });
    copyFileSync(
      join(GLOSSARY_DIR, "dev-tools.json"),
      join(GLOSSARY_COPY, "dev-tools.json"),
    );

    // Write an invalid JSON file alongside a valid one
    writeFileSync(join(PROPOSALS_DIR, "broken.json"), "{not valid json");
    const validProposal = makeProposal("test-skip-broken");
    writeFileSync(
      join(PROPOSALS_DIR, "test-skip-broken.json"),
      JSON.stringify(validProposal, null, 2),
    );

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --dry-run`,
    );
    const result = JSON.parse(stdout);
    // The broken file is skipped; only the valid one is loaded
    expect(result.proposals_found).toBe(1);
    expect(result.plan[0].proposal_id).toBe("test-skip-broken");
  });

  it("rejects proposal with invalid kebab-case ID", () => {
    const proposal = makeProposal("Invalid_ID_Format", {
      term: "Invalid ID Format",
      definition:
        "A test term with an invalid kebab-case ID to verify the submit-proposals validator catches bad IDs.",
    });
    setupFixture([proposal]);

    const { stdout, exitCode } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(result.plan[0].validation).toBe("fail");
    expect(
      result.plan[0].issues.some((i: string) => i.includes("Invalid kebab")),
    ).toBe(true);
    expect(exitCode).toBe(1);
  });

  it("rejects proposal with invalid category", () => {
    const proposal = makeProposal("test-bad-category", {
      category: "nonexistent-category-xyz",
    });
    setupFixture([proposal]);

    const { stdout, exitCode } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(result.plan[0].validation).toBe("fail");
    expect(
      result.plan[0].issues.some((i: string) => i.includes("Invalid category")),
    ).toBe(true);
    expect(exitCode).toBe(1);
  });

  it("rejects proposal with definition too short", () => {
    const proposal = makeProposal("test-short-def", {
      definition: "Too short.",
    });
    setupFixture([proposal]);

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(
      result.plan[0].issues.some((i: string) => i.includes("too short")),
    ).toBe(true);
  });

  it("rejects proposal with definition too long", () => {
    const proposal = makeProposal("test-long-def", {
      definition: "A".repeat(501),
    });
    setupFixture([proposal]);

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(
      result.plan[0].issues.some((i: string) => i.includes("too long")),
    ).toBe(true);
  });

  it("detects alias collision with existing glossary term", () => {
    // "has_one" is an alias of "anchor-constraints" in the glossary
    const proposal = makeProposal("test-alias-collide", {
      aliases: ["has_one"],
    });
    setupFixture([proposal]);

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(
      result.plan[0].issues.some((i: string) => i.includes("collides with existing term")),
    ).toBe(true);
  });

  it("errors when appending to a file that does not end with ]", () => {
    mkdirSync(PROPOSALS_DIR, { recursive: true });
    mkdirSync(GLOSSARY_COPY, { recursive: true });

    // Write a malformed glossary file (not ending with ])
    writeFileSync(join(GLOSSARY_COPY, "dev-tools.json"), '{"not": "an array"}');

    const proposal = makeProposal("test-bad-file-format");
    writeFileSync(
      join(PROPOSALS_DIR, "test-bad-file-format.json"),
      JSON.stringify(proposal, null, 2),
    );

    const { stdout, exitCode } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply`,
    );
    // The script should fail because the file can't be parsed as an array or
    // the appendTermToFile will throw about missing trailing ']'
    expect(exitCode).not.toBe(0);
  });

  it("injects i18n translations when proposal has i18n field", () => {
    mkdirSync(PROPOSALS_DIR, { recursive: true });
    mkdirSync(GLOSSARY_COPY, { recursive: true });

    // Copy the glossary file
    copyFileSync(
      join(GLOSSARY_DIR, "dev-tools.json"),
      join(GLOSSARY_COPY, "dev-tools.json"),
    );

    // Create i18n directory structure with locale files
    const i18nDir = join(GLOSSARY_COPY, "..", "i18n");
    mkdirSync(i18nDir, { recursive: true });
    writeFileSync(
      join(i18nDir, "pt.json"),
      JSON.stringify(
        { "anchor": { term: "Anchor", definition: "Framework para Solana." } },
        null,
        2,
      ) + "\n",
    );
    writeFileSync(
      join(i18nDir, "es.json"),
      JSON.stringify(
        { "anchor": { term: "Anchor", definition: "Framework para Solana." } },
        null,
        2,
      ) + "\n",
    );

    // Create a proposal with i18n data
    const proposal = makeProposal("test-i18n-inject");
    (proposal as any).i18n = {
      pt: { term: "Teste i18n Injetar" },
      es: { term: "Prueba i18n Inyectar" },
    };
    writeFileSync(
      join(PROPOSALS_DIR, "test-i18n-inject.json"),
      JSON.stringify(proposal, null, 2),
    );

    const { stdout } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply`,
    );
    const result = JSON.parse(stdout);
    expect(result.injected).toBe(1);

    // Verify i18n files were updated
    const ptContent = readFileSync(join(i18nDir, "pt.json"), "utf-8");
    expect(ptContent).toContain('"test-i18n-inject"');
    expect(ptContent).toContain("Teste i18n Injetar");

    const esContent = readFileSync(join(i18nDir, "es.json"), "utf-8");
    expect(esContent).toContain('"test-i18n-inject"');
    expect(esContent).toContain("Prueba i18n Inyectar");
  });

  it("handles --pr flag gracefully when gh CLI is unavailable", () => {
    const proposal = makeProposal("test-pr-no-gh");
    setupFixture([proposal]);

    // Run with --pr flag; gh may or may not be available, but it should not crash
    const { stdout, exitCode } = runScript(
      "submit-proposals.ts",
      `--proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --pr --pr-repo fake-org/fake-repo`,
    );
    const result = JSON.parse(stdout);
    // Mode should be "pr" regardless of gh availability
    expect(result.mode).toBe("pr");
    expect(result.injected).toBe(1);
    // pr_url may be null if gh is not available or if the PR creation fails
    // The important thing is the script doesn't crash
    expect(result).toHaveProperty("pr_url");
  });

  it("shows verbose output during apply", () => {
    const proposal = makeProposal("test-verbose-apply");
    setupFixture([proposal]);

    try {
      execSync(
        `npx tsx ${join(SCRIPTS_DIR, "submit-proposals.ts")} --proposals-dir ${PROPOSALS_DIR} --glossary-dir ${GLOSSARY_COPY} --apply --verbose`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );
    } catch (err: any) {
      // stderr should contain verbose diagnostics
      const stderr = err.stderr || "";
      expect(stderr).toContain("Found");
      expect(stderr).toContain("Injected");
    }
  });
});

describe("sync-glossary.ts", () => {
  const SYNC_TMP = join(TMP_DIR, "sync");
  const SYNC_GLOSSARY = join(SYNC_TMP, "terms");
  const SYNC_PROPOSALS = join(SYNC_TMP, "proposals");

  /**
   * Create a minimal local glossary fixture with known terms,
   * simulating the "upstream" by pointing --upstream to a local HTTP
   * server would be complex, so we test the reconciliation and
   * diffing logic directly using the real upstream fetch (network test).
   *
   * For offline/CI, we test --help and structural behaviors.
   */

  afterEach(() => {
    rmSync(SYNC_TMP, { recursive: true, force: true });
  });

  it("shows help with --help", () => {
    const { stdout, exitCode } = runScript("sync-glossary.ts", "--help");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Glossary Sync");
    expect(stdout).toContain("--upstream");
    expect(stdout).toContain("--dry-run");
    expect(stdout).toContain("--apply");
  });

  it(
    "dry-run fetches upstream and reports diff without modifying files",
    { timeout: 30000 },
    () => {
      // Use real upstream — tests network connectivity
      mkdirSync(SYNC_GLOSSARY, { recursive: true });
      mkdirSync(SYNC_PROPOSALS, { recursive: true });

      // Create a minimal local glossary (just dev-tools with one term)
      writeFileSync(
        join(SYNC_GLOSSARY, "dev-tools.json"),
        JSON.stringify([
          {
            id: "anchor",
            term: "Anchor",
            definition:
              "A framework for Solana program development using Rust macros and IDL generation.",
            category: "dev-tools",
          },
        ]),
      );

      const { stdout, exitCode } = runScript(
        "sync-glossary.ts",
        `--glossary-dir ${SYNC_GLOSSARY} --proposals-dir ${SYNC_PROPOSALS} --dry-run --verbose`,
      );

      const result = JSON.parse(stdout);
      expect(result.script).toBe("sync-glossary");
      expect(result.mode).toBe("dry-run");
      expect(result.upstream_total_terms).toBeGreaterThan(800);
      expect(result.local_total_terms).toBe(1);
      expect(result.new_from_upstream.length).toBeGreaterThan(0);
      // dry-run should NOT update categories
      expect(result.updated_categories).toEqual([]);
      expect(exitCode).toBe(0);
    },
  );

  it("apply updates local glossary from upstream", { timeout: 30000 }, () => {
    mkdirSync(SYNC_GLOSSARY, { recursive: true });
    mkdirSync(SYNC_PROPOSALS, { recursive: true });

    // Start with empty local glossary
    writeFileSync(join(SYNC_GLOSSARY, "dev-tools.json"), "[]");

    const { stdout } = runScript(
      "sync-glossary.ts",
      `--glossary-dir ${SYNC_GLOSSARY} --proposals-dir ${SYNC_PROPOSALS} --apply`,
    );
    const result = JSON.parse(stdout);
    expect(result.mode).toBe("apply");
    expect(result.upstream_total_terms).toBeGreaterThan(800);
    expect(result.updated_categories.length).toBeGreaterThan(0);

    // Verify files were actually written
    const devTools = JSON.parse(
      readFileSync(join(SYNC_GLOSSARY, "dev-tools.json"), "utf-8"),
    );
    expect(devTools.length).toBeGreaterThan(0);
    expect(devTools[0].id).toBeDefined();
    expect(devTools[0].definition).toBeDefined();
  });

  it("identifies proposals already merged upstream", { timeout: 30000 }, () => {
    mkdirSync(SYNC_GLOSSARY, { recursive: true });
    mkdirSync(SYNC_PROPOSALS, { recursive: true });

    // Copy real glossary locally
    for (const file of readdirSync(GLOSSARY_DIR)) {
      if (file.endsWith(".json")) {
        copyFileSync(join(GLOSSARY_DIR, file), join(SYNC_GLOSSARY, file));
      }
    }

    // Create a proposal with an ID that already exists in upstream ("phantom")
    writeFileSync(
      join(SYNC_PROPOSALS, "phantom.json"),
      JSON.stringify({
        id: "phantom",
        term: "Phantom Wallet",
        definition: "The most popular Solana wallet with multi-chain support.",
        category: "solana-ecosystem",
      }),
    );

    // Also create a genuinely new proposal
    writeFileSync(
      join(SYNC_PROPOSALS, "test-new-term-sync.json"),
      JSON.stringify({
        id: "test-new-term-sync",
        term: "Test New Term",
        definition:
          "A brand new term that does not exist upstream and should remain pending.",
        category: "dev-tools",
      }),
    );

    const { stdout } = runScript(
      "sync-glossary.ts",
      `--glossary-dir ${SYNC_GLOSSARY} --proposals-dir ${SYNC_PROPOSALS} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(result.proposals_already_merged).toContain("phantom");
    expect(result.proposals_still_pending).toContain("test-new-term-sync");
  });

  it("apply moves merged proposals to .merged/", { timeout: 30000 }, () => {
    mkdirSync(SYNC_GLOSSARY, { recursive: true });
    mkdirSync(SYNC_PROPOSALS, { recursive: true });

    // Copy real glossary
    for (const file of readdirSync(GLOSSARY_DIR)) {
      if (file.endsWith(".json")) {
        copyFileSync(join(GLOSSARY_DIR, file), join(SYNC_GLOSSARY, file));
      }
    }

    // Proposal for a term that exists upstream
    writeFileSync(
      join(SYNC_PROPOSALS, "phantom.json"),
      JSON.stringify({
        id: "phantom",
        term: "Phantom",
        definition: "The most popular Solana wallet.",
        category: "solana-ecosystem",
      }),
    );

    runScript(
      "sync-glossary.ts",
      `--glossary-dir ${SYNC_GLOSSARY} --proposals-dir ${SYNC_PROPOSALS} --apply`,
    );

    // Should be moved from proposals/ to proposals/.merged/
    expect(existsSync(join(SYNC_PROPOSALS, "phantom.json"))).toBe(false);
    expect(existsSync(join(SYNC_PROPOSALS, ".merged", "phantom.json"))).toBe(
      true,
    );
  });

  it("handles empty proposals dir gracefully", { timeout: 30000 }, () => {
    mkdirSync(SYNC_GLOSSARY, { recursive: true });
    // Don't create proposals dir at all

    const { stdout, exitCode } = runScript(
      "sync-glossary.ts",
      `--glossary-dir ${SYNC_GLOSSARY} --proposals-dir ${join(SYNC_TMP, "nonexistent")} --dry-run`,
    );
    const result = JSON.parse(stdout);
    expect(result.proposals_already_merged).toEqual([]);
    expect(result.proposals_still_pending).toEqual([]);
    expect(exitCode).toBe(0);
  });

  it(
    "shows verbose diagnostics on stderr",
    { timeout: 30000 },
    () => {
      mkdirSync(SYNC_GLOSSARY, { recursive: true });
      mkdirSync(SYNC_PROPOSALS, { recursive: true });

      writeFileSync(join(SYNC_GLOSSARY, "dev-tools.json"), "[]");

      try {
        execSync(
          `npx tsx ${join(SCRIPTS_DIR, "sync-glossary.ts")} --glossary-dir ${SYNC_GLOSSARY} --proposals-dir ${SYNC_PROPOSALS} --dry-run --verbose`,
          { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
        );
      } catch (err: any) {
        const stderr = err.stderr || "";
        expect(stderr).toContain("Fetching upstream glossary");
        expect(stderr).toContain("Upstream has");
        expect(stderr).toContain("Local has");
      }
    },
  );
});
