#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
  aliases?: string[];
}

interface LocalizedEntry {
  term: string;
  definition: string;
}

// ─── Load Data from local JSON files ─────────────────────────────────────────

const TERMS_DIR = path.resolve(__dirname, "../../../data/terms");
const I18N_DIR = path.resolve(__dirname, "../../../data/i18n");

const CATEGORY_FILES = [
  "ai-ml", "blockchain-general", "core-protocol", "defi", "dev-tools",
  "infrastructure", "network", "programming-fundamentals", "programming-model",
  "security", "solana-ecosystem", "token-ecosystem", "web3", "zk-compression",
];

function loadAllTerms(): GlossaryTerm[] {
  const all: GlossaryTerm[] = [];
  for (const cat of CATEGORY_FILES) {
    const filePath = path.join(TERMS_DIR, `${cat}.json`);
    if (fs.existsSync(filePath)) {
      const terms: GlossaryTerm[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      all.push(...terms);
    }
  }
  return all;
}

function loadI18n(locale: string): Record<string, LocalizedEntry> {
  const filePath = path.join(I18N_DIR, `${locale}.json`);
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return {};
}

const allTerms: GlossaryTerm[] = loadAllTerms();
const termById = new Map<string, GlossaryTerm>();
const termByAlias = new Map<string, GlossaryTerm>();

for (const t of allTerms) {
  termById.set(t.id, t);
  for (const alias of t.aliases ?? []) termByAlias.set(alias.toLowerCase(), t);
}

function getTerm(idOrAlias: string): GlossaryTerm | undefined {
  return termById.get(idOrAlias) ?? termByAlias.get(idOrAlias.toLowerCase());
}

function searchTerms(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return allTerms.filter(
    (t) => t.id.includes(q) || t.term.toLowerCase().includes(q) ||
           t.definition.toLowerCase().includes(q) || t.aliases?.some((a) => a.toLowerCase().includes(q))
  );
}

function getTermsByCategory(category: string): GlossaryTerm[] {
  return allTerms.filter((t) => t.category === category);
}

function getCategories(): string[] { return CATEGORY_FILES; }

function applyLocale(term: GlossaryTerm, locale: string): GlossaryTerm {
  if (locale === "en") return term;
  const override = loadI18n(locale)[term.id];
  return override ? { ...term, term: override.term, definition: override.definition } : term;
}

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: "get_term",
    description:
      "Look up a specific Solana term by its ID or alias. Returns the full definition, category, related terms, and aliases. Use this when you need precise info about a known term.",
    inputSchema: {
      type: "object",
      properties: {
        term: {
          type: "string",
          description:
            "The term ID (e.g. 'proof-of-history') or alias (e.g. 'PoH', 'PDA'). Case-insensitive for aliases.",
        },
        locale: {
          type: "string",
          enum: ["en", "pt", "es"],
          description: "Language for the response. Defaults to English ('en').",
        },
      },
      required: ["term"],
    },
  },
  {
    name: "search_terms",
    description:
      "Full-text search across all 1001 Solana terms — names, definitions, IDs, and aliases. Use this when you're not sure of the exact term ID, or want to explore related concepts.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query string. E.g. 'proof of history', 'AMM', 'account model'.",
        },
        limit: {
          type: "number",
          description: "Max number of results to return. Defaults to 5.",
        },
        locale: {
          type: "string",
          enum: ["en", "pt", "es"],
          description: "Language for the results. Defaults to English ('en').",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_terms_by_category",
    description:
      "Get all terms within a specific Solana category. Useful for building context around a topic — e.g. feed all 'defi' terms to an LLM to save tokens re-explaining basics.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Category identifier. Use list_categories to see all available ones.",
        },
        locale: {
          type: "string",
          enum: ["en", "pt", "es"],
          description: "Language for the results. Defaults to English ('en').",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "list_categories",
    description:
      "List all 14 available Solana glossary categories with their term counts and descriptions. Use this to discover what topics are covered.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_related_terms",
    description:
      "Get all terms related to a given term, following cross-references. Useful for exploring concept graphs — e.g. what is connected to 'PDA'?",
    inputSchema: {
      type: "object",
      properties: {
        term: {
          type: "string",
          description: "Term ID or alias to find related terms for.",
        },
        depth: {
          type: "number",
          description:
            "How many levels of cross-references to follow. 1 = direct references only (default). Max 2.",
        },
        locale: {
          type: "string",
          enum: ["en", "pt", "es"],
          description: "Language for the results. Defaults to English ('en').",
        },
      },
      required: ["term"],
    },
  },
  {
    name: "get_context_for_llm",
    description:
      "Generate a compact context block of Solana terms for injecting into an LLM prompt. Saves tokens by giving the model glossary context upfront. You can filter by category or provide specific term IDs.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Optional. Filter context to a specific category (e.g. 'defi', 'core-protocol').",
        },
        term_ids: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional. Specific term IDs to include. If omitted with no category, returns a curated set of foundational terms.",
        },
        locale: {
          type: "string",
          enum: ["en", "pt", "es"],
          description: "Language for the context block. Defaults to English.",
        },
      },
      required: [],
    },
  },
  {
    name: "glossary_stats",
    description:
      "Get statistics about the Solana glossary: total terms, breakdown by category, and available locales.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ─── Category Metadata ───────────────────────────────────────────────────────

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "core-protocol": "Consensus, PoH, validators, slots, epochs",
  "programming-model": "Accounts, instructions, programs, PDAs",
  "token-ecosystem": "SPL tokens, Token-2022, metadata, NFTs",
  defi: "AMMs, liquidity pools, lending protocols",
  "zk-compression": "ZK proofs, compressed accounts, Light Protocol",
  infrastructure: "RPC, validators, staking, snapshots",
  security: "Attack vectors, audit practices, reentrancy",
  "dev-tools": "Anchor, Solana CLI, explorers, testing",
  network: "Mainnet, devnet, testnet, cluster config",
  "blockchain-general": "Shared blockchain concepts",
  web3: "Wallets, dApps, signing, key management",
  "programming-fundamentals": "Data structures, serialization, Borsh",
  "ai-ml": "AI agents, inference on-chain, model integration",
  "solana-ecosystem": "Projects, protocols, and tooling",
};

