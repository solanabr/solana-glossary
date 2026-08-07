import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

// Contract §0.1: no server secret ever reaches the browser. Vite only bundles
// files under src/, and only inlines `import.meta.env.VITE_*`. If the client
// source never even names a server-only secret, the built bundle cannot leak
// one. (The public VITE_TURNSTILE_SITE_KEY is intentionally not on this list.)
const SERVER_ONLY_SECRETS = [
  "GEMINI_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "TURNSTILE_SECRET_KEY",
  "SESSION_HMAC_SECRET",
  "EDGE_CONFIG",
];

// Resolve the client src dir from the vitest cwd (apps/web). The existsSync
// guard below skips cleanly if it's ever run from elsewhere.
const SRC_DIR = resolve(process.cwd(), "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx|css|html)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("no server secret leaks into the client bundle", () => {
  it("client src never references a server-only secret name", () => {
    if (!existsSync(SRC_DIR)) return; // client not present in this checkout
    const offenders: string[] = [];
    for (const file of walk(SRC_DIR)) {
      const content = readFileSync(file, "utf8");
      for (const secret of SERVER_ONLY_SECRETS) {
        if (content.includes(secret)) offenders.push(`${file} → ${secret}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
