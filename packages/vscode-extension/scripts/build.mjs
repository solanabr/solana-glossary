import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const distDir = resolve(packageRoot, "dist");

rmSync(distDir, { recursive: true, force: true });

const tsc = spawnSync("npx", ["tsc", "-p", "tsconfig.json"], {
  cwd: packageRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (tsc.status !== 0) {
  process.exit(tsc.status ?? 1);
}

for (const directory of ["data", "media"]) {
  const from = resolve(packageRoot, directory);
  const to = resolve(distDir, directory);

  if (!existsSync(from)) {
    continue;
  }

  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}
