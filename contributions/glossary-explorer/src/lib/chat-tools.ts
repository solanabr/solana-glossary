import "server-only";

import {
  getGlossaryStats,
  getRelatedTermsBFS,
  getTerm,
  getTermsByCategory,
  searchTerms,
} from "./glossary";
import { localizeGlossaryTerm } from "./i18n.server";
import { callMcpTool } from "./mcp";
import type { Category, GlossaryTerm, LocaleCode } from "./types";

interface TextToolResult {
  text: string;
  source: "mcp" | "local";
}

function tryParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function lookupTermTool({
  id,
  locale = "en",
}: {
  id: string;
  locale?: LocaleCode;
}): Promise<GlossaryTerm | { error: string }> {
  try {
    const result = await callMcpTool("lookup_term", { id, locale });
    const parsed = tryParseJson<GlossaryTerm>(result.text);
    if (parsed) return parsed;
    return { error: result.text || `Term "${id}" not found.` };
  } catch {
    const term = getTerm(id);
    if (!term) return { error: `Term "${id}" not found.` };
    return localizeGlossaryTerm(term, locale);
  }
}

export async function searchTermsTool({
  query,
  limit = 5,
  locale = "en",
}: {
  query: string;
  limit?: number;
  locale?: LocaleCode;
}): Promise<TextToolResult> {
  try {
    const result = await callMcpTool("search_terms", { query, limit, locale });
    return { text: result.text, source: "mcp" };
  } catch {
    const results = searchTerms(query)
      .slice(0, limit)
      .map((term) => localizeGlossaryTerm(term, locale));

    if (results.length === 0) {
      return { text: `No terms found matching "${query}".`, source: "local" };
    }

    return {
      text: `Found ${results.length} terms:\n\n${results
        .map(
          (term) =>
            `**${term.term}** (${term.category}): ${term.definition.slice(0, 120)}...`,
        )
        .join("\n\n")}`,
      source: "local",
    };
  }
}

export async function getCategoryTermsTool({
  category,
  locale = "en",
}: {
  category: Category;
  locale?: LocaleCode;
}): Promise<TextToolResult> {
  try {
    const result = await callMcpTool("get_category_terms", {
      category,
      locale,
    });
    return { text: result.text, source: "mcp" };
  } catch {
    const terms = getTermsByCategory(category).map((term) =>
      localizeGlossaryTerm(term, locale),
    );

    return {
      text: `**${category}** (${terms.length} terms):\n\n${terms
        .map(
          (term) => `- **${term.term}**: ${term.definition.slice(0, 100)}...`,
        )
        .join("\n")}`,
      source: "local",
    };
  }
}

export async function getRelatedTermsTool({
  id,
  depth = 1,
  locale = "en",
}: {
  id: string;
  depth?: number;
  locale?: LocaleCode;
}): Promise<TextToolResult> {
  try {
    const result = await callMcpTool("get_related_terms", {
      id,
      depth,
      locale,
    });
    return { text: result.text, source: "mcp" };
  } catch {
    const term = getTerm(id);
    if (!term) {
      return { text: `Term "${id}" not found.`, source: "local" };
    }

    const related = getRelatedTermsBFS(id, depth).map((item) =>
      localizeGlossaryTerm(item, locale),
    );

    if (related.length === 0) {
      return {
        text: `"${localizeGlossaryTerm(term, locale).term}" has no related terms.`,
        source: "local",
      };
    }

    return {
      text: `Related to **${localizeGlossaryTerm(term, locale).term}** (depth ${Math.min(
        Math.max(depth, 1),
        3,
      )}, ${related.length} terms):\n\n${related
        .map(
          (item) =>
            `- **${item.term}** [${item.category}]: ${item.definition.slice(0, 100)}...`,
        )
        .join("\n")}`,
      source: "local",
    };
  }
}

export async function explainConceptTool({
  id,
  locale = "en",
}: {
  id: string;
  locale?: LocaleCode;
}): Promise<TextToolResult> {
  try {
    const result = await callMcpTool("explain_concept", { id, locale });
    return { text: result.text, source: "mcp" };
  } catch {
    const term = getTerm(id);
    if (!term) {
      return { text: `Term "${id}" not found.`, source: "local" };
    }

    const localized = localizeGlossaryTerm(term, locale);
    const related = (term.related ?? [])
      .map((relatedId) => getTerm(relatedId))
      .filter(Boolean)
      .map((item) => localizeGlossaryTerm(item as GlossaryTerm, locale));

    let text = `# ${localized.term}\n\n`;
    text += `**Category:** ${localized.category}\n`;
    if (localized.aliases?.length) {
      text += `**Aliases:** ${localized.aliases.join(", ")}\n`;
    }
    text += `\n**Definition:**\n${localized.definition}\n`;

    if (related.length > 0) {
      text += `\n## Related Concepts\n\n`;
      text += related
        .map((item) => `### ${item.term}\n${item.definition}`)
        .join("\n\n");
    }

    return { text, source: "local" };
  }
}

export async function glossaryStatsTool(): Promise<TextToolResult> {
  try {
    const result = await callMcpTool("glossary_stats", {});
    return { text: result.text, source: "mcp" };
  } catch {
    const stats = getGlossaryStats();
    const lines = [
      "# solexicon Statistics",
      "",
      `**Total terms:** ${stats.totalTerms}`,
      `**Categories:** ${stats.totalCategories}`,
      `**Relationship edges:** ${stats.totalEdges}`,
      `**Terms with related:** ${stats.termsWithRelated}`,
      `**Terms with aliases:** ${stats.termsWithAliases}`,
      `**Available locales:** ${stats.availableLocales.join(", ")}`,
      "",
      "## By Category",
      "",
      ...stats.byCategory.map(
        (entry) => `- **${entry.category}**: ${entry.count} terms`,
      ),
    ];

    return {
      text: lines.join("\n"),
      source: "local",
    };
  }
}
