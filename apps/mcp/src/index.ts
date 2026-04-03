#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
  allTerms,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import type { GlossaryTerm } from "@stbr/solana-glossary";

const server = new McpServer({
  name: "solana-glossary",
  version: "1.0.0",
});

// ── tool: lookup_term ────────────────────────────────────────────────────────
server.tool(
  "lookup_term",
  "Look up a Solana term by its ID or alias. Returns the full definition, category, related terms, and aliases.",
  {
    term: z.string().describe("Term ID or alias, e.g. 'pda', 'PoH', 'proof-of-history'"),
    lang: z.enum(["en", "pt"]).optional().default("en").describe("Language: en (default) or pt (Portuguese)"),
  },
  async ({ term, lang }) => {
    const found = getTerm(term);
    if (!found) {
      return {
        content: [{ type: "text", text: `Term not found: "${term}". Try using search_glossary to find similar terms.` }],
      };
    }

    let displayTerm = found.term;
    let displayDef = found.definition;

    if (lang === "pt") {
      const localized = getLocalizedTerms("pt");
      const loc = localized.find((t) => t.id === found.id);
      if (loc) {
        displayTerm = loc.term;
        if (loc.definition) displayDef = loc.definition;
      }
    }

    const lines = [
      `# ${displayTerm}`,
      ``,
      `**ID:** ${found.id}`,
      `**Category:** ${found.category}`,
      found.aliases?.length ? `**Aliases:** ${found.aliases.join(", ")}` : null,
      ``,
      `## Definition`,
      displayDef,
      found.related?.length
        ? `\n## Related Terms\n${found.related.map((r) => `- ${r}`).join("\n")}`
        : null,
    ]
      .filter((l) => l !== null)
      .join("\n");

    return { content: [{ type: "text", text: lines }] };
  }
);

// ── tool: search_glossary ────────────────────────────────────────────────────
server.tool(
  "search_glossary",
  "Full-text search across all 1001 Solana glossary terms. Searches term names, definitions, IDs, and aliases.",
  {
    query: z.string().describe("Search query, e.g. 'account', 'proof of history', 'AMM'"),
    limit: z.number().int().min(1).max(50).optional().default(10).describe("Max results to return (default 10)"),
  },
  async ({ query, limit }) => {
    const results = searchTerms(query).slice(0, limit);
    if (!results.length) {
      return { content: [{ type: "text", text: `No results found for "${query}".` }] };
    }

    const lines = [
      `# Search results for "${query}" (${results.length} of ${searchTerms(query).length} total)`,
      ``,
      ...results.map((t) => `## ${t.term}\n**ID:** ${t.id} | **Category:** ${t.category}\n${t.definition}`),
    ].join("\n\n");

    return { content: [{ type: "text", text: lines }] };
  }
);

// ── tool: get_category ───────────────────────────────────────────────────────
server.tool(
  "get_category",
  "Get all Solana glossary terms belonging to a specific category.",
  {
    category: z.string().describe("Category ID, e.g. 'defi', 'core-protocol', 'security'"),
    limit: z.number().int().min(1).max(200).optional().default(20).describe("Max results (default 20)"),
  },
  async ({ category, limit }) => {
    const cats = getCategories();
    if (!cats.includes(category as never)) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown category: "${category}".\n\nAvailable categories:\n${cats.map((c) => `- ${c}`).join("\n")}`,
          },
        ],
      };
    }

    const terms = getTermsByCategory(category as never).slice(0, limit);
    const lines = [
      `# Category: ${category} (${getTermsByCategory(category as never).length} terms total)`,
      ``,
      ...terms.map((t) => `**${t.term}** (${t.id})\n${t.definition}`),
    ].join("\n\n");

    return { content: [{ type: "text", text: lines }] };
  }
);

// ── tool: get_related_terms ──────────────────────────────────────────────────
server.tool(
  "get_related_terms",
  "Get all terms related to a given Solana term, with their full definitions.",
  {
    term: z.string().describe("Term ID or alias to find related terms for"),
  },
  async ({ term }) => {
    const found = getTerm(term);
    if (!found) {
      return { content: [{ type: "text", text: `Term not found: "${term}".` }] };
    }

    if (!found.related?.length) {
      return { content: [{ type: "text", text: `No related terms found for "${found.term}".` }] };
    }

    const related = found.related
      .map((id) => getTerm(id))
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

    const lines = [
      `# Terms related to "${found.term}"`,
      ``,
      ...related.map((t) => `## ${t.term}\n**ID:** ${t.id} | **Category:** ${t.category}\n${t.definition}`),
    ].join("\n\n");

    return { content: [{ type: "text", text: lines }] };
  }
);