// Foundational terms to use when no filter is provided for get_context_for_llm
const FOUNDATIONAL_TERM_IDS = [
  "proof-of-history",
  "proof-of-stake",
  "validator",
  "account",
  "program",
  "pda",
  "transaction",
  "instruction",
  "spl-token",
  "anchor",
  "rpc",
  "slot",
  "epoch",
  "lamport",
  "rent",
  "signer",
  "system-program",
  "token-account",
  "wallet",
  "cluster",
];

// ─── Helper: apply locale to a term ─────────────────────────────────────────

function formatTerm(term: GlossaryTerm): string {
  const lines = [`**${term.term}** (\`${term.id}\`)`, `Category: ${term.category}`, ``, term.definition];
  if (term.aliases?.length) lines.push(``, `Aliases: ${term.aliases.join(", ")}`);
  if (term.related?.length) lines.push(``, `Related: ${term.related.join(", ")}`);
  return lines.join("\n");
}

// ─── Tool Handlers ────────────────────────────────────────────────────────────

function handleGetTerm(args: Record<string, unknown>): string {
  const termId = args.term as string;
  const locale = (args.locale as string) ?? "en";
  const found = getTerm(termId);
  if (!found) {
    const suggestions = searchTerms(termId).slice(0, 3);
    if (suggestions.length === 0) return `Term "${termId}" not found in the Solana Glossary.`;
    return `Term "${termId}" not found. Did you mean:\n\n${suggestions.map((s) => `• ${s.term} (${s.id})`).join("\n")}`;
  }
  return formatTerm(applyLocale(found, locale));
}

function handleSearchTerms(args: Record<string, unknown>): string {
  const query = args.query as string;
  const limit = Math.min((args.limit as number) ?? 5, 20);
  const locale = (args.locale as string) ?? "en";
  const results = searchTerms(query).slice(0, limit);
  if (results.length === 0) return `No terms found for "${query}". Try a different keyword.`;
  return `Found ${results.length} result(s) for "${query}":\n\n${results.map((t) => formatTerm(applyLocale(t, locale))).join("\n\n---\n\n")}`;
}

