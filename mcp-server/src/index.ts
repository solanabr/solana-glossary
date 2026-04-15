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

// 9. compare — Compare two terms side-by-side
server.tool(
  "compare",
  "Compare two Solana terms side-by-side (definitions, categories, relations)",
  {
    termA: z.string().describe("First term ID or alias"),
    termB: z.string().describe("Second term ID or alias"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ termA, termB, locale }) => {
    const overrides = locale ? loadLocale(locale) : {};
    function resolve(input: string): GlossaryTerm | undefined {
      const lower = input.toLowerCase();
      const id = termMap.has(input) ? input : termMap.has(lower) ? lower : aliasMap.get(lower);
      if (!id) return undefined;
      let t = termMap.get(id)!;
      if (locale) t = localize(t, overrides);
      return t;
    }
    const a = resolve(termA);
    const b = resolve(termB);
    if (!a || !b) {
      const missing = [!a ? termA : null, !b ? termB : null].filter(Boolean).join(", ");
      return { content: [{ type: "text", text: `Term(s) not found: ${missing}` }] };
    }
    const sharedRelated = (a.related ?? []).filter((r) => (b.related ?? []).includes(r));
    const text = [
      `## Comparison: ${a.term} vs ${b.term}\n`,
      `| | **${a.term}** | **${b.term}** |`,
      `|---|---|---|`,
      `| Category | ${a.category} | ${b.category} |`,
      `| Aliases | ${a.aliases?.join(", ") || "—"} | ${b.aliases?.join(", ") || "—"} |`,
      `| Related | ${a.related?.length ?? 0} terms | ${b.related?.length ?? 0} terms |`,
      `\n**${a.term}**: ${a.definition.slice(0, 200)}${a.definition.length > 200 ? "..." : ""}`,
      `\n**${b.term}**: ${b.definition.slice(0, 200)}${b.definition.length > 200 ? "..." : ""}`,
      sharedRelated.length > 0 ? `\n**Shared relations**: ${sharedRelated.join(", ")}` : "",
    ].join("\n");
    return { content: [{ type: "text", text }] };
  }
);

// 10. flashcards — Generate flashcards for studying
server.tool(
  "flashcards",
  "Generate Solana study flashcards (term → definition pairs)",
  {
    category: z.string().optional().describe("Category to generate from (random if omitted)"),
    count: z.number().optional().describe("Number of flashcards (default 5, max 20)"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ category, count, locale }) => {
    const overrides = locale ? loadLocale(locale) : {};
    let pool = category ? allTerms.filter((t) => t.category === category) : allTerms;
    pool = pool.filter((t) => t.definition.length > 20);
    const n = Math.min(count ?? 5, 20, pool.length);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, n);

    const cards = shuffled.map((t, i) => {
      const term = locale ? localize(t, overrides) : t;
      return `### Card ${i + 1}\n**Front**: What is **${term.term}**?\n**Back**: ${term.definition}`;
    });

    return { content: [{ type: "text", text: `## Solana Flashcards (${n} cards)\n\n${cards.join("\n\n")}` }] };
  }
);

// 11. random — Get random terms
server.tool(
  "random",
  "Get random Solana glossary terms for discovery",
  {
    count: z.number().optional().describe("Number of random terms (default 3, max 10)"),
    category: z.string().optional().describe("Filter by category"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ count, category, locale }) => {
    const overrides = locale ? loadLocale(locale) : {};
    let pool = category ? allTerms.filter((t) => t.category === category) : allTerms;
    const n = Math.min(count ?? 3, 10, pool.length);
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
    const formatted = picked.map((t) => formatTerm(locale ? localize(t, overrides) : t));
    return { content: [{ type: "text", text: `## ${n} Random Terms\n\n${formatted.join("\n\n")}` }] };
  }
);

// 12. suggest — Autocomplete/suggest terms based on partial input
server.tool(
  "suggest",
  "Suggest Solana terms based on partial input (autocomplete)",
  {
    prefix: z.string().describe("Partial term or prefix to match"),
    limit: z.number().optional().describe("Max suggestions (default 8)"),
  },
  async ({ prefix, limit }) => {
    const p = prefix.toLowerCase();
    const max = limit ?? 8;
    const matches = allTerms.filter(
      (t) =>
        t.term.toLowerCase().startsWith(p) ||
        t.id.startsWith(p) ||
        t.aliases?.some((a) => a.toLowerCase().startsWith(p))
    ).slice(0, max);

    if (matches.length === 0) {
      return { content: [{ type: "text", text: `No suggestions for "${prefix}".` }] };
    }

    const lines = matches.map((t) => `- **${t.term}** (${t.category})${t.aliases?.length ? ` [${t.aliases.join(", ")}]` : ""}`);
    return { content: [{ type: "text", text: `Suggestions for "${prefix}":\n${lines.join("\n")}` }] };
  }
);

// 13. bulk_lookup — Look up multiple terms at once
server.tool(
  "bulk_lookup",
  "Look up multiple Solana terms at once (batch query)",
  {
    terms: z.array(z.string()).describe("Array of term IDs or aliases to look up"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ terms, locale }) => {
    const overrides = locale ? loadLocale(locale) : {};
    const results: string[] = [];
    const notFound: string[] = [];

    for (const input of terms) {
      const lower = input.toLowerCase();
      const id = termMap.has(input) ? input : termMap.has(lower) ? lower : aliasMap.get(lower);
      if (!id) { notFound.push(input); continue; }
      let t = termMap.get(id)!;
      if (locale) t = localize(t, overrides);
      results.push(formatTerm(t));
    }

    const parts: string[] = [];
    if (results.length > 0) parts.push(results.join("\n\n---\n\n"));
    if (notFound.length > 0) parts.push(`\n**Not found**: ${notFound.join(", ")}`);

    return { content: [{ type: "text", text: parts.join("\n") || "No terms provided." }] };
  }
);

