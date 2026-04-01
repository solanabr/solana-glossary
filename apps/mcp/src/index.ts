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

    // shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);

    const localized = lang === "pt" ? getLocalizedTerms("pt") : [];

    const questions = shuffled.map((term, i) => {
      let displayTerm = term.term;
      let displayDef = term.definition;
      if (lang === "pt") {
        const loc = localized.find((t) => t.id === term.id);
        if (loc) { displayTerm = loc.term; if (loc.definition) displayDef = loc.definition; }
      }

      // pick 3 wrong answers
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

    const header = `# Solana Glossary Quiz${category ? ` — ${category}` : ""}

${count} questions

---

`;
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

// ── start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
