import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { z } from "zod";
import {
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
  getRelatedTermsBFS,
  localizeTerm,
  allTerms,
} from "./lib/glossary";
import { CATEGORIES, Category } from "./lib/types";

const app = express();
app.use(express.json());

// Create MCP Server
const server = new McpServer({
  name: "solana-glossary-mcp",
  version: "1.0.0",
});

// ========== TOOL 1: lookup_term ==========
server.tool(
  "lookup_term",
  "Look up a Solana glossary term by ID or alias. Returns the full term with definition, category, related terms, and aliases.",
  {
    id: z
      .string()
      .describe(
        "Term ID (kebab-case) or alias (e.g., 'pda', 'PDA', 'proof-of-history')",
      ),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for definition (default: en)"),
  },
  async ({ id, locale }) => {
    const term = getTerm(id);
    if (!term) {
      return {
        content: [
          {
            type: "text",
            text: `Term "${id}" not found. Try searching with search_terms.`,
          },
        ],
      };
    }
    const localized = localizeTerm(term, locale);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(localized, null, 2),
        },
      ],
    };
  },
);

// ========== TOOL 2: search_terms ==========
server.tool(
  "search_terms",
  "Search the Solana glossary. Searches across term names, definitions, IDs, and aliases.",
  {
    query: z
      .string()
      .describe("Search query (e.g., 'proof', 'automated market')"),
    limit: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .describe("Max results (default: 10)"),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for definitions"),
  },
  async ({ query, limit = 10, locale }) => {
    const results = searchTerms(query).slice(0, limit);
    if (results.length === 0) {
      return {
        content: [
          { type: "text", text: `No terms found matching "${query}".` },
        ],
      };
    }
    const localized = results.map((t) => localizeTerm(t, locale));
    return {
      content: [
        {
          type: "text",
          text: `Found ${results.length} terms:\n\n${localized
            .map(
              (t) =>
                `**${t.term}** (${t.category}): ${t.definition.slice(0, 120)}...`,
            )
            .join("\n\n")}`,
        },
      ],
    };
  },
);

// ========== TOOL 3: get_category_terms ==========
server.tool(
  "get_category_terms",
  "Get all terms in a specific category. 14 categories available.",
  {
    category: z
      .enum(CATEGORIES as [string, ...string[]])
      .describe("Category slug"),
    locale: z
      .enum(["en", "pt", "es"])
      .optional()
      .describe("Language for definitions"),
  },
  async ({ category, locale }) => {
    const terms = getTermsByCategory(category as Category);
    const localized = terms.map((t) => localizeTerm(t, locale));
    return {
      content: [
        {
          type: "text",
          text: `**${category}** (${terms.length} terms):\n\n${localized
            .map((t) => `- **${t.term}**: ${t.definition.slice(0, 100)}...`)
            .join("\n")}`,
        },
      ],
    };
  },
);

// ========== TOOL 4: get_related_terms ==========
server.tool(
  "get_related_terms",
  "Traverse the glossary knowledge graph. Returns related terms at specified depth using BFS with cycle detection.",
  {
    id: z.string().describe("Starting term ID"),
    depth: z
      .number()
      .min(1)
      .max(3)
      .optional()
      .describe("Traversal depth 1-3 (default: 1)"),
    locale: z.enum(["en", "pt", "es"]).optional().describe("Language"),
  },
  async ({ id, depth = 1, locale }) => {
    const term = getTerm(id);
    if (!term) {
      return { content: [{ type: "text", text: `Term "${id}" not found.` }] };
    }
    const related = getRelatedTermsBFS(id, depth);
    if (related.length === 0) {
      return {
        content: [
          { type: "text", text: `"${term.term}" has no related terms.` },
        ],
      };
    }
    const localized = related.map((t) => localizeTerm(t, locale));
    return {
      content: [
        {
          type: "text",
          text: `Related to **${term.term}** (depth ${depth}, ${related.length} terms):\n\n${localized
            .map(
              (t) =>
                `- **${t.term}** [${t.category}]: ${t.definition.slice(0, 100)}...`,
            )
            .join("\n")}`,
        },
      ],
    };
  },
);

