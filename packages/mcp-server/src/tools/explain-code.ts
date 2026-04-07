import { callGemini } from "../ai/gemini-client.js";
import { buildExplainCodePrompt } from "../ai/prompt-builder.js";
import { parseExplainCodeResponse } from "../ai/response-parser.js";
import { evaluateExplainOutput } from "../evals/output-evals.js";
import { getMultiTermContext } from "../glossary/context-builder.js";
import { detectConceptIdsInCode, detectConceptIdsInText } from "../glossary/concept-detector.js";
import type { ToolDefinition } from "./types.js";
import { mapTermsForOutput, normalizeLocale } from "./helpers.js";

export const explainCodeTool: ToolDefinition = {
  name: "glossary_explain_code",
  description:
    "Explain Solana, Anchor, or Rust code using glossary-grounded context and return a structured breakdown.",
  metadata: {
    kind: "workflow",
    purpose: "Explain Solana, Anchor, or Rust code using glossary-grounded reasoning.",
    whenToUse: [
      "The user provides a code snippet.",
      "The user asks what Solana code is doing.",
      "The user needs concept mapping from code to glossary terms.",
    ],
    outputs: [
      "step-by-step explanation",
      "concept mapping",
      "potential issues",
      "next concepts to learn",
    ],
    constraints: [
      "Uses glossary-backed concepts as the source of truth.",
      "Does not invent missing code behavior when context is incomplete.",
    ],
    nextTools: ["glossary_debug_error", "glossary_generate_code", "glossary_plan_learning"],
    deterministicSignals: ["detected concepts from code", "resolved glossary context", "token estimate"],
  },
  inputSchema: {
    type: "object",
    properties: {
      code: { type: "string", description: "Solana / Anchor / Rust code to explain." },
      locale: { type: "string", enum: ["en", "pt", "es"], default: "en" },
      additionalContext: {
        type: "string",
        description: "Optional developer question or hint about what should be explained.",
      },
    },
    required: ["code"],
    additionalProperties: false,
  },
  async handler(args) {
    const code = typeof args.code === "string" ? args.code.trim() : "";
    if (!code) {
      throw new Error("glossary_explain_code requires non-empty code.");
    }

    const locale = normalizeLocale(args.locale);
    const additionalContext =
      typeof args.additionalContext === "string" ? args.additionalContext.trim() : "";

    const conceptIds = [
      ...detectConceptIdsInCode(code, locale),
      ...detectConceptIdsInText(additionalContext, locale),
    ];
    const fallbackIds = ["account", "program", "instruction"];
    const context = getMultiTermContext(conceptIds.length ? conceptIds : fallbackIds, locale, {
      maxRelated: 8,
      maxNextSteps: 5,
    });

    const prompt = buildExplainCodePrompt(code, context, locale, additionalContext || undefined);
    const rawResponse = await callGemini(prompt);
    const parsed = parseExplainCodeResponse(rawResponse, "glossary_explain_code");
    const evaluation = evaluateExplainOutput(parsed);

    return {
      summary: parsed.summary,
      stepByStep: parsed.stepByStep,
      conceptsUsed: mapTermsForOutput(parsed.conceptsUsed, locale),
      whatItDoes: parsed.whatItDoes,
      potentialIssues: parsed.potentialIssues,
      nextConcepts: mapTermsForOutput(parsed.nextConcepts, locale),
      detectedConcepts: mapTermsForOutput(conceptIds, locale),
      contextStats: {
        anchorTerms: context.anchorTerms.length,
        relatedTerms: context.relatedTerms.length,
        tokenEstimate: context.totalTokenEstimate,
      },
      evaluation,
    };
  },
};
