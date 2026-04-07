import { formatContextForPrompt, getMultiTermContext } from "../glossary/context-builder.js";
import type { ToolDefinition } from "./types.js";

export const multiContextTool: ToolDefinition = {
  name: "glossary_multi_context",
  description: "Build a concise multi-term glossary context bundle for downstream prompts or agent workflows.",
  metadata: {
    kind: "primitive",
    purpose: "Aggregate multiple glossary terms into a concise reusable context bundle.",
    whenToUse: [
      "You already know a cluster of concepts.",
      "You want to prepare grounded context before calling an LLM-backed tool.",
      "You want a prompt-ready context block for reuse across steps.",
    ],
    outputs: ["anchor terms", "related terms", "next steps", "prompt context", "token estimate"],
    constraints: [
      "Returns structured glossary context only.",
      "Does not explain, debug, generate, or plan by itself.",
    ],
    nextTools: [
      "glossary_explain_code",
      "glossary_debug_error",
      "glossary_generate_code",
      "glossary_plan_learning",
    ],
    deterministicSignals: ["resolved term ids", "related ids", "token estimate"],
  },
  inputSchema: {
    type: "object",
    properties: {
      terms: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        description: "Glossary term ids or aliases to anchor the context.",
      },
      locale: { type: "string", enum: ["en", "pt", "es"], default: "en" },
      maxRelated: { type: "number", minimum: 1, maximum: 12, default: 8 },
    },
    required: ["terms"],
    additionalProperties: false,
  },
  async handler(args) {
    const rawTerms = Array.isArray(args.terms) ? args.terms.filter((item): item is string => typeof item === "string") : [];
    const locale =
      args.locale === "pt" || args.locale === "es" || args.locale === "en" ? args.locale : "en";
    const maxRelated =
      typeof args.maxRelated === "number" && Number.isFinite(args.maxRelated)
        ? Math.max(1, Math.min(12, Math.floor(args.maxRelated)))
        : 8;

    const context = getMultiTermContext(rawTerms, locale, { maxRelated });

    return {
      locale,
      anchorTerms: context.anchorTerms.map((term) => ({
        id: term.id,
        term: term.term,
        definition: term.definition,
        category: term.category,
      })),
      relatedTerms: context.relatedTerms.map((term) => ({
        id: term.id,
        term: term.term,
        definition: term.definition,
        category: term.category,
      })),
      nextSteps: context.nextSteps.map((term) => ({
        id: term.id,
        term: term.term,
      })),
      aliases: context.aliases,
      tokenEstimate: context.totalTokenEstimate,
      promptContext: formatContextForPrompt(context),
    };
  },
};
