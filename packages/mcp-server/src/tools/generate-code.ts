import { callGemini } from "../ai/gemini-client.js";
import { buildGeneratePrompt } from "../ai/prompt-builder.js";
import { parseGenerateResponse } from "../ai/response-parser.js";
import { evaluateGenerateOutput } from "../evals/output-evals.js";
import { getMultiTermContext } from "../glossary/context-builder.js";
import { detectConceptIdsInText } from "../glossary/concept-detector.js";
import { classifyDomain, getLearningPathForDomain } from "../glossary/domain-classifier.js";
import type { ToolDefinition } from "./types.js";
import { mapTermsForOutput, normalizeLocale } from "./helpers.js";

export const generateCodeTool: ToolDefinition = {
  name: "glossary_generate_code",
  description:
    "Generate glossary-grounded starter code for Solana requests and explain the implementation choices.",
  metadata: {
    kind: "workflow",
    purpose: "Generate starter Solana code from a natural-language request using glossary-grounded context.",
    whenToUse: [
      "The user asks for starter code.",
      "The user wants an Anchor or Solana implementation template.",
      "The user needs concept-aware code generation instead of raw lookup.",
    ],
    outputs: [
      "generated code",
      "language",
      "concept mapping",
      "implementation notes",
      "dependencies",
      "next steps",
    ],
    constraints: [
      "Uses safe placeholders for program ids and wallets.",
      "Returns starter implementations, not guaranteed production-complete systems.",
    ],
    nextTools: ["glossary_explain_code", "glossary_debug_error", "glossary_build_feature"],
    deterministicSignals: ["detected domain", "detected concepts", "context stats"],
  },
  inputSchema: {
    type: "object",
    properties: {
      request: { type: "string", description: "Natural language request for code generation." },
      locale: { type: "string", enum: ["en", "pt", "es"], default: "en" },
    },
    required: ["request"],
    additionalProperties: false,
  },
  async handler(args) {
    const request = typeof args.request === "string" ? args.request.trim() : "";
    if (!request) {
      throw new Error("glossary_generate_code requires a non-empty request.");
    }

    const locale = normalizeLocale(args.locale);
    const domain = classifyDomain(request);
    const conceptIds = [
      ...getLearningPathForDomain(domain),
      ...detectConceptIdsInText(request, locale),
    ];

    const context = getMultiTermContext(conceptIds, locale, {
      maxRelated: 8,
      maxNextSteps: 5,
    });

    const prompt = buildGeneratePrompt(request, context, domain, locale);
    const rawResponse = await callGemini(prompt);
    const parsed = parseGenerateResponse(rawResponse, "glossary_generate_code");
    const evaluation = evaluateGenerateOutput(parsed);

    return {
      code: parsed.code,
      language: parsed.language,
      explanation: parsed.explanation,
      conceptsUsed: mapTermsForOutput(parsed.conceptsUsed, locale),
      implementationNotes: parsed.implementationNotes,
      requiredDependencies: parsed.requiredDependencies,
      nextSteps: parsed.nextSteps,
      detectedDomain: domain,
      contextStats: {
        anchorTerms: context.anchorTerms.length,
        relatedTerms: context.relatedTerms.length,
        tokenEstimate: context.totalTokenEstimate,
      },
      evaluation,
    };
  },
};