// 14. export_terms — Export terms in various formats
server.tool(
  "export_terms",
  "Export Solana glossary terms as JSON, CSV, or Markdown",
  {
    format: z.enum(["json", "csv", "markdown"]).describe("Export format"),
    category: z.string().optional().describe("Filter by category (all if omitted)"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ format, category, locale }) => {
    const overrides = locale ? loadLocale(locale) : {};
    let pool = category ? allTerms.filter((t) => t.category === category) : allTerms;
    if (locale) pool = pool.map((t) => localize(t, overrides));

    let text: string;
    if (format === "json") {
      text = JSON.stringify(pool.map(({ id, term, definition, category: cat, aliases }) => ({ id, term, definition, category: cat, aliases })), null, 2);
    } else if (format === "csv") {
      const header = "id,term,category,definition";
      const rows = pool.map((t) => `"${t.id}","${t.term}","${t.category}","${t.definition.replace(/"/g, '""')}"`);
      text = [header, ...rows].join("\n");
    } else {
      const rows = pool.map((t) => `| ${t.id} | ${t.term} | ${t.category} | ${t.definition.slice(0, 80)}${t.definition.length > 80 ? "..." : ""} |`);
      text = [`| ID | Term | Category | Definition |`, `|---|---|---|---|`, ...rows].join("\n");
    }

    return { content: [{ type: "text", text }] };
  }
);

// 15. learning_path — Generate a learning path for a topic
server.tool(
  "learning_path",
  "Generate a structured Solana learning path starting from a term",
  {
    topic: z.string().describe("Starting term or category for the learning path"),
    locale: z.string().optional().describe("Locale code (pt, es)"),
  },
  async ({ topic, locale }) => {
    const overrides = locale ? loadLocale(locale) : {};
    // Try as category first
    const catTerms = allTerms.filter((t) => t.category === topic);
    let path: GlossaryTerm[] = [];

    if (catTerms.length > 0) {
      // Sort by: terms with most "referenced by" first (foundational concepts)
      const refCount = new Map<string, number>();
      for (const t of catTerms) {
        for (const r of t.related ?? []) {
          refCount.set(r, (refCount.get(r) ?? 0) + 1);
        }
      }
      path = [...catTerms].sort((a, b) => (refCount.get(b.id) ?? 0) - (refCount.get(a.id) ?? 0)).slice(0, 10);
    } else {
      // Try as a term — build path from related terms
      const lower = topic.toLowerCase();
      const startId = termMap.has(topic) ? topic : termMap.has(lower) ? lower : aliasMap.get(lower);
      if (!startId || !termMap.has(startId)) {
        return { content: [{ type: "text", text: `Topic "${topic}" not found as term or category.` }] };
      }
      const visited = new Set<string>();
      const queue = [startId];
      while (queue.length > 0 && path.length < 10) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const t = termMap.get(id);
        if (!t) continue;
        path.push(t);
        for (const r of t.related ?? []) {
          if (!visited.has(r)) queue.push(r);
        }
      }
    }

    if (locale) path = path.map((t) => localize(t, overrides));

    const steps = path.map((t, i) => {
      const level = i < 3 ? "Beginner" : i < 7 ? "Intermediate" : "Advanced";
      return `### Step ${i + 1} — ${level}\n**${t.term}** (${t.category})\n${t.definition.slice(0, 200)}${t.definition.length > 200 ? "..." : ""}`;
    });

    return { content: [{ type: "text", text: `## Learning Path: ${topic}\n\n${steps.join("\n\n")}` }] };
  }
);

// 16. difficulty — Rate terms by complexity for study planning
server.tool(
  "difficulty",
  "Rate Solana terms by estimated difficulty (based on definition length, relations, category)",
  {
    category: z.string().optional().describe("Filter by category"),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional().describe("Filter by difficulty level"),
    limit: z.number().optional().describe("Max results (default 10)"),
  },
  async ({ category, level, limit }) => {
    const max = limit ?? 10;
    let pool = category ? allTerms.filter((t) => t.category === category) : allTerms;

    // Score complexity: longer definitions + more relations = harder
    const scored = pool.map((t) => {
      const defLen = t.definition.length;
      const relCount = t.related?.length ?? 0;
      const aliasCount = t.aliases?.length ?? 0;
      const score = defLen * 0.1 + relCount * 10 + aliasCount * 5;
      const difficulty = score < 20 ? "beginner" : score < 50 ? "intermediate" : "advanced";
      return { term: t, score, difficulty };
    });

    let filtered = level ? scored.filter((s) => s.difficulty === level) : scored;
    filtered.sort((a, b) => a.score - b.score);
    const shown = filtered.slice(0, max);

    const lines = shown.map((s) =>
      `- **${s.term.term}** [${s.difficulty}] — ${s.term.definition.slice(0, 100)}${s.term.definition.length > 100 ? "..." : ""}`
    );

    return { content: [{ type: "text", text: `## Terms by Difficulty${level ? ` (${level})` : ""}\n\n${lines.join("\n")}` }] };
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
