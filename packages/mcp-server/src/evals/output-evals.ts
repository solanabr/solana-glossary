type EvaluationCheck = {
  name: string;
  pass: boolean;
  detail: string;
};

type EvaluationResult = {
  pass: boolean;
  score: number;
  checks: EvaluationCheck[];
  warnings: string[];
};

function finalize(checks: EvaluationCheck[]): EvaluationResult {
  const passed = checks.filter((check) => check.pass).length;
  const warnings = checks.filter((check) => !check.pass).map((check) => check.detail);

  return {
    pass: passed === checks.length,
    score: checks.length === 0 ? 0 : Number((passed / checks.length).toFixed(2)),
    checks,
    warnings,
  };
}

export function evaluateExplainOutput(result: {
  summary?: string;
  stepByStep?: unknown[];
  conceptsUsed?: unknown[];
  nextConcepts?: unknown[];
}): EvaluationResult {
  return finalize([
    {
      name: "has-summary",
      pass: typeof result.summary === "string" && result.summary.trim().length > 0,
      detail: "Explanation should include a non-empty summary.",
    },
    {
      name: "has-step-by-step",
      pass: Array.isArray(result.stepByStep) && result.stepByStep.length >= 2,
      detail: "Explanation should include at least two step-by-step items.",
    },
    {
      name: "has-concepts",
      pass: Array.isArray(result.conceptsUsed) && result.conceptsUsed.length > 0,
      detail: "Explanation should map to at least one glossary concept.",
    },
    {
      name: "has-next-concepts",
      pass: Array.isArray(result.nextConcepts) && result.nextConcepts.length > 0,
      detail: "Explanation should suggest at least one next concept.",
    },
  ]);
}

export function evaluateDebugOutput(result: {
  problem?: string;
  whyItHappens?: string;
  involvedConcepts?: unknown[];
  fix?: string;
}): EvaluationResult {
  return finalize([
    {
      name: "has-problem",
      pass: typeof result.problem === "string" && result.problem.trim().length > 0,
      detail: "Debug output should describe the problem.",
    },
    {
      name: "has-cause",
      pass: typeof result.whyItHappens === "string" && result.whyItHappens.trim().length > 0,
      detail: "Debug output should explain why the issue happens.",
    },
    {
      name: "has-fix",
      pass: typeof result.fix === "string" && result.fix.trim().length > 0,
      detail: "Debug output should include a fix.",
    },
    {
      name: "has-concepts",
      pass: Array.isArray(result.involvedConcepts) && result.involvedConcepts.length > 0,
      detail: "Debug output should reference at least one glossary concept.",
    },
  ]);
}

export function evaluateGenerateOutput(result: {
  code?: string;
  explanation?: string;
  conceptsUsed?: unknown[];
  nextSteps?: unknown[];
}): EvaluationResult {
  return finalize([
    {
      name: "has-code",
      pass: typeof result.code === "string" && result.code.trim().length > 0,
      detail: "Generated output should include starter code.",
    },
    {
      name: "has-explanation",
      pass: typeof result.explanation === "string" && result.explanation.trim().length > 0,
      detail: "Generated output should explain the code.",
    },
    {
      name: "has-concepts",
      pass: Array.isArray(result.conceptsUsed) && result.conceptsUsed.length > 0,
      detail: "Generated output should reference glossary concepts.",
    },
    {
      name: "has-next-steps",
      pass: Array.isArray(result.nextSteps) && result.nextSteps.length > 0,
      detail: "Generated output should suggest next steps.",
    },
  ]);
}

export function evaluatePlanOutput(result: {
  goalBreakdown?: unknown[];
  requiredConcepts?: unknown[];
  plan?: unknown[];
  recommendedNextTerms?: unknown[];
}): EvaluationResult {
  return finalize([
    {
      name: "has-goal-breakdown",
      pass: Array.isArray(result.goalBreakdown) && result.goalBreakdown.length > 0,
      detail: "Plan output should include a goal breakdown.",
    },
    {
      name: "has-required-concepts",
      pass: Array.isArray(result.requiredConcepts) && result.requiredConcepts.length > 0,
      detail: "Plan output should include required concepts.",
    },
    {
      name: "has-plan-steps",
      pass: Array.isArray(result.plan) && result.plan.length > 0,
      detail: "Plan output should include at least one plan step.",
    },
    {
      name: "has-next-terms",
      pass: Array.isArray(result.recommendedNextTerms) && result.recommendedNextTerms.length > 0,
      detail: "Plan output should recommend next glossary terms.",
    },
  ]);
}

export function evaluateBuildFeatureOutput(result: {
  workflow?: unknown[];
  plan?: unknown;
  context?: unknown;
  generation?: unknown;
  explanation?: unknown;
}): EvaluationResult {
  return finalize([
    {
      name: "has-workflow",
      pass: Array.isArray(result.workflow) && result.workflow.length >= 4,
      detail: "Composed workflow should disclose the chained tools.",
    },
    {
      name: "has-plan",
      pass: !!result.plan && typeof result.plan === "object",
      detail: "Composed output should include the planning result.",
    },
    {
      name: "has-context",
      pass: !!result.context && typeof result.context === "object",
      detail: "Composed output should include the context bundle.",
    },
    {
      name: "has-generation-and-explanation",
      pass:
        !!result.generation &&
        typeof result.generation === "object" &&
        !!result.explanation &&
        typeof result.explanation === "object",
      detail: "Composed output should include generated code and explanation.",
    },
  ]);
}
