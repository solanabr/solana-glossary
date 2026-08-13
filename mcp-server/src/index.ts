#!/usr/bin/env node
/**
 * Solana Glossary MCP Server
 *
 * Exposes 1001 Solana terms to any MCP-compatible AI agent.
 * Built for the Superteam Brazil Solana Glossary Bounty.
 *
 * Tools:
 *  - search_terms       Full-text search
 *  - get_term           Lookup by ID or alias
 *  - get_by_category    Filter by one of 14 categories
 *  - get_related        Related terms graph traversal
 *  - list_categories    Enumerate all categories with counts
 *  - explain_concept    Rich explanation with full context
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  allTerms,
  getCategories,
  getTerm,
  searchTerms,
  getTermsByCategory,
  getRelatedTerms,
  getLocalizedTerm,
  CATEGORY_LABELS,
  type Category,
  type GlossaryTerm,
} from "./glossary.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTerm(t: GlossaryTerm, locale?: string): string {
  const lines: string[] = [
    `**${t.term}**`,
    `Category: ${CATEGORY_LABELS[t.category] ?? t.category}`,
    ``,
    t.definition,
  ];
  if (t.aliases?.length) {
    lines.push(``, `Also known as: ${t.aliases.join(", ")}`);
  }
  if (t.related?.length) {
    lines.push(``, `Related terms: ${t.related.join(", ")}`);
  }
  return lines.join("\n");
}

function formatTermShort(t: GlossaryTerm): string {
  const preview =
    t.definition.length > 120 ? t.definition.slice(0, 120) + "…" : t.definition;
  return `• **${t.term}** (${t.id})\n  ${preview}`;
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "solana-glossary",
  version: "1.0.0",
});

// ── Tool 1: search_terms ────────────────────────────────────────────────────
server.tool(
  "search_terms",
  "Search the Solana glossary with a full-text query. Returns matching terms with definitions. Use this when you need to find terms related to a concept or keyword.",
  {
    query: z.string().min(1).describe("Search query — e.g. 'proof of history', 'AMM', 'PDA'"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe("Maximum number of results (default: 10, max: 50)"),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .default("en")
      .describe("Language for results: en (default), pt (Portuguese), es (Spanish)"),
  },
  async ({ query, limit, locale }) => {
    const results = searchTerms(query).slice(0, limit);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No terms found for query: "${query}"\n\nTry a broader search or use list_categories to browse by topic.`,
          },
        ],
      };
    }

    const lines = [
      `Found ${results.length} term(s) matching "${query}":`,
      "",
      ...results.map(formatTermShort),
      "",
      `Use get_term with any ID above for the full definition.`,
    ];

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ── Tool 2: get_term ────────────────────────────────────────────────────────
server.tool(
  "get_term",
  "Get the complete definition and metadata for a Solana term by its ID or alias. Returns the full definition, category, aliases, and related term IDs.",
  {
    id: z
      .string()
      .min(1)
      .describe(
        "Term ID (kebab-case, e.g. 'proof-of-history') or alias (e.g. 'PoH', 'AMM')"
      ),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .default("en")
      .describe("Language for definition: en (default), pt (Portuguese), es (Spanish)"),
  },
  async ({ id, locale }) => {
    const term =
      locale === "en"
        ? getTerm(id)
        : getLocalizedTerm(id, locale as "pt" | "es");

    if (!term) {
      const suggestions = searchTerms(id).slice(0, 5);
      const hint =
        suggestions.length > 0
          ? `\n\nDid you mean?\n${suggestions.map((s) => `  • ${s.id} — ${s.term}`).join("\n")}`
          : "";
      return {
        content: [
          {
            type: "text",
            text: `Term not found: "${id}"${hint}`,
          },
        ],
        isError: true,
      };
    }

    const locTerm = term as GlossaryTerm & {
      localizedTerm?: string;
      localizedDefinition?: string;
    };

    const lines: string[] = [
      `**${locTerm.localizedTerm ?? locTerm.term}**`,
      `ID: ${locTerm.id}`,
      `Category: ${CATEGORY_LABELS[locTerm.category] ?? locTerm.category} (${locTerm.category})`,
      "",
      locTerm.localizedDefinition ?? locTerm.definition,
    ];

    if (locTerm.aliases?.length) {
      lines.push("", `Aliases: ${locTerm.aliases.join(", ")}`);
    }
    if (locTerm.related?.length) {
      lines.push(
        "",
        `Related terms (${locTerm.related.length}):`,
        ...locTerm.related.map((r) => `  • ${r}`)
      );
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ── Tool 3: get_by_category ─────────────────────────────────────────────────
server.tool(
  "get_by_category",
  "List all Solana glossary terms in a specific category. Returns up to 50 terms with short descriptions. Use list_categories first to see available categories.",
  {
    category: z
      .string()
      .min(1)
      .describe(
        "Category slug, e.g. 'defi', 'core-protocol', 'zk-compression'. Use list_categories to see all options."
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(50)
      .describe("Maximum number of terms to return (default: 50)"),
    offset: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0)
      .describe("Pagination offset (default: 0)"),
  },
  async ({ category, limit, offset }) => {
    const cats = getCategories();
    if (!cats.includes(category as Category)) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown category: "${category}"\n\nAvailable categories:\n${cats.map((c) => `  • ${c} — ${CATEGORY_LABELS[c]}`).join("\n")}`,
          },
        ],
        isError: true,
      };
    }

    const all = getTermsByCategory(category as Category);
    const page = all.slice(offset, offset + limit);
    const hasMore = offset + limit < all.length;

    const lines = [
      `**${CATEGORY_LABELS[category as Category]}** (${category})`,
      `Showing ${page.length} of ${all.length} terms${offset > 0 ? ` (starting at #${offset + 1})` : ""}:`,
      "",
      ...page.map(formatTermShort),
    ];

    if (hasMore) {
      lines.push(
        "",
        `… ${all.length - offset - limit} more terms. Use offset=${offset + limit} to continue.`
      );
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ── Tool 4: get_related ─────────────────────────────────────────────────────
server.tool(
  "get_related",
  "Get terms that are related to a given Solana term. Useful for exploring concept clusters and understanding how Solana components connect to each other.",
  {
    id: z
      .string()
      .min(1)
      .describe("Term ID or alias to find related terms for"),
    depth: z
      .number()
      .int()
      .min(1)
      .max(2)
      .optional()
      .default(1)
      .describe(
        "Graph traversal depth: 1 = direct relations only (default), 2 = include relations-of-relations"
      ),
  },
  async ({ id, depth }) => {
    const term = getTerm(id);
    if (!term) {
      return {
        content: [{ type: "text", text: `Term not found: "${id}"` }],
        isError: true,
      };
    }

    const directRelated = getRelatedTerms(id);

    if (directRelated.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `**${term.term}** has no explicitly related terms in the glossary.\n\nTry search_terms to find conceptually similar terms.`,
          },
        ],
      };
    }

    const lines = [
      `**Related terms for: ${term.term}**`,
      "",
      "Direct relations:",
      ...directRelated.map(formatTermShort),
    ];

    if (depth === 2) {
      const seen = new Set<string>([term.id, ...directRelated.map((t) => t.id)]);
      const secondDegree: GlossaryTerm[] = [];

      for (const related of directRelated) {
        const deeper = getRelatedTerms(related.id).filter((t) => !seen.has(t.id));
        for (const d of deeper) {
          seen.add(d.id);
          secondDegree.push(d);
        }
      }

      if (secondDegree.length > 0) {
        lines.push("", `Second-degree relations (${secondDegree.length}):`, ...secondDegree.map(formatTermShort));
      }
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ── Tool 5: list_categories ─────────────────────────────────────────────────
server.tool(
  "list_categories",
  "List all 14 Solana glossary categories with term counts. Use this to discover what topics are available before using get_by_category.",
  {},
  async () => {
    const cats = getCategories();
    const rows = cats.map((cat) => {
      const count = getTermsByCategory(cat).length;
      return `• **${CATEGORY_LABELS[cat]}** (\`${cat}\`) — ${count} terms`;
    });

    const total = allTerms.length;

    const lines = [
      `# Solana Glossary — ${total} terms across ${cats.length} categories`,
      "",
      ...rows,
      "",
      "Use get_by_category with any category slug to browse its terms.",
    ];

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ── Tool 6: explain_concept ─────────────────────────────────────────────────
server.tool(
  "explain_concept",
  "Get a rich, contextual explanation of a Solana concept. Returns the full definition, related concepts, and how it fits into the Solana ecosystem. Best for learning and onboarding.",
  {
    term: z
      .string()
      .min(1)
      .describe(
        "The concept to explain — can be a term name, ID, alias, or natural language query like 'how does staking work'"
      ),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .default("en")
      .describe("Language for explanation: en (default), pt (Portuguese), es (Spanish)"),
  },
  async ({ term: query, locale }) => {
    // Try exact match first, then fall back to search
    let primary =
      locale === "en" ? getTerm(query) : getLocalizedTerm(query, locale as "pt" | "es");

    if (!primary) {
      const results = searchTerms(query);
      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No concept found matching "${query}".\n\nTry search_terms for broader results, or list_categories to explore topics.`,
            },
          ],
          isError: true,
        };
      }
      primary =
        locale === "en"
          ? results[0]
          : getLocalizedTerm(results[0].id, locale as "pt" | "es") ?? results[0];
    }

    const baseTerm = getTerm((primary as GlossaryTerm).id)!;
    const related = getRelatedTerms(baseTerm.id);
    const locTerm = primary as GlossaryTerm & {
      localizedTerm?: string;
      localizedDefinition?: string;
    };

    const lines: string[] = [
      `# ${locTerm.localizedTerm ?? locTerm.term}`,
      `> *${CATEGORY_LABELS[baseTerm.category]} · ID: \`${baseTerm.id}\`*`,
      "",
      "## Definition",
      "",
      locTerm.localizedDefinition ?? locTerm.definition,
    ];

    if (baseTerm.aliases?.length) {
      lines.push("", `**Also known as:** ${baseTerm.aliases.join(", ")}`);
    }

    if (related.length > 0) {
      lines.push("", "## Related Concepts", "");
      for (const r of related) {
        const locR =
          locale === "en" ? r : (getLocalizedTerm(r.id, locale as "pt" | "es") ?? r);
        const locRelTerm = locR as GlossaryTerm & {
          localizedTerm?: string;
          localizedDefinition?: string;
        };
        const defPreview =
          (locRelTerm.localizedDefinition ?? locRelTerm.definition).slice(0, 100) + "…";
        lines.push(`### ${locRelTerm.localizedTerm ?? locRelTerm.term}`);
        lines.push(defPreview);
        lines.push("");
      }
    }

    // Find other terms in the same category as context
    const sameCategory = getTermsByCategory(baseTerm.category)
      .filter((t) => t.id !== baseTerm.id && !related.some((r) => r.id === t.id))
      .slice(0, 5);

    if (sameCategory.length > 0) {
      lines.push(
        "## More in this category",
        "",
        `*Other **${CATEGORY_LABELS[baseTerm.category]}** terms:*`,
        sameCategory.map((t) => `\`${t.id}\``).join(", ")
      );
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr so it doesn't pollute the MCP stdio protocol
  process.stderr.write(
    `Solana Glossary MCP Server running — ${allTerms.length} terms loaded\n`
  );
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
