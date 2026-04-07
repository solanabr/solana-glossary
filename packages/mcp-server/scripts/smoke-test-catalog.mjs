import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageDir = resolve(__dirname, "..");
const serverEntry = resolve(packageDir, "dist/index.js");

if (!existsSync(serverEntry)) {
  console.error("Missing dist/index.js. Run `npm run build:mcp` from the repo root first.");
  process.exit(1);
}

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function runRequest(message, env) {
  const json = JSON.stringify(message);
  const framed = `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;

  const result = spawnSync("node", [serverEntry], {
    cwd: packageDir,
    env,
    input: framed,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || `MCP server exited with code ${result.status}`);
  }

  const stdout = result.stdout.trim();
  const headerEnd = stdout.indexOf("\r\n\r\n");
  const body = headerEnd === -1 ? stdout : stdout.slice(headerEnd + 4);
  const parsed = JSON.parse(body);
  if (parsed.error) {
    throw new Error(parsed.error.message);
  }
  return parsed.result;
}

function previewResult(value) {
  return JSON.stringify(value).slice(0, 240).replace(/\s+/g, " ");
}

const env = {
  ...process.env,
  ...loadEnvFile(resolve(packageDir, ".env")),
  ...loadEnvFile(resolve(packageDir, ".env.local")),
};

if (!env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not found in packages/mcp-server/.env.local or environment.");
  process.exit(1);
}

try {
  runRequest({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }, env);
  console.log("Initialized MCP server");

  const resourceList = runRequest(
    { jsonrpc: "2.0", id: 2, method: "resources/list", params: {} },
    env,
  );
  console.log("\n[PASS] resources/list");
  console.log(`Preview: ${previewResult(resourceList)}`);

  const termResource = runRequest(
    {
      jsonrpc: "2.0",
      id: 3,
      method: "resources/read",
      params: { uri: "glossary://term/pda?locale=en" },
    },
    env,
  );
  console.log("\n[PASS] resources/read term");
  console.log(`Preview: ${previewResult(termResource)}`);

  const contextResource = runRequest(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "resources/read",
      params: { uri: "glossary://context/pda,signer?locale=en&maxRelated=4" },
    },
    env,
  );
  console.log("\n[PASS] resources/read context");
  console.log(`Preview: ${previewResult(contextResource)}`);

  const buildFeature = runRequest(
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "glossary_build_feature",
        arguments: {
          goal: "Build a Solana user profile feature with an Anchor PDA account",
          currentLevel: "intermediate",
          locale: "en",
        },
      },
    },
    env,
  );

  const contentText = buildFeature?.content?.[0]?.text ?? "";
  console.log("\n[PASS] glossary_build_feature");
  console.log(`Keys: ${Object.keys(JSON.parse(contentText)).join(", ")}`);
  console.log(`Preview: ${contentText.slice(0, 240).replace(/\s+/g, " ")}...`);
} catch (error) {
  console.error(`\n[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
