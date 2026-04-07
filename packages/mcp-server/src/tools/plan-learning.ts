import { callGemini } from "../ai/gemini-client.js";
import { buildPlannerPrompt } from "../ai/prompt-builder.js";
import { parsePlannerResponse } from "../ai/response-parser.js";
import { evaluatePlanOutput } from "../evals/output-evals.js";
import { getMultiTermContext } from "../glossary/context-builder.js";
import { detectConceptIdsInText } from "../glossary/concept-detector.js";
import { classifyDomain, getLearningPathForDomain } from "../glossary/domain-classifier.js";
import type { ToolDefinition } from "./types.js";
import { mapTermsForOutput, normalizeLocale } from "./helpers.js";

type Level = "beginner" | "intermediate" | "advanced";

function normalizeLevel(value: unknown): Level {
  return value === "beginner" || value === "advanced" || value === "intermediate"
    ? value
    : "intermediate";
}

export const planLearningTool: ToolDefinition = {
  name: "glossary_plan_learning",
  description:
    "Create a glossary-grounded build or learning plan for a Solana goal, ordered by concepts and implementation steps.",
  metadata: {
    kind: "workflow",
    purpose: "Turn a Solana build goal into a glossary-grounded concept roadmap and execution plan.",
    whenToUse: [
      "The user has a product or learning goal.",
      "The user needs sequencing of Solana concepts.",
      "The user wants a plan before asking for implementation code.",
    ],
    outputs: [
      "goal breakdown",
      "required concepts",
      "step-by-step plan",
      "implementation approach",
      "recommended next terms",
    ],
    constraints: [
      "Uses detected domain plus glossary context for sequencing.",
      "Produces plans, not final implementation guarantees.",
    ],
    nextTools: ["glossary_generate_code", "glossary_explain_code", "glossary_build_feature"],
    deterministicSignals: ["detected domain", "learning path seeds", "context stats"],
  },
  inputSchema: {
    type: "object",
    properties: {
      goal: { type: "string", description: "Developer goal or product goal." },
      currentLevel: {
        type: "string",
        enum: ["beginner", "intermediate", "advanced"],
        default: "intermediate",
      },
      locale: { type: "string", enum: ["en", "pt", "es"], default: "en" },
    },
    required: ["goal"],
    additionalProperties: false,
  },
  async handler(args) {
    const goal = typeof args.goal === "string" ? args.goal.trim() : "";
    if (!goal) {
      throw new Error("glossary_plan_learning requires a non-empty goal.");
    }

    const locale = normalizeLocale(args.locale);
    const currentLevel = normalizeLevel(args.currentLevel);
    const domain = classifyDomain(goal);
    const conceptIds = [
      ...getLearningPathForDomain(domain),
      ...detectConceptIdsInText(goal, locale),
    ];

    const context = getMultiTermContext(conceptIds, locale, {
      maxRelated: 8,
      maxNextSteps: 5,
    });

    const prompt = buildPlannerPrompt(goal, context, domain, currentLevel, locale);
    const rawResponse = await callGemini(prompt);
    const parsed = parsePlannerResponse(rawResponse, "glossary_plan_learning");
    const evaluation = evaluatePlanOutput(parsed);

    return {
      goalBreakdown: parsed.goalBreakdown,
      requiredConcepts: mapTermsForOutput(parsed.requiredConcepts, locale),
      plan: parsed.plan.map((step) => ({
        ...step,
        concepts: mapTermsForOutput(step.concepts, locale),
      })),
      implementationApproach: parsed.implementationApproach,
      recommendedNextTerms: mapTermsForOutput(parsed.recommendedNextTerms, locale),
      estimatedTotalTime: parsed.estimatedTotalTime,
      detectedDomain: domain,
      currentLevel,
      contextStats: {
        anchorTerms: context.anchorTerms.length,
        relatedTerms: context.relatedTerms.length,
        tokenEstimate: context.totalTokenEstimate,
      },
      evaluation,
    };
  },
};
