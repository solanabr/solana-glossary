import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Regression guard for the i18n bug class (localization lost in the PUBLISHED
// package). Unlike the other suites — which import from `src/` where
// `../data/i18n` always resolves — this asserts against the BUILT `dist`
// output, so a build that stops inlining the locale JSON is caught here.
//
// The assertions run via scripts/verify-i18n-dist.mjs in a separate plain-Node
// process. That is deliberate: it loads the artifacts exactly as a downstream
// consumer would (native ESM import + require), without vitest/vite
// transforming the 1MB+ bundled chunk in the loader path.

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const verifyScript = join(pkgRoot, "scripts", "verify-i18n-dist.mjs");
const builtEsm = join(pkgRoot, "dist", "src", "i18n.mjs");

describe("i18n localization from built output", () => {
  beforeAll(() => {
    // CI builds before `npm test`; for a standalone local `vitest run`, build
    // if the artifact is missing so the guard has real dist output to load.
    if (!existsSync(builtEsm)) {
      execFileSync("npm", ["run", "build"], { cwd: pkgRoot, stdio: "inherit" });
    }
  }, 120_000);

  it("pt & es localize from the built ESM and CJS artifacts", () => {
    let output = "";
    try {
      output = execFileSync(process.execPath, [verifyScript], {
        cwd: pkgRoot,
        encoding: "utf8",
      });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      throw new Error(
        `verify-i18n-dist.mjs failed:\n${e.stdout ?? ""}${e.stderr ?? ""}`,
      );
    }
    expect(output).toContain("OK");
  });
});