// ========== TOOL 5: explain_concept ==========
server.tool(
  "explain_concept",
  "Get a rich explanation of a Solana concept with its definition and all related terms expanded inline. Ideal for building context.",
  {
    id: z.string().describe("Term ID to explain"),
    locale: z.enum(["en", "pt", "es"]).optional().describe("Language"),
  },
  async ({ id, locale }) => {
    const term = getTerm(id);
    if (!term) {
      return { content: [{ type: "text", text: `Term "${id}" not found.` }] };
    }
    const localized = localizeTerm(term, locale);
    const related = (term.related ?? [])
      .map((rid) => getTerm(rid))
      .filter(Boolean)
      .map((t) => localizeTerm(t!, locale));

    let text = `# ${localized.term}\n\n`;
    text += `**Category:** ${localized.category}\n`;
    if (localized.aliases?.length)
      text += `**Aliases:** ${localized.aliases.join(", ")}\n`;
    text += `\n**Definition:**\n${localized.definition}\n`;

    if (related.length > 0) {
      text += `\n## Related Concepts\n\n`;
      for (const r of related) {
        text += `### ${r.term}\n${r.definition}\n\n`;
      }
    }

    return { content: [{ type: "text", text }] };
  },
);

// ========== TOOL 6: glossary_stats ==========
server.tool(
  "glossary_stats",
  "Get statistics about the Solana Glossary: total terms, category breakdown, relationship edges.",
  {},
  async () => {
    const categories = getCategories();
    const stats = categories.map((cat) => {
      const terms = getTermsByCategory(cat);
      return { category: cat, count: terms.length };
    });

    let totalEdges = 0;
    let termsWithRelated = 0;
    let termsWithAliases = 0;
    for (const t of allTerms) {
      if (t.related?.length) {
        totalEdges += t.related.length;
        termsWithRelated++;
      }
      if (t.aliases?.length) termsWithAliases++;
    }

    const lines = [
      `# Solana Glossary Statistics`,
      ``,
      `**Total terms:** ${allTerms.length}`,
      `**Categories:** ${categories.length}`,
      `**Relationship edges:** ${totalEdges}`,
      `**Terms with related:** ${termsWithRelated}`,
      `**Terms with aliases:** ${termsWithAliases}`,
      `**Available locales:** en, pt, es`,
      ``,
      `## By Category`,
      ``,
      ...stats
        .sort((a, b) => b.count - a.count)
        .map((s) => `- **${s.category}**: ${s.count} terms`),
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
);

// ========== HTTP TRANSPORT ==========
app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => {
      transport.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Method not allowed for GET/DELETE/PUT on /mcp
app.get("/mcp", (_req: Request, res: Response) => {
  res
    .status(405)
    .json({ error: "Method not allowed. Use POST for MCP requests." });
});
app.delete("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({
    error: "Method not allowed. Stateless mode — no sessions to delete.",
  });
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    server: "solana-glossary-mcp",
    terms: allTerms.length,
    transport: "streamable-http",
  });
});

// Root info
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Solana Glossary MCP Server",
    version: "1.0.0",
    transport: "Streamable HTTP",
    endpoint: "/mcp",
    terms: allTerms.length,
    tools: [
      "lookup_term",
      "search_terms",
      "get_category_terms",
      "get_related_terms",
      "explain_concept",
      "glossary_stats",
    ],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Solana Glossary MCP Server running on port ${PORT}`);
  console.log(`MCP endpoint: POST http://localhost:${PORT}/mcp`);
  console.log(`Health check: GET http://localhost:${PORT}/health`);
  console.log(`Loaded ${allTerms.length} terms`);
});
