import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  allTerms,
  getTerm,
  searchTerms,
  getTermsByCategory,
  getTermsByDepth,
  getTermsByMaxDepth,
  getTermsByTag,
  getAllTags,
  getCategories,
} from "../src/index.js";
import { getLocalizedTerms } from "../src/i18n.js";
import type { GlossaryTerm, Category, Depth } from "../src/types.js";

// ── Helpers ──────────────────────────────────────────────────

function localize(locale?: string): Map<string, GlossaryTerm> | null {
  if (!locale || locale === "en") return null;
  const terms = getLocalizedTerms(locale);
  return new Map(terms.map((t) => [t.id, t]));
}

function applyLocale(
  term: GlossaryTerm,
  localeMap: Map<string, GlossaryTerm> | null,
): GlossaryTerm {
  if (!localeMap) return term;
  return localeMap.get(term.id) ?? term;
}

function formatTerm(t: GlossaryTerm): string {
  return [
    `**${t.term}** (\`${t.id}\`)`,
    `Category: ${t.category} | Depth: ${t.depth}`,
    t.aliases?.length ? `Aliases: ${t.aliases.join(", ")}` : null,
    t.tags?.length ? `Tags: ${t.tags.join(", ")}` : null,
    "",
    t.definition,
    "",
    t.related?.length ? `Related: ${t.related.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatCompact(t: GlossaryTerm): string {
  return `${t.term}: ${t.definition}`;
}

// ── Tool Registration ────────────────────────────────────────

export function registerTools(server: McpServer): void {
  // 1. lookup_term
  server.tool(
    "lookup_term",
    "Look up a Solana glossary term by ID or alias",
    {
      id_or_alias: z
        .string()
        .describe("Term ID or alias (e.g. 'pda', 'PoH', 'AMM')"),
      locale: z
        .enum(["en", "pt", "es"])
        .optional()
        .describe("Language (default: en)"),
    },
    ({ id_or_alias, locale }) => {
      const term = getTerm(id_or_alias);
      if (!term) {
        const suggestions = searchTerms(id_or_alias).slice(0, 3);
        const hint = suggestions.length
          ? `\nDid you mean: ${suggestions.map((s) => s.id).join(", ")}?`
          : "";
        return {
          content: [
            { type: "text", text: `Term "${id_or_alias}" not found.${hint}` },
          ],
        };
      }
      const localeMap = localize(locale);
      return {
        content: [
          { type: "text", text: formatTerm(applyLocale(term, localeMap)) },
        ],
      };
    },
  );

  // 2. search_glossary
  server.tool(
    "search_glossary",
    "Full-text search across term names, definitions, aliases, and IDs",
    {
      query: z.string().describe("Search query"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Max results (default: 10)"),
      locale: z
        .enum(["en", "pt", "es"])
        .optional()
        .describe("Language (default: en)"),
    },
    ({ query, limit, locale }) => {
      const results = searchTerms(query).slice(0, limit ?? 10);
      const localeMap = localize(locale);
      const text = results.length
        ? results
            .map((t) => formatCompact(applyLocale(t, localeMap)))
            .join("\n\n")
        : `No results for "${query}".`;
      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} result(s):\n\n${text}`,
          },
        ],
      };
    },
  );

  // 3. list_categories
  server.tool(
    "list_categories",
    "List all glossary categories with term counts",
    {},
    () => {
      const cats = getCategories();
      const lines = cats.map((c) => {
        const count = getTermsByCategory(c).length;
        return `${c}: ${count} terms`;
      });
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  // 4. browse_category
  server.tool(
    "browse_category",
    "List all terms in a specific category",
    {
      category: z
        .string()
        .describe("Category ID (e.g. 'defi', 'core-protocol')"),
      locale: z
        .enum(["en", "pt", "es"])
        .optional()
        .describe("Language (default: en)"),
    },
    ({ category, locale }) => {
      const valid = getCategories();
      if (!valid.includes(category as Category)) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid category "${category}". Valid: ${valid.join(", ")}`,
            },
          ],
        };
      }
      const terms = getTermsByCategory(category as Category);
      const localeMap = localize(locale);
      const lines = terms.map((t) => {
        const lt = applyLocale(t, localeMap);
        return `- **${lt.term}** (\`${lt.id}\`) [depth ${lt.depth}]`;
      });
      return {
        content: [
          {
            type: "text",
            text: `**${category}** — ${terms.length} terms:\n\n${lines.join("\n")}`,
          },
        ],
      };
    },
  );

  // 5. filter_by_depth
  server.tool(
    "filter_by_depth",
    "Filter terms by knowledge depth level (1=surface to 5=expert)",
    {
      depth: z.number().int().min(1).max(5).describe("Depth level (1-5)"),
      max: z
        .boolean()
        .optional()
        .describe("If true, return all terms at or below this depth"),
      locale: z
        .enum(["en", "pt", "es"])
        .optional()
        .describe("Language (default: en)"),
    },
    ({ depth, max, locale }) => {
      const terms = max
        ? getTermsByMaxDepth(depth as Depth)
        : getTermsByDepth(depth as Depth);
      const localeMap = localize(locale);
      const lines = terms.map((t) => formatCompact(applyLocale(t, localeMap)));
      return {
        content: [
          {
            type: "text",
            text: `${terms.length} terms at depth ${max ? `≤${depth}` : `=${depth}`}:\n\n${lines.join("\n\n")}`,
          },
        ],
      };
    },
  );

  // 6. filter_by_tag
  server.tool(
    "filter_by_tag",
    "Get all terms with a specific tag (e.g. 'token-2022', 'jito', 'vulnerability')",
    {
      tag: z.string().describe("Tag name"),
      locale: z
        .enum(["en", "pt", "es"])
        .optional()
        .describe("Language (default: en)"),
    },
    ({ tag, locale }) => {
      const terms = getTermsByTag(tag);
      if (!terms.length) {
        const available = getAllTags();
        return {
          content: [
            {
              type: "text",
              text: `No terms with tag "${tag}". Available tags: ${available.join(", ")}`,
            },
          ],
        };
      }
      const localeMap = localize(locale);
      const lines = terms.map((t) => formatCompact(applyLocale(t, localeMap)));
      return {
        content: [
          {
            type: "text",
            text: `**${tag}** — ${terms.length} terms:\n\n${lines.join("\n\n")}`,
          },
        ],
      };
    },
  );

  // 7. list_tags
  server.tool(
    "list_tags",
    "List all available tags with term counts",
    {},
    () => {
      const tags = getAllTags();
      const lines = tags.map(
        (tag) => `${tag}: ${getTermsByTag(tag).length} terms`,
      );
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  // 8. get_related
  server.tool(
    "get_related",
    "Traverse the knowledge graph from a term, following cross-references",
    {
      id: z.string().describe("Starting term ID"),
      depth: z
        .number()
        .int()
        .min(1)
        .max(3)
        .optional()
        .describe("Traversal depth (default: 1, max: 3)"),
      locale: z
        .enum(["en", "pt", "es"])
        .optional()
        .describe("Language (default: en)"),
    },
    ({ id, depth: maxDepth, locale }) => {
      const root = getTerm(id);
      if (!root) {
        return { content: [{ type: "text", text: `Term "${id}" not found.` }] };
      }

      const limit = maxDepth ?? 1;
      const visited = new Set<string>();
      const queue: Array<{ id: string; level: number }> = [
        { id: root.id, level: 0 },
      ];
      const results: Array<{ term: GlossaryTerm; level: number }> = [];
      const localeMap = localize(locale);

      while (queue.length > 0) {
        const item = queue.shift()!;
        if (visited.has(item.id)) continue;
        visited.add(item.id);

        const term = getTerm(item.id);
        if (!term) continue;
        results.push({ term, level: item.level });

        if (item.level < limit) {
          for (const ref of term.related ?? []) {
            if (!visited.has(ref)) {
              queue.push({ id: ref, level: item.level + 1 });
            }
          }
        }
      }

      const lines = results.map(({ term, level }) => {
        const lt = applyLocale(term, localeMap);
        const indent = "  ".repeat(level);
        return `${indent}${"→ ".repeat(Math.min(level, 1))}**${lt.term}** (\`${lt.id}\`): ${lt.definition.slice(0, 120)}...`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Knowledge graph from "${root.term}" (depth ${limit}):\n\n${lines.join("\n")}`,
          },
        ],
      };
    },
  );

  // 9. glossary_stats
  server.tool(
    "glossary_stats",
    "Get statistics about the glossary (term count, categories, depths, tags)",
    {},
    () => {
      const depthDist: Record<number, number> = {};
      const catDist: Record<string, number> = {};
      const tagDist: Record<string, number> = {};

      for (const t of allTerms) {
        depthDist[t.depth] = (depthDist[t.depth] ?? 0) + 1;
        catDist[t.category] = (catDist[t.category] ?? 0) + 1;
        for (const tag of t.tags ?? []) {
          tagDist[tag] = (tagDist[tag] ?? 0) + 1;
        }
      }

      const text = [
        `Total terms: ${allTerms.length}`,
        `Categories: ${Object.keys(catDist).length}`,
        `Tags: ${Object.keys(tagDist).length}`,
        `Languages: en, pt, es`,
        "",
        "Depth distribution:",
        ...Object.entries(depthDist)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([d, n]) => `  ${d}: ${n} terms`),
        "",
        "Top categories:",
        ...Object.entries(catDist)
          .sort(([, a], [, b]) => b - a)
          .map(([c, n]) => `  ${c}: ${n}`),
        "",
        "Tags:",
        ...Object.entries(tagDist)
          .sort(([, a], [, b]) => b - a)
          .map(([t, n]) => `  ${t}: ${n}`),
      ].join("\n");

      return { content: [{ type: "text", text }] };
    },
  );

  // 10. inject_context
  server.tool(
    "inject_context",
    "Generate a token-optimized context block from specific terms for LLM prompts",
    {
      ids: z.array(z.string()).min(1).max(50).describe("Term IDs to include"),
      format: z
        .enum(["compact", "full"])
        .optional()
        .describe("Output format (default: compact)"),
      locale: z
        .enum(["en", "pt", "es"])
        .optional()
        .describe("Language (default: en)"),
    },
    ({ ids, format, locale }) => {
      const localeMap = localize(locale);
      const found: GlossaryTerm[] = [];
      const notFound: string[] = [];

      for (const id of ids) {
        const term = getTerm(id);
        if (term) found.push(applyLocale(term, localeMap));
        else notFound.push(id);
      }

      const fmt = format ?? "compact";
      const block = found
        .map((t) => (fmt === "full" ? formatTerm(t) : formatCompact(t)))
        .join("\n\n");
      const chars = block.length;
      const estimatedTokens = Math.ceil(chars / 4);

      const parts = [
        `--- Solana Glossary Context (${found.length} terms, ~${estimatedTokens} tokens) ---`,
        block,
        "--- End Glossary Context ---",
      ];

      if (notFound.length) {
        parts.push(`\nNot found: ${notFound.join(", ")}`);
      }

      return { content: [{ type: "text", text: parts.join("\n") }] };
    },
  );
}