function handleGetTermsByCategory(args: Record<string, unknown>): string {
  const category = args.category as string;
  const locale = (args.locale as string) ?? "en";
  if (!CATEGORY_FILES.includes(category)) {
    return `Unknown category: "${category}". Available: ${CATEGORY_FILES.join(", ")}`;
  }
  const terms = getTermsByCategory(category);
  const formatted = terms.map((t) => {
    const l = applyLocale(t, locale);
    return `• **${l.term}** (\`${l.id}\`): ${l.definition.slice(0, 100)}${l.definition.length > 100 ? "…" : ""}`;
  });
  const desc = CATEGORY_DESCRIPTIONS[category] ?? "";
  return [`## ${category} (${terms.length} terms)`, desc ? `_${desc}_` : "", "", formatted.join("\n")].filter(Boolean).join("\n");
}

function handleListCategories(): string {
  const lines = getCategories().map((cat) => {
    const count = getTermsByCategory(cat).length;
    const desc = CATEGORY_DESCRIPTIONS[cat] ?? "";
    return `• **${cat}** — ${count} terms${desc ? ` — _${desc}_` : ""}`;
  });
  return `## Solana Glossary Categories (14 total)\n\n${lines.join("\n")}`;
}

function handleGetRelatedTerms(args: Record<string, unknown>): string {
  const termId = args.term as string;
  const depth = Math.min((args.depth as number) ?? 1, 2);
  const locale = (args.locale as string) ?? "en";
  const root = getTerm(termId);
  if (!root) return `Term "${termId}" not found.`;

  const visited = new Set<string>([root.id]);
  const results: Array<{ level: number; term: GlossaryTerm }> = [];
  const queue: Array<{ id: string; level: number }> = (root.related ?? []).map((r) => ({ id: r, level: 1 }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id) || level > depth) continue;
    visited.add(id);
    const t = getTerm(id);
    if (!t) continue;
    results.push({ level, term: t });
    if (level < depth) (t.related ?? []).forEach((r) => { if (!visited.has(r)) queue.push({ id: r, level: level + 1 }); });
  }

  if (results.length === 0) return `No related terms found for "${root.term}".`;
  const formatted = results.map(({ level, term }) => {
    const l = applyLocale(term, locale);
    return `${level === 1 ? "→" : "  ↳"} **${l.term}** (\`${l.id}\`): ${l.definition.slice(0, 120)}…`;
  });
  return `## Terms related to "${root.term}"\n\n${formatted.join("\n")}`;
}

function handleGetContextForLlm(args: Record<string, unknown>): string {
  const category = args.category as string | undefined;
  const termIds = args.term_ids as string[] | undefined;
  const locale = (args.locale as string) ?? "en";

  let terms: GlossaryTerm[];
  if (category) {
    terms = getTermsByCategory(category);
  } else if (termIds?.length) {
    terms = termIds.map((id) => getTerm(id)).filter((t): t is GlossaryTerm => t !== undefined);
  } else {
    terms = FOUNDATIONAL_TERM_IDS.map((id) => getTerm(id)).filter((t): t is GlossaryTerm => t !== undefined);
  }

  if (terms.length === 0) return "No terms found for the given filters.";
  const contextLines = terms.map((t) => { const l = applyLocale(t, locale); return `${l.term}: ${l.definition}`; });
  const header = category
    ? `# Solana Glossary Context — ${category} (${terms.length} terms)`
    : termIds?.length ? `# Solana Glossary Context — ${terms.length} selected terms`
    : `# Solana Glossary Context — Foundational Terms (${terms.length} terms)`;
  return `${header}\n\n${contextLines.join("\n")}`;
}

function handleGlossaryStats(): string {
  const breakdown = getCategories().map((cat) => `• ${cat}: ${getTermsByCategory(cat).length} terms`).join("\n");
  return [`## Solana Glossary Statistics`, ``, `**Total terms:** ${allTerms.length}`, `**Categories:** ${getCategories().length}`, `**Available locales:** English (en), Portuguese (pt), Spanish (es)`, ``, `### Breakdown by category`, breakdown].join("\n");
}

// ─── Server Setup ────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: "solana-glossary-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result: string;

    switch (name) {
      case "get_term":
        result = handleGetTerm(args);
        break;
      case "search_terms":
        result = handleSearchTerms(args);
        break;
      case "get_terms_by_category":
        result = handleGetTermsByCategory(args);
        break;
      case "list_categories":
        result = handleListCategories();
        break;
      case "get_related_terms":
        result = handleGetRelatedTerms(args);
        break;
      case "get_context_for_llm":
        result = handleGetContextForLlm(args);
        break;
      case "glossary_stats":
        result = handleGlossaryStats();
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error executing tool "${name}": ${message}` }],
      isError: true,
    };
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🌟 Solana Glossary MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});