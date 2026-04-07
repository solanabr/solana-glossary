import { searchGlossary } from "../glossary/loader.js";
import type { ToolDefinition } from "./types.js";

export const searchTermsTool: ToolDefinition = {
  name: "glossary_search",
  description: "Search glossary terms by query string and return the best matching concepts.",
  metadata: {
    kind: "primitive",
    purpose: "Find glossary terms by id, title, alias, or definition text.",
    whenToUse: [
      "You need to resolve an unknown Solana concept name.",
      "You need candidate glossary terms before building context.",
      "You want deterministic lookup instead of LLM reasoning.",
    ],
    outputs: ["matching glossary terms", "definitions", "aliases", "related ids"],
    constraints: [
      "Performs lexical ranking only.",
      "Does not generate explanations or plans.",
    ],
    nextTools: ["glossary_related", "glossary_multi_context"],
    deterministicSignals: ["query string", "term id match", "alias match"],
  },
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search string for glossary terms." },
      locale: { type: "string", enum: ["en", "pt", "es"], default: "en" },
      limit: { type: "number", minimum: 1, maximum: 25, default: 10 },
    },
    required: ["query"],
    additionalProperties: false,
  },
  async handler(args) {
    const query = typeof args.query === "string" ? args.query : "";
    const locale =
      args.locale === "pt" || args.locale === "es" || args.locale === "en" ? args.locale : "en";
    const limit =
      typeof args.limit === "number" && Number.isFinite(args.limit)
        ? Math.max(1, Math.min(25, Math.floor(args.limit)))
        : 10;

    const matches = searchGlossary(query, locale, limit).map((term) => ({
      id: term.id,
      term: term.term,
      definition: term.definition,
      category: term.category,
      aliases: term.aliases ?? [],
      related: term.related ?? [],
    }));

    return {
      query,
      locale,
      count: matches.length,
      matches,
    };
  },
};
