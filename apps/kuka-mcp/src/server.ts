#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
  getRelated,
  generateQuiz,
  generateContext,
  allTerms,
} from "./glossary.js";

const server = new McpServer({
  name: "kuka-glossary",
  version: "1.0.0",
});

// --- Tool: glossary_lookup ---
server.tool(
  "glossary_lookup",
  "Look up a Solana term by ID or alias. Returns definition, category, related terms, and aliases. Supports i18n (pt, es).",
  {
    term: z.string().describe("Term ID (e.g. 'proof-of-history') or alias (e.g. 'PoH')"),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for the response (default: en)"),
  },
  async ({ term, locale }) => {
    const result = getTerm(term, locale);
    if (!result) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Term "${term}" not found. Try glossary_search to find similar terms.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// --- Tool: glossary_search ---
server.tool(
  "glossary_search",
  "Full-text search across 1,001 Solana glossary terms. Matches term names, definitions, IDs, and aliases. Returns up to 20 results.",
  {
    query: z.string().describe("Search query (e.g. 'liquidity pool', 'AMM', 'proof')"),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for results (default: en)"),
  },
  async ({ query, locale }) => {
    const results = searchTerms(query, locale);
    return {
      content: [
        {
          type: "text" as const,
          text:
            results.length > 0
              ? JSON.stringify(
                  results.map((t) => ({
                    id: t.id,
                    term: t.term,
                    category: t.category,
                    definition:
                      t.definition.length > 120
                        ? t.definition.slice(0, 120) + "..."
                        : t.definition,
                  })),
                  null,
                  2
                )
              : `No terms found for "${query}".`,
        },
      ],
    };
  }
);

// --- Tool: glossary_category ---
server.tool(
  "glossary_category",
  "List all terms in a glossary category. 14 categories available: core-protocol, defi, security, programming-model, token-ecosystem, dev-tools, web3, ai-ml, and more.",
  {
    category: z
      .string()
      .describe(
        "Category ID (e.g. 'defi', 'core-protocol', 'security'). Use without arguments to list all categories."
      ),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for results (default: en)"),
  },
  async ({ category, locale }) => {
    if (category === "list" || category === "") {
      const cats = getCategories();
      return {
        content: [
          {
            type: "text" as const,
            text: `Available categories (${cats.length}):\n${cats.map((c) => `- ${c}`).join("\n")}`,
          },
        ],
      };
    }
    const terms = getTermsByCategory(category, locale);
    if (terms.length === 0) {
      const cats = getCategories();
      return {
        content: [
          {
            type: "text" as const,
            text: `Category "${category}" not found. Available: ${cats.join(", ")}`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              category,
              count: terms.length,
              terms: terms.map((t) => ({ id: t.id, term: t.term })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Tool: glossary_related ---
server.tool(
  "glossary_related",
  "Walk the cross-reference knowledge graph starting from a term. Reveals how Solana concepts connect to each other through related term chains.",
  {
    term: z.string().describe("Starting term ID (e.g. 'proof-of-history')"),
    depth: z
      .number()
      .min(1)
      .max(4)
      .optional()
      .describe("How many levels of cross-references to follow (default: 2, max: 4)"),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for results (default: en)"),
  },
  async ({ term, depth, locale }) => {
    const root = getTerm(term, locale);
    if (!root) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Term "${term}" not found.`,
          },
        ],
      };
    }
    const related = getRelated(term, depth ?? 2, locale);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              root: { id: root.id, term: root.term, definition: root.definition },
              depth: depth ?? 2,
              related_count: related.length,
              related: related.map((t) => ({
                id: t.id,
                term: t.term,
                category: t.category,
                definition:
                  t.definition.length > 150
                    ? t.definition.slice(0, 150) + "..."
                    : t.definition,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Tool: glossary_quiz ---
server.tool(
  "glossary_quiz",
  "Generate quiz questions from glossary terms. Great for learning, onboarding, and testing Solana knowledge. Questions adapt to the selected category.",
  {
    category: z
      .string()
      .optional()
      .describe("Category to quiz on (e.g. 'defi'). Omit for mixed categories."),
    count: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .describe("Number of questions (default: 5, max: 20)"),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for questions (default: en)"),
  },
  async ({ category, count, locale }) => {
    const quiz = generateQuiz(category, count ?? 5, locale);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { question_count: quiz.length, questions: quiz },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Tool: glossary_context ---
server.tool(
  "glossary_context",
  "Generate a token-optimized context block from glossary terms for injection into LLM system prompts. Saves tokens by pre-loading Solana knowledge instead of re-explaining concepts.",
  {
    terms: z
      .array(z.string())
      .optional()
      .describe("Specific term IDs to include (e.g. ['pda', 'cpi', 'proof-of-history'])"),
    category: z
      .string()
      .optional()
      .describe("Category to generate context for (e.g. 'defi')"),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for context (default: en)"),
  },
  async ({ terms, category, locale }) => {
    const result = generateContext(terms, category, locale);
    return {
      content: [
        {
          type: "text" as const,
          text: `${result.context}\n\n---\nTerms: ${result.term_count} | Estimated tokens: ~${result.estimated_tokens}`,
        },
      ],
    };
  }
);

// --- Tool: glossary_explain ---
server.tool(
  "glossary_explain",
  "Get a teaching-ready explanation of a Solana term: definition, all related terms with their definitions, and cross-references. Perfect for understanding a concept in full context.",
  {
    term: z.string().describe("Term ID or alias to explain"),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for explanation (default: en)"),
  },
  async ({ term, locale }) => {
    const root = getTerm(term, locale);
    if (!root) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Term "${term}" not found. Try glossary_search to find it.`,
          },
        ],
      };
    }

    const related = (root.related ?? [])
      .map((id) => getTerm(id, locale))
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

    const lines = [
      `# ${root.term}`,
      `**Category:** ${root.category}`,
      root.aliases?.length ? `**Also known as:** ${root.aliases.join(", ")}` : "",
      "",
      root.definition,
      "",
    ];

    if (related.length > 0) {
      lines.push("## Related Concepts", "");
      for (const r of related) {
        lines.push(`### ${r.term}`);
        lines.push(r.definition);
        lines.push("");
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: lines.filter(Boolean).join("\n"),
        },
      ],
    };
  }
);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `Kuka MCP server running — ${allTerms.length} terms loaded across ${getCategories().length} categories`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
