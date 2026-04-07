import type { ToolDefinition } from "./types.js";
import { evaluateBuildFeatureOutput } from "../evals/output-evals.js";
import { explainCodeTool } from "./explain-code.js";
import { generateCodeTool } from "./generate-code.js";
import { multiContextTool } from "./multi-context.js";
import { planLearningTool } from "./plan-learning.js";

export const buildFeatureTool: ToolDefinition = {
  name: "glossary_build_feature",
  description:
    "Compose planning, glossary context, code generation, and explanation into a single glossary-grounded feature-building workflow.",
  metadata: {
    kind: "composed",
    purpose:
      "Run a higher-level Solana feature workflow that plans the build, assembles context, generates starter code, and explains the implementation.",
    whenToUse: [
      "The user wants to build a feature, not just understand a concept.",
      "The user needs an end-to-end workflow from idea to starter implementation.",
      "The agent wants one composed tool instead of manually chaining plan, context, generate, and explain.",
    ],
    outputs: [
      "planning result",
      "context bundle",
      "generated starter code",
      "explanation of generated code",
      "suggested follow-up tools",
    ],
    constraints: [
      "Composes existing tools and inherits their constraints.",
      "Generated output is a starter workflow, not a production-ready application.",
    ],
    nextTools: ["glossary_debug_error", "glossary_explain_code", "glossary_generate_code"],
    deterministicSignals: [
      "planning concepts",
      "context bundle terms",
      "generated code explanation concepts",
    ],
  },
  inputSchema: {
    type: "object",
    properties: {
      goal: { type: "string", description: "Feature or product goal to build." },
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
      throw new Error("glossary_build_feature requires a non-empty goal.");
    }

    const currentLevel =
      args.currentLevel === "beginner" ||
      args.currentLevel === "intermediate" ||
      args.currentLevel === "advanced"
        ? args.currentLevel
        : "intermediate";
    const locale = args.locale === "pt" || args.locale === "es" || args.locale === "en" ? args.locale : "en";

    const plan = await planLearningTool.handler({
      goal,
      currentLevel,
      locale,
    });

    const requiredConceptIds = Array.isArray(plan.requiredConcepts)
      ? plan.requiredConcepts
          .map((item) =>
            item && typeof item === "object" && typeof item.id === "string" ? item.id : null,
          )
          .filter((item): item is string => Boolean(item))
      : [];

    const context = await multiContextTool.handler({
      terms: requiredConceptIds.length ? requiredConceptIds.slice(0, 6) : ["account", "instruction", "program"],
      locale,
      maxRelated: 8,
    });

    const generation = await generateCodeTool.handler({
      request: goal,
      locale,
    });

    const explain = await explainCodeTool.handler({
      code: typeof generation.code === "string" ? generation.code : "",
      locale,
      additionalContext: `Explain the generated starter implementation for this goal: ${goal}`,
    });

    const output = {
      goal,
      currentLevel,
      workflow: ["glossary_plan_learning", "glossary_multi_context", "glossary_generate_code", "glossary_explain_code"],
      plan,
      context,
      generation,
      explanation: explain,
      suggestedNextTools: ["glossary_debug_error", "glossary_explain_code", "glossary_generate_code"],
    };

    return {
      ...output,
      evaluation: evaluateBuildFeatureOutput(output),
    };
  },
};
