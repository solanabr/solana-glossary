import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

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

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const env = {};

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

function frameMessage(message) {
  const json = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;
}

function summarizeContent(text) {
  try {
    const parsed = JSON.parse(text);
    const keys = Object.keys(parsed);
    return keys.join(", ");
  } catch {
    return text.slice(0, 120);
  }
}

class McpHarness {
  constructor(child) {
    this.child = child;
    this.buffer = "";
    this.expectedLength = null;
    this.pending = new Map();

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => this.handleStdout(chunk));
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
    child.on("exit", (code, signal) => {
      for (const { reject } of this.pending.values()) {
        reject(new Error(`MCP server exited before replying (code=${code}, signal=${signal})`));
      }
      this.pending.clear();
    });
  }

  handleStdout(chunk) {
    this.buffer += chunk;

    while (true) {
      if (this.expectedLength === null) {
        const headerEnd = this.buffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) return;

        const header = this.buffer.slice(0, headerEnd);
        const match = header.match(/Content-Length:\s*(\d+)/i);
        if (!match) {
          this.buffer = "";
          return;
        }

        this.expectedLength = Number.parseInt(match[1], 10);
        this.buffer = this.buffer.slice(headerEnd + 4);
      }

      if (this.expectedLength === null || this.buffer.length < this.expectedLength) return;

      const body = this.buffer.slice(0, this.expectedLength);
      this.buffer = this.buffer.slice(this.expectedLength);
      this.expectedLength = null;

      let message;
      try {
        message = JSON.parse(body);
      } catch (error) {
        continue;
      }

      const pending = this.pending.get(message.id);
      if (!pending) continue;
      this.pending.delete(message.id);

      if (message.error) {
        pending.reject(
          new Error(`${message.error.message}${message.error.data ? ` | ${JSON.stringify(message.error.data)}` : ""}`),
        );
        continue;
      }

      pending.resolve(message.result);
    }
  }

  request(message) {
    return new Promise((resolve, reject) => {
      this.pending.set(message.id, { resolve, reject });
      this.child.stdin.write(frameMessage(message));
    });
  }
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

const child = spawn("node", [serverEntry], {
  cwd: packageDir,
  env,
  stdio: ["pipe", "pipe", "pipe"],
});

const harness = new McpHarness(child);

const requests = [
  {
    label: "glossary_explain_code",
    name: "glossary_explain_code",
    arguments: {
      code: "#[derive(Accounts)]\npub struct CreateVault<'info> {\n  #[account(init, payer = signer, seeds=[b\"vault\", signer.key().as_ref()], bump, space = 8 + 32)]\n  pub vault: Account<'info, Vault>,\n  #[account(mut)]\n  pub signer: Signer<'info>,\n  pub system_program: Program<'info, System>\n}",
      locale: "en",
      additionalContext: "Explain how the PDA and signer fit together.",
    },
  },
  {
    label: "glossary_debug_error",
    name: "glossary_debug_error",
    arguments: {
      error:
        "AnchorError caused by account: vault. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.",
      code: "let (vault, bump) = Pubkey::find_program_address(&[b\"vault\", authority.key().as_ref()], program_id);",
      locale: "en",
    },
  },
  {
    label: "glossary_generate_code",
    name: "glossary_generate_code",
    arguments: {
      request: "Create a PDA with Anchor for a user profile account",
      locale: "en",
    },
  },
  {
    label: "glossary_plan_learning",
    name: "glossary_plan_learning",
    arguments: {
      goal: "I want to build a DeFi app on Solana with swaps and liquidity pools",
      currentLevel: "intermediate",
      locale: "en",
    },
  },
];

async function main() {
  try {
    await harness.request({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {},
    });

    console.log("Initialized MCP server");

    let nextId = 10;
    for (const request of requests) {
      const result = await harness.request({
        jsonrpc: "2.0",
        id: nextId,
        method: "tools/call",
        params: {
          name: request.name,
          arguments: request.arguments,
        },
      });
      nextId += 1;

      const contentText = result?.content?.[0]?.text ?? "";
      console.log(`\n[PASS] ${request.label}`);
      console.log(`Keys: ${summarizeContent(contentText)}`);
      console.log(`Preview: ${contentText.slice(0, 220).replace(/\s+/g, " ")}...`);
    }
  } catch (error) {
    console.error(`\n[FAIL] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    child.kill("SIGTERM");
  }
}

main();
