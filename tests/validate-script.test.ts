import { describe, it, expect, afterEach } from "vitest";
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const TMP_DIR = join("tests", ".tmp-validate");

function runValidate(
  termsDir?: string,
): { stdout: string; stderr: string; exitCode: number } {
  const cmd = termsDir
    ? `node scripts/validate.js ${termsDir}`
    : "node scripts/validate.js";
  try {
    const stdout = execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
      exitCode: err.status ?? 1,
    };
  }
}

describe("scripts/validate.js", () => {
  afterEach(() => {
    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("validates all real terms successfully", () => {
    const { stdout, exitCode } = runValidate();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("terms valid");
  });

  it("detects duplicate IDs", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(
      join(TMP_DIR, "test.json"),
      JSON.stringify([
        { id: "dup", term: "Dup", definition: "First", category: "dev-tools" },
        {
          id: "dup",
          term: "Dup2",
          definition: "Second",
          category: "dev-tools",
        },
      ]),
    );
    const { stderr, exitCode } = runValidate(TMP_DIR);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Duplicate ID: "dup"');
  });

  it("detects dangling related refs", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(
      join(TMP_DIR, "test.json"),
      JSON.stringify([
        {
          id: "a",
          term: "A",
          definition: "A def",
          category: "dev-tools",
          related: ["nonexistent"],
        },
      ]),
    );
    const { stderr, exitCode } = runValidate(TMP_DIR);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Dangling ref: "a" -> "nonexistent"');
  });

  it("detects missing required fields", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(
      join(TMP_DIR, "test.json"),
      JSON.stringify([
        { id: "missing", term: "", definition: "", category: "" },
      ]),
    );
    const { stderr, exitCode } = runValidate(TMP_DIR);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Missing required field");
  });

  it("detects empty aliases arrays", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(
      join(TMP_DIR, "test.json"),
      JSON.stringify([
        {
          id: "empty-alias",
          term: "EA",
          definition: "Test",
          category: "dev-tools",
          aliases: [],
        },
      ]),
    );
    const { stderr, exitCode } = runValidate(TMP_DIR);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Empty aliases array in: "empty-alias"');
  });
});
