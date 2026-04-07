import type { CopilotAnswer, CopilotLinkedReason } from "@/lib/copilot-types";
import type { Locale } from "@/lib/locales";

import { detectAgentIssues, type AgentIssue } from "./agent-issues";

export type AgentStepType = "plan" | "generate" | "explain" | "debug" | "learn";
export type AgentStepStatus = "idle" | "running" | "done" | "error";

export type AgentStep = {
  type: AgentStepType;
  status: AgentStepStatus;
  label: string;
  error?: string;
  result?: unknown;
};

export type AgentResult = {
  goal: string;
  anchorTermId: string;
  planAnswer: CopilotAnswer | null;
  generateAnswer: CopilotAnswer | null;
  explainAnswer: CopilotAnswer | null;
  generatedCode: string;
  issues: AgentIssue[];
  nextTerms: CopilotLinkedReason[];
  allSteps: AgentStep[];
};

export type RunAgentModeArgs = {
  goal: string;
  locale: Locale;
  termId: string;
  onStep?: (step: AgentStep) => void;
};

type CopilotApiPayload = {
  answer?: CopilotAnswer;
  error?: string;
};

function emitStep(step: AgentStep, onStep?: (step: AgentStep) => void) {
  onStep?.(step);
}

export function extractCodeBlock(text: string): string {
  const fenced = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return fenced?.[1]?.trim() ?? "";
}

function dedupeNextTerms(items: CopilotLinkedReason[]): CopilotLinkedReason[] {
  const seen = new Set<string>();
  const result: CopilotLinkedReason[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result;
}

async function callCopilotStep(args: {
  locale: Locale;
  termId: string;
  question: string;
  codeSnippet?: string;
}): Promise<CopilotAnswer> {
  const response = await fetch("/api/copilot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      locale: args.locale,
      termSlug: args.termId,
      question: args.question,
      codeSnippet: args.codeSnippet?.trim() || undefined,
    }),
  });

  const payload = (await response.json()) as CopilotApiPayload;

  if (!response.ok || !payload.answer) {
    throw new Error(payload.error || "Copilot request failed.");
  }

  return payload.answer;
}

function buildPlanQuestion(goal: string): string {
  return [
    "Create a practical Solana build and learning plan for this goal.",
    "Break the work into steps, explain the key concepts involved, and suggest the most important next glossary terms.",
    "",
    "Goal:",
    goal.trim(),
  ].join("\n");
}

function buildGenerateQuestion(goal: string): string {
  return [
    "Generate a starter Solana implementation for this goal.",
    "Include a fenced code block.",
    "Use placeholders like REPLACE_WITH_YOUR_PROGRAM_ID when exact values are unknown.",
    "Explain assumptions clearly instead of inventing missing details.",
    "",
    "Goal:",
    goal.trim(),
  ].join("\n");
}

function buildExplainQuestion(goal: string, generatedCode: string): string {
  return [
    "Explain this generated Solana code step by step.",
    "Map the important primitives back to glossary concepts.",
    "Call out likely risks only when they are grounded in the code.",
    "",
    "Original goal:",
    goal.trim(),
    "",
    "Generated code:",
    "```",
    generatedCode.trim(),
    "```",
  ].join("\n");
}

export async function runAgentMode(args: RunAgentModeArgs): Promise<AgentResult> {
  const steps: AgentStep[] = [];

  const pushStep = (step: AgentStep) => {
    const existingIndex = steps.findIndex((item) => item.type === step.type);
    if (existingIndex >= 0) {
      steps[existingIndex] = step;
    } else {
      steps.push(step);
    }

    emitStep(step, args.onStep);
  };

  let planAnswer: CopilotAnswer | null = null;
  let generateAnswer: CopilotAnswer | null = null;
  let explainAnswer: CopilotAnswer | null = null;
  let generatedCode = "";
  let issues: AgentIssue[] = [];
  let nextTerms: CopilotLinkedReason[] = [];

  try {
    pushStep({
      type: "plan",
      status: "running",
      label: "Breaking the goal into a practical Solana plan...",
    });

    planAnswer = await callCopilotStep({
      locale: args.locale,
      termId: args.termId,
      question: buildPlanQuestion(args.goal),
    });

    pushStep({
      type: "plan",
      status: "done",
      label: "Goal broken down",
      result: planAnswer,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Planning failed.";
    pushStep({
      type: "plan",
      status: "error",
      label: "Planning failed",
      error: message,
    });
    throw error;
  }

  try {
    pushStep({
      type: "generate",
      status: "running",
      label: "Generating starter code...",
    });

    generateAnswer = await callCopilotStep({
      locale: args.locale,
      termId: args.termId,
      question: buildGenerateQuestion(args.goal),
    });

    generatedCode = extractCodeBlock(generateAnswer.explanation);

    pushStep({
      type: "generate",
      status: "done",
      label: generatedCode ? "Starter code generated" : "Generated guidance returned",
      result: generateAnswer,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    pushStep({
      type: "generate",
      status: "error",
      label: "Generation failed",
      error: message,
    });
    throw error;
  }

  if (generatedCode) {
    try {
      pushStep({
        type: "explain",
        status: "running",
        label: "Explaining the generated code...",
      });

      explainAnswer = await callCopilotStep({
        locale: args.locale,
        termId: args.termId,
        question: buildExplainQuestion(args.goal, generatedCode),
        codeSnippet: generatedCode,
      });

      pushStep({
        type: "explain",
        status: "done",
        label: "Generated code explained",
        result: explainAnswer,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Explanation failed.";
      pushStep({
        type: "explain",
        status: "error",
        label: "Explanation failed",
        error: message,
      });
    }
  } else {
    pushStep({
      type: "explain",
      status: "done",
      label: "Skipped explanation because no code block was returned",
      result: null,
    });
  }

  pushStep({
    type: "debug",
    status: "running",
    label: "Checking for common issues...",
  });

  issues = generatedCode ? detectAgentIssues(generatedCode) : [];

  pushStep({
    type: "debug",
    status: "done",
    label: issues.length > 0 ? "Potential issues found" : "No obvious issues found",
    result: issues,
  });

  pushStep({
    type: "learn",
    status: "running",
    label: "Collecting the next concepts to learn...",
  });

  nextTerms = dedupeNextTerms([
    ...(planAnswer?.suggestedNextTerms ?? []),
    ...(generateAnswer?.suggestedNextTerms ?? []),
    ...(explainAnswer?.suggestedNextTerms ?? []),
  ]).slice(0, 5);

  pushStep({
    type: "learn",
    status: "done",
    label: "Next concepts identified",
    result: nextTerms,
  });

  return {
    goal: args.goal,
    anchorTermId: args.termId,
    planAnswer,
    generateAnswer,
    explainAnswer,
    generatedCode,
    issues,
    nextTerms,
    allSteps: [...steps],
  };
}
