import { callGemini } from "../ai/gemini-client.js";
import { buildDebugPrompt } from "../ai/prompt-builder.js";
import { parseDebugResponse } from "../ai/response-parser.js";
import { evaluateDebugOutput } from "../evals/output-evals.js";
import { getMultiTermContext } from "../glossary/context-builder.js";
import { detectConceptIdsInCode, detectConceptIdsInText } from "../glossary/concept-detector.js";
import { matchErrorPattern } from "../glossary/error-patterns.js";
import type { ToolDefinition } from "./types.js";
import { mapTermsForOutput, normalizeLocale } from "./helpers.js";

export const debugErrorTool: ToolDefinition = {
  name: "glossary_debug_error",
  description:
    "Debug Solana or Anchor errors with glossary-grounded context, likely causes, fixes, and improved code when possible.",
  metadata: {
    kind: "workflow",
    purpose: "Diagnose Solana and Anchor errors using glossary-grounded context plus deterministic error pattern matching.",
    whenToUse: [
      "The user provides a runtime error message.",
      "The user has failing Solana or Anchor code.",
      "The user wants probable cause and fix guidance.",
    ],
    outputs: [
      "problem statement",
      "root cause explanation",
      "involved glossary concepts",
      "fix guidance",
      "improved code when possible",
    ],
    constraints: [
      "Prefers matched error patterns and glossary context over speculation.",
      "Improved code is guidance, not formal proof of correctness.",
    ],
    nextTools: ["glossary_explain_code", "glossary_generate_code", "glossary_build_feature"],
    deterministicSignals: ["matched error pattern", "detected concepts", "context stats"],
  },
  inputSchema: {
    type: "object",
    properties: {
      error: { type: "string", description: "Error message or failing runtime output." },
      code: { type: "string", description: "Optional failing code snippet." },
      locale: { type: "string", enum: ["en", "pt", "es"], default: "en" },
    },
    required: ["error"],
    additionalProperties: false,
  },
  async handler(args) {
    const error = typeof args.error === "string" ? args.error.trim() : "";
    if (!error) {
      throw new Error("glossary_debug_error requires a non-empty error message.");
    }

    const code = typeof args.code === "string" ? args.code.trim() : "";
    const locale = normalizeLocale(args.locale);

    const pattern = matchErrorPattern(error);
    const conceptIds = [
      ...(pattern?.relatedIds ?? []),
      ...detectConceptIdsInText(error, locale),
      ...detectConceptIdsInCode(code, locale),
    ];

    const fallbackIds = ["transaction", "instruction", "account"];
    const context = getMultiTermContext(conceptIds.length ? conceptIds : fallbackIds, locale, {
      maxRelated: 8,
      maxNextSteps: 5,
    });

    const prompt = buildDebugPrompt(error, context, locale, code || undefined, pattern);
    const rawResponse = await callGemini(prompt);
    const parsed = parseDebugResponse(rawResponse, "glossary_debug_error");
    const evaluation = evaluateDebugOutput(parsed);

    return {
      problem: parsed.problem,
      whyItHappens: parsed.whyItHappens,
      involvedConcepts: mapTermsForOutput(parsed.involvedConcepts, locale),
      fix: parsed.fix,
      improvedCode: parsed.improvedCode,
      preventionTips: parsed.preventionTips,
      matchedPattern: pattern
        ? {
            errorType: pattern.errorType,
            commonCauses: pattern.commonCauses,
            quickFix: pattern.quickFix,
          }
        : null,
      contextStats: {
        anchorTerms: context.anchorTerms.length,
        relatedTerms: context.relatedTerms.length,
        tokenEstimate: context.totalTokenEstimate,
      },
      evaluation,
    };
  },
};
