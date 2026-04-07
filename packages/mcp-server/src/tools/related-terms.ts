import { getRelatedTerms, getTerm } from "../glossary/loader.js";
import type { ToolDefinition } from "./types.js";

export const relatedTermsTool: ToolDefinition = {
  name: "glossary_related",
  description: "Return the related terms graph for a glossary term or alias.",
  metadata: {
    kind: "primitive",
    purpose: "Fetch first-order related glossary concepts for a known term.",
    whenToUse: [
      "You already know the anchor term.",
      "You want deterministic concept expansion without using an LLM.",
      "You want to prepare adjacent concepts before calling a workflow tool.",
    ],
    outputs: ["anchor term", "related terms graph"],
    constraints: [
      "Only returns direct relations from the glossary dataset.",
      "Does not synthesize explanations.",
    ],
    nextTools: ["glossary_multi_context", "glossary_explain_code", "glossary_plan_learning"],
    deterministicSignals: ["term id", "alias resolution", "related ids from dataset"],
  },
  inputSchema: {
    type: "object",
    properties: {
      term: { type: "string", description: "Glossary term id, title, or alias." },
      locale: { type: "string", enum: ["en", "pt", "es"], default: "en" },
    },
    required: ["term"],
    additionalProperties: false,
  },
  async handler(args) {
    const termInput = typeof args.term === "string" ? args.term : "";
    const locale =
      args.locale === "pt" || args.locale === "es" || args.locale === "en" ? args.locale : "en";

    const term = getTerm(termInput, locale);
    if (!term) {
      return {
        error: `Unknown glossary term: ${termInput}`,
      };
    }

    const related = getRelatedTerms(term.id, locale).map((item) => ({
      id: item.id,
      term: item.term,
      definition: item.definition,
      category: item.category,
    }));

    return {
      term: {
        id: term.id,
        term: term.term,
        definition: term.definition,
        category: term.category,
      },
      count: related.length,
      related,
    };
  },
};
