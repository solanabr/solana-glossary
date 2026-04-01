#!/usr/bin/env node

/**
 * Solana Glossary MCP Server
 *
 * Exposes 1001 Solana ecosystem terms to any MCP-compatible AI client
 * (Claude, GPT, etc.) with search, browse, quiz, and i18n support.
 *
 * Uses the @stbr/solana-glossary SDK data layer.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Data Layer — load terms directly from JSON (no build dependency)
// ---------------------------------------------------------------------------

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
  aliases?: string[];
}

type LocaleOverride = Record<string, { term?: string; definition?: string }>;

const DATA_DIR = path.resolve(__dirname, "../../data/terms");
const I18N_DIR = path.resolve(__dirname, "../../data/i18n");

function loadAllTerms(): GlossaryTerm[] {
  const terms: GlossaryTerm[] = [];
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
    terms.push(...data);
  }
  return terms;
}

const allTerms = loadAllTerms();
const termMap = new Map(allTerms.map((t) => [t.id, t]));
const aliasMap = new Map<string, string>();
for (const t of allTerms) {
  for (const alias of t.aliases ?? []) {
    aliasMap.set(alias.toLowerCase(), t.id);
  }
}

const CATEGORIES = [...new Set(allTerms.map((t) => t.category))].sort();

function loadLocale(locale: string): LocaleOverride {
  const file = path.join(I18N_DIR, `${locale}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function localize(term: GlossaryTerm, overrides: LocaleOverride): GlossaryTerm {
  const o = overrides[term.id];
  if (!o) return term;
  return { ...term, term: o.term ?? term.term, definition: o.definition ?? term.definition };
}

function formatTerm(t: GlossaryTerm): string {
  const parts = [`**${t.term}** (${t.category})`];
  parts.push(t.definition || "_No definition yet._");
  if (t.aliases?.length) parts.push(`Aliases: ${t.aliases.join(", ")}`);
  if (t.related?.length) parts.push(`Related: ${t.related.join(", ")}`);
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "solana-glossary",
  version: "1.0.0",
});

// 1. lookup — Get a specific term by ID or alias
server.tool(
  "lookup",
  "Look up a Solana term by its ID or alias (e.g. 'pda', 'PoH', 'amm')",
  {
    term: z.string().describe("Term ID or alias to look up"),
    locale: z.string().optional().describe("Locale code for translation (pt, es). Default: en"),
  },
  async ({ term, locale }) => {
    const lower = term.toLowerCase();
    const id = termMap.has(term) ? term : termMap.has(lower) ? lower : aliasMap.get(lower);
    if (!id) {
      return { content: [{ type: "text", text: `Term "${term}" not found. Try 'search' to find related terms.` }] };
    }
    let entry = termMap.get(id)!;
    if (locale) entry = localize(entry, loadLocale(locale));
    return { content: [{ type: "text", text: formatTerm(entry) }] };
  }
);

// 2. search — Full-text search across all terms
server.tool(
  "search",
  "Search Solana glossary terms by keyword (matches name, definition, aliases)",
  {
    query: z.string().describe("Search query"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
    limit: z.number().optional().describe("Max results (default 10)"),
  },
  async ({ query, locale, limit }) => {
    const q = query.toLowerCase();
    const max = limit ?? 10;
    const overrides = locale ? loadLocale(locale) : {};

    let results = allTerms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.id.includes(q) ||
        t.aliases?.some((a) => a.toLowerCase().includes(q))
    );

    if (locale) results = results.map((t) => localize(t, overrides));
    const shown = results.slice(0, max);

    if (shown.length === 0) {
      return { content: [{ type: "text", text: `No results for "${query}".` }] };
    }

    const text = [
      `Found ${results.length} result(s) for "${query}"${results.length > max ? ` (showing ${max})` : ""}:\n`,
      ...shown.map((t, i) => `${i + 1}. ${formatTerm(t)}`),
    ].join("\n\n");

    return { content: [{ type: "text", text }] };
  }
);

// 3. browse — List terms by category
server.tool(
  "browse",
  "Browse Solana glossary terms by category",
  {
    category: z.string().describe(`Category to browse. Available: ${CATEGORIES.join(", ")}`),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ category, locale }) => {
    const overrides = locale ? loadLocale(locale) : {};
    let terms = allTerms.filter((t) => t.category === category);

    if (terms.length === 0) {
      return {
        content: [{ type: "text", text: `Category "${category}" not found.\nAvailable: ${CATEGORIES.join(", ")}` }],
      };
    }

    if (locale) terms = terms.map((t) => localize(t, overrides));

    const text = [
      `**${category}** — ${terms.length} terms:\n`,
      ...terms.map((t) => `- **${t.term}**: ${t.definition.slice(0, 120)}${t.definition.length > 120 ? "..." : ""}`),
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

// 4. categories — List all categories with counts
server.tool(
  "categories",
  "List all Solana glossary categories with term counts",
  {},
  async () => {
    const counts = new Map<string, number>();
    for (const t of allTerms) {
      counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    }

    const lines = CATEGORIES.map((c) => `- **${c}**: ${counts.get(c)} terms`);
    const text = `**Solana Glossary** — ${allTerms.length} terms across ${CATEGORIES.length} categories:\n\n${lines.join("\n")}`;

    return { content: [{ type: "text", text }] };
  }
);

// 5. related — Get related terms (knowledge graph traversal)
server.tool(
  "related",
  "Get terms related to a given Solana term (cross-references)",
  {
    term: z.string().describe("Term ID to find relations for"),
    depth: z.number().optional().describe("Depth of traversal (1-3, default 1)"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ term, depth, locale }) => {
    const maxDepth = Math.min(depth ?? 1, 3);
    const overrides = locale ? loadLocale(locale) : {};
    const visited = new Set<string>();
    const layers: GlossaryTerm[][] = [];

    let currentIds = [term.toLowerCase()];
    // Also try alias
    if (!termMap.has(currentIds[0])) {
      const aliased = aliasMap.get(currentIds[0]);
      if (aliased) currentIds = [aliased];
    }

    for (let d = 0; d < maxDepth; d++) {
      const layer: GlossaryTerm[] = [];
      const nextIds: string[] = [];

      for (const id of currentIds) {
        if (visited.has(id)) continue;
        visited.add(id);
        const t = termMap.get(id);
        if (!t) continue;
        layer.push(locale ? localize(t, overrides) : t);
        for (const rel of t.related ?? []) {
          if (!visited.has(rel)) nextIds.push(rel);
        }
      }

      if (layer.length > 0) layers.push(layer);
      currentIds = nextIds;
      if (nextIds.length === 0) break;
    }

    if (layers.length === 0) {
      return { content: [{ type: "text", text: `Term "${term}" not found.` }] };
    }

    const parts: string[] = [];
    layers.forEach((layer, i) => {
      const label = i === 0 ? "Source" : `Depth ${i}`;
      parts.push(`### ${label}`);
      for (const t of layer) {
        parts.push(formatTerm(t));
      }
    });

    return { content: [{ type: "text", text: parts.join("\n\n") }] };
  }
);

// 6. quiz — Generate a quiz question from random terms
server.tool(
  "quiz",
  "Generate a Solana knowledge quiz question (multiple choice)",
  {
    category: z.string().optional().describe("Category to quiz on (random if omitted)"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ category, locale }) => {
    const overrides = locale ? loadLocale(locale) : {};
    let pool = category ? allTerms.filter((t) => t.category === category) : allTerms;
    pool = pool.filter((t) => t.definition.length > 20);

    if (pool.length < 4) {
      return { content: [{ type: "text", text: "Not enough terms with definitions to generate a quiz." }] };
    }

    // Pick answer + 3 distractors
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const answer = locale ? localize(shuffled[0], overrides) : shuffled[0];
    const distractors = shuffled.slice(1, 4).map((t) => (locale ? localize(t, overrides) : t));

    const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
    const correctLetter = String.fromCharCode(65 + options.indexOf(answer));

    const text = [
      `**Quiz: What is this?**\n`,
      `> ${answer.definition}\n`,
      ...options.map((t, i) => `${String.fromCharCode(65 + i)}) ${t.term}`),
      `\n||Answer: ${correctLetter}) ${answer.term}||`,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

// 7. stats — Glossary statistics
server.tool(
  "stats",
  "Get statistics about the Solana glossary (term counts, coverage, languages)",
  {},
  async () => {
    const withDef = allTerms.filter((t) => t.definition.length > 0).length;
    const withRelated = allTerms.filter((t) => t.related && t.related.length > 0).length;
    const withAliases = allTerms.filter((t) => t.aliases && t.aliases.length > 0).length;
    const totalRelations = allTerms.reduce((sum, t) => sum + (t.related?.length ?? 0), 0);

    const locales: string[] = [];
    try {
      for (const f of fs.readdirSync(I18N_DIR)) {
        if (f.endsWith(".json")) locales.push(f.replace(".json", ""));
      }
    } catch {}

    const text = [
      `**Solana Glossary Stats**`,
      `- Total terms: ${allTerms.length}`,
      `- With definitions: ${withDef} (${((withDef / allTerms.length) * 100).toFixed(1)}%)`,
      `- With cross-references: ${withRelated} (${totalRelations} total links)`,
      `- With aliases: ${withAliases}`,
      `- Categories: ${CATEGORIES.length}`,
      `- Languages: en (default)${locales.length ? ", " + locales.join(", ") : ""}`,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

// 8. explain — Explain a Solana concept using related terms for context
server.tool(
  "explain",
  "Explain a Solana concept with full context — definition + all related terms",
  {
    term: z.string().describe("Term ID or alias to explain"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ term, locale }) => {
    const lower = term.toLowerCase();
    const id = termMap.has(term) ? term : termMap.has(lower) ? lower : aliasMap.get(lower);
    if (!id) {
      return { content: [{ type: "text", text: `Term "${term}" not found.` }] };
    }

    const overrides = locale ? loadLocale(locale) : {};
    let entry = termMap.get(id)!;
    if (locale) entry = localize(entry, overrides);

    const parts = [`## ${entry.term}\n`, `**Category**: ${entry.category}`];
    if (entry.aliases?.length) parts.push(`**Also known as**: ${entry.aliases.join(", ")}`);
    parts.push(`\n${entry.definition || "_No definition yet._"}`);

    if (entry.related?.length) {
      parts.push(`\n### Related Concepts\n`);
      for (const relId of entry.related) {
        let rel = termMap.get(relId);
        if (!rel) continue;
        if (locale) rel = localize(rel, overrides);
        parts.push(`- **${rel.term}**: ${rel.definition.slice(0, 150)}${rel.definition.length > 150 ? "..." : ""}`);
      }
    }

    // Find terms that reference this one
    const referencedBy = allTerms.filter((t) => t.related?.includes(id) && t.id !== id);
    if (referencedBy.length > 0) {
      parts.push(`\n### Referenced By\n`);
      for (const ref of referencedBy.slice(0, 10)) {
        let r = locale ? localize(ref, overrides) : ref;
        parts.push(`- ${r.term} (${r.category})`);
      }
      if (referencedBy.length > 10) parts.push(`- ...and ${referencedBy.length - 10} more`);
    }

    return { content: [{ type: "text", text: parts.join("\n") }] };
  }
);

// ---------------------------------------------------------------------------
// Resources — expose categories and stats as MCP resources
// ---------------------------------------------------------------------------

server.resource(
  "glossary-stats",
  "solana-glossary://stats",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          totalTerms: allTerms.length,
          categories: CATEGORIES.length,
          languages: ["en", ...fs.readdirSync(I18N_DIR).filter(f => f.endsWith(".json")).map(f => f.replace(".json", ""))],
        }),
      },
    ],
  })
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Solana Glossary MCP server running — ${allTerms.length} terms loaded`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