// ── tool: list_categories ────────────────────────────────────────────────────
server.tool(
  "list_categories",
  "List all 14 available categories in the Solana glossary with term counts.",
  {},
  async () => {
    const cats = getCategories();
    const lines = [
      `# Solana Glossary Categories (${allTerms.length} terms total)`,
      ``,
      ...cats.map((c) => `- **${c}** — ${getTermsByCategory(c).length} terms`),
    ].join("\n");

    return { content: [{ type: "text", text: lines }] };
  }
);

// ── tool: generate_quiz ──────────────────────────────────────────────────────
server.tool(
  "generate_quiz",
  "Generate quiz questions from Solana glossary terms to test knowledge. Great for learning and onboarding.",
  {
    category: z.string().optional().describe("Category to generate quiz from (e.g. 'defi', 'security'). Omit for random across all categories."),
    count: z.number().int().min(1).max(10).optional().default(5).describe("Number of questions to generate (default 5)"),
    lang: z.enum(["en", "pt"]).optional().default("en").describe("Language: en or pt"),
  },
  async ({ category, count, lang }) => {
    let pool = allTerms;
    if (category) {
      const cats = getCategories();
      if (!cats.includes(category as never)) {
        return { content: [{ type: "text", text: `Unknown category: "${category}". Available: ${cats.join(", ")}` }] };
      }
      pool = getTermsByCategory(category as never);
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    const localized = lang === "pt" ? getLocalizedTerms("pt") : [];

    const questions = shuffled.map((term, i) => {
      let displayTerm = term.term;
      let displayDef = term.definition;
      if (lang === "pt") {
        const loc = localized.find((t) => t.id === term.id);
        if (loc) { displayTerm = loc.term; if (loc.definition) displayDef = loc.definition; }
      }

      const wrong = [...pool]
        .filter((t) => t.id !== term.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((t) => {
          if (lang === "pt") {
            const loc = localized.find((l) => l.id === t.id);
            return loc ? loc.term : t.term;
          }
          return t.term;
        });

      const options = [...wrong, displayTerm].sort(() => Math.random() - 0.5);

      return `**Q${i + 1}.** ${displayDef}\n\n${options.map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`).join("\n")}\n\n<details><summary>Answer</summary>${displayTerm}</details>`;
    });

    const header = `# Solana Glossary Quiz${category ? ` — ${category}` : ""}\n\n${count} questions\n\n---\n\n`;
    return { content: [{ type: "text", text: header + questions.join("\n\n---\n\n") }] };
  }
);

// ── tool: inject_context ─────────────────────────────────────────────────────
server.tool(
  "inject_context",
  "Generate a token-optimized context block for LLMs. Feed this into your system prompt to give any AI instant Solana knowledge without wasting tokens re-explaining basics.",
  {
    category: z.string().optional().describe("Category to inject context for (e.g. 'defi', 'security'). Omit for a curated cross-category summary."),
    max_terms: z.number().int().min(1).max(100).optional().default(20).describe("Max terms to include (default 20)"),
    format: z.enum(["compact", "detailed"]).optional().default("compact").describe("compact: term + short def. detailed: full definitions + related terms"),
  },
  async ({ category, max_terms, format }) => {
    let terms = allTerms;
    if (category) {
      const cats = getCategories();
      if (!cats.includes(category as never)) {
        return { content: [{ type: "text", text: `Unknown category: "${category}". Available: ${cats.join(", ")}` }] };
      }
      terms = getTermsByCategory(category as never);
    }

    const selected = terms.slice(0, max_terms);

    let block: string;
    if (format === "compact") {
      block = selected.map((t) => `${t.term}: ${t.definition.slice(0, 120)}${t.definition.length > 120 ? "..." : ""}`).join("\n");
    } else {
      block = selected.map((t) => {
        const related = t.related?.length ? "\n  related: " + t.related.slice(0, 3).join(", ") : "";
        return "## " + t.term + "\n" + t.definition + related;
      }).join("\n\n");
    }

    const charCount = block.length;
    const tokenEstimate = Math.ceil(charCount / 4);

    const header = [
      `# Solana Glossary Context Block`,
      `# ${selected.length} terms${category ? ` from "${category}"` : " (curated)"} · ~${tokenEstimate} tokens · ${format} format`,
      `# Generated by @stbr/solana-glossary-mcp`,
      ``,
    ].join("\n");

    return { content: [{ type: "text", text: header + block }] };
  }
);

// ── tool: glossary_stats ─────────────────────────────────────────────────────
server.tool(
  "glossary_stats",
  "Get statistics about the Solana Glossary — total terms, breakdown by category, and terms with most cross-references.",
  {},
  async () => {
    const cats = getCategories();
    const categoryStats = cats.map((c) => ({
      category: c,
      count: getTermsByCategory(c as never).length,
    })).sort((a, b) => b.count - a.count);

    const mostReferenced = [...allTerms]
      .filter((t) => t.related && t.related.length > 0)
      .sort((a, b) => (b.related?.length ?? 0) - (a.related?.length ?? 0))
      .slice(0, 5);

    const lines = [
      `# Solana Glossary Stats`,
      ``,
      `**Total terms:** ${allTerms.length}`,
      `**Categories:** ${cats.length}`,
      `**Terms with cross-references:** ${allTerms.filter((t) => t.related?.length).length}`,
      `**Terms with aliases:** ${allTerms.filter((t) => t.aliases?.length).length}`,
      ``,
      `## By Category`,
      ...categoryStats.map((c) => `- **${c.category}**: ${c.count} terms`),
      ``,
      `## Most Cross-Referenced Terms`,
      ...mostReferenced.map((t) => `- **${t.term}** (${t.related?.length} references)`),
    ].join("\n");

    return { content: [{ type: "text", text: lines }] };
  }
);

// ── tool: fuzzy_search ───────────────────────────────────────────────────────
server.tool(
  "fuzzy_search",
  "Fuzzy search for Solana terms using Levenshtein distance. Tolerates typos and misspellings — e.g. 'laminport' finds 'lamport', 'proff of history' finds 'proof-of-history'.",
  {
    query: z.string().describe("Search query, may contain typos, e.g. 'sysvar', 'laminport', 'tokn metadata'"),
    limit: z.number().int().min(1).max(20).optional().default(5).describe("Max results (default 5)"),
    threshold: z.number().min(0).max(1).optional().default(0.6).describe("Similarity threshold 0–1 (default 0.6, lower = more permissive)"),
  },
  async ({ query, limit, threshold }) => {
    function levenshtein(a: string, b: string): number {
      const m = a.length, n = b.length;
      const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
      );
      for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
          dp[i][j] = a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      return dp[m][n];
    }

    function similarity(a: string, b: string): number {
      const maxLen = Math.max(a.length, b.length);
      if (maxLen === 0) return 1;
      return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen;
    }

    const q = query.toLowerCase();
    const scored = allTerms.map((t) => {
      const candidates = [t.id, t.term.toLowerCase(), ...(t.aliases ?? []).map((a) => a.toLowerCase())];
      const score = Math.max(...candidates.map((c) => similarity(q, c)));
      return { term: t, score };
    });

    const results = scored
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (!results.length) {
      return { content: [{ type: "text", text: `No fuzzy matches found for "${query}" (threshold: ${threshold}). Try a lower threshold.` }] };
    }

    const lines = [
      `# Fuzzy Search: "${query}" (${results.length} matches)`,
      ``,
      ...results.map(({ term: t, score }) =>
        `## ${t.term} — ${(score * 100).toFixed(0)}% match\n**ID:** ${t.id} | **Category:** ${t.category}\n${t.definition.slice(0, 150)}${t.definition.length > 150 ? "..." : ""}`
      ),
    ].join("\n\n");

    return { content: [{ type: "text", text: lines }] };
  }
);

// ── tool: find_learning_path ─────────────────────────────────────────────────
server.tool(
  "find_learning_path",
  "Find the shortest learning path between two Solana concepts using BFS graph traversal over the related-terms graph. Shows the conceptual bridge connecting two terms.",
  {
    from: z.string().describe("Starting term ID or alias, e.g. 'account'"),
    to: z.string().describe("Target term ID or alias, e.g. 'pda'"),
    max_depth: z.number().int().min(1).max(8).optional().default(6).describe("Max BFS depth (default 6)"),
  },
  async ({ from, to, max_depth }) => {
    const start = getTerm(from);
    const end = getTerm(to);

    if (!start) return { content: [{ type: "text", text: `Term not found: "${from}". Use search_glossary to find the right ID.` }] };
    if (!end) return { content: [{ type: "text", text: `Term not found: "${to}". Use search_glossary to find the right ID.` }] };
    if (start.id === end.id) return { content: [{ type: "text", text: `Start and end are the same term: ${start.term}` }] };

    // BFS over related-terms graph
    const queue: string[][] = [[start.id]];
    const visited = new Set<string>([start.id]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      if (path.length > max_depth) break;

      const current = getTerm(path[path.length - 1]);
      if (!current?.related?.length) continue;

      for (const neighborId of current.related) {
        if (visited.has(neighborId)) continue;
        const newPath = [...path, neighborId];

        if (neighborId === end.id) {
          const termPath = newPath
            .map((id) => getTerm(id))
            .filter((t): t is GlossaryTerm => t !== undefined);

          const lines = [
            `# Learning Path: ${start.term} → ${end.term}`,
            `**${termPath.length} steps** via related-terms graph`,
            ``,
            ...termPath.map((t, i) => [
              `### Step ${i + 1}: ${t.term}`,
              `**Category:** ${t.category}`,
              t.definition.slice(0, 200) + (t.definition.length > 200 ? "..." : ""),
            ].join("\n")),
          ].join("\n\n");

          return { content: [{ type: "text", text: lines }] };
        }

        visited.add(neighborId);
        queue.push(newPath);
      }
    }

    return {
      content: [{
        type: "text",
        text: `No path found between "${start.term}" and "${end.term}" within ${max_depth} hops.\n\nTry increasing max_depth or finding an intermediate concept with search_glossary.`,
      }],
    };
  }
);

// ── tool: compare_terms ──────────────────────────────────────────────────────
server.tool(
  "compare_terms",
  "Compare 2–5 Solana terms side by side: definitions, categories, shared relationships, and unique connections.",
  {
    terms: z.array(z.string()).min(2).max(5).describe("Array of term IDs or aliases to compare, e.g. ['account', 'pda', 'signer']"),
    lang: z.enum(["en", "pt"]).optional().default("en").describe("Language for output"),
  },
  async ({ terms, lang }) => {
    const found = terms.map((id) => getTerm(id)).filter((t): t is GlossaryTerm => t !== undefined);
    const notFound = terms.filter((id) => !getTerm(id));

    if (notFound.length) {
      return { content: [{ type: "text", text: `Terms not found: ${notFound.join(", ")}. Use search_glossary to find the right IDs.` }] };
    }
    if (found.length < 2) {
      return { content: [{ type: "text", text: "Need at least 2 valid terms to compare." }] };
    }

    const allRelatedSets = found.map((t) => new Set(t.related ?? []));
    const sharedByAll = found[0].related?.filter((r) => allRelatedSets.every((s) => s.has(r))) ?? [];

    const lines = [
      `# Comparison: ${found.map((t) => t.term).join(" vs ")}`,
      ``,
      `## Side-by-Side`,
      `| Attribute | ${found.map((t) => `**${t.term}**`).join(" | ")} |`,
      `|---|${found.map(() => "---|").join("")}`,
      `| Category | ${found.map((t) => t.category).join(" | ")} |`,
      `| Aliases | ${found.map((t) => t.aliases?.join(", ") || "—").join(" | ")} |`,
      `| Related count | ${found.map((t) => t.related?.length ?? 0).join(" | ")} |`,
      ``,
      `## Definitions`,
      ...found.map((t) => `### ${t.term}\n${t.definition}`),
      ``,
      sharedByAll.length
        ? `## Shared Relationships\nAll terms relate to: **${sharedByAll.map((id) => getTerm(id)?.term ?? id).join(", ")}**`
        : `## Shared Relationships\nNo direct shared relationships found between all terms.`,
      ``,
      `## Individual Connections`,
      ...found.map((t) =>
        `**${t.term}:** ${t.related?.map((id) => getTerm(id)?.term ?? id).join(", ") || "none"}`
      ),
    ].join("\n");

    return { content: [{ type: "text", text: lines }] };
  }
);

// ── tool: explain_concept ────────────────────────────────────────────────────
server.tool(
  "explain_concept",
  "Deep-dive explanation of a Solana concept using DFS traversal of the related-terms graph. Builds rich contextual understanding by exploring connected concepts up to a configurable depth.",
  {
    term: z.string().describe("Term ID or alias to explain, e.g. 'pda', 'account', 'validator'"),
    depth: z.number().int().min(1).max(4).optional().default(2).describe("DFS depth for exploring related concepts (default 2, max 4)"),
    lang: z.enum(["en", "pt"]).optional().default("en").describe("Language"),
  },
  async ({ term, depth, lang }) => {
    const root = getTerm(term);
    if (!root) {
      return { content: [{ type: "text", text: `Term not found: "${term}". Use search_glossary or fuzzy_search to find the right ID.` }] };
    }

    const visited = new Set<string>();
    const sections: string[] = [];

    function dfs(id: string, currentDepth: number, headingLevel: number): void {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const t = getTerm(id);
      if (!t) return;

      const prefix = "#".repeat(Math.min(headingLevel, 4));
      sections.push(`${prefix} ${t.term}`);
      sections.push(`**Category:** ${t.category}`);
      sections.push(t.definition);
      if (t.aliases?.length) sections.push(`*Also known as: ${t.aliases.join(", ")}*`);
      sections.push("");

      if (currentDepth < depth && t.related?.length) {
        for (const childId of t.related.slice(0, 4)) {
          dfs(childId, currentDepth + 1, headingLevel + 1);
        }
      }
    }

    dfs(root.id, 1, 1);

    const header = `# Deep Explanation: ${root.term}\n*Exploring ${visited.size} connected concepts at depth ${depth}*\n\n`;
    return { content: [{ type: "text", text: header + sections.join("\n") }] };
  }
);

//  ── start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);