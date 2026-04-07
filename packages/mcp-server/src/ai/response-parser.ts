type JsonRecord = Record<string, unknown>;

function extractJson(rawText: string): string {
  const trimmed = rawText.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i) ?? trimmed.match(/```\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Response does not contain valid JSON.");
}

function parseJsonObject(rawText: string, toolName: string): JsonRecord {
  const json = extractJson(rawText);

  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Parsed response is not an object.");
    }
    return parsed as JsonRecord;
  } catch (error) {
    throw new Error(`${toolName}: failed to parse JSON response: ${(error as Error).message}`);
  }
}

function expectString(value: unknown, field: string, toolName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${toolName}: field "${field}" must be a string.`);
  }
  return value;
}

function expectStringArray(value: unknown, field: string, toolName: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${toolName}: field "${field}" must be an array of strings.`);
  }
  return value as string[];
}

export interface ExplainCodeResponse {
  summary: string;
  stepByStep: string[];
  conceptsUsed: string[];
  whatItDoes: string;
  potentialIssues: string[];
  nextConcepts: string[];
}

export interface DebugResponse {
  problem: string;
  whyItHappens: string;
  involvedConcepts: string[];
  fix: string;
  improvedCode: string | null;
  preventionTips: string[];
}

export interface GenerateResponse {
  code: string;
  language: "rust" | "typescript" | "both";
  explanation: string;
  conceptsUsed: string[];
  implementationNotes: string[];
  requiredDependencies: string[];
  nextSteps: string[];
}

export interface PlannerStep {
  step: number;
  title: string;
  description: string;
  concepts: string[];
  estimatedTime: string;
  resources: string[];
}

export interface PlannerResponse {
  goalBreakdown: string[];
  requiredConcepts: string[];
  plan: PlannerStep[];
  implementationApproach: string;
  recommendedNextTerms: string[];
  estimatedTotalTime: string;
}

export function parseExplainCodeResponse(rawText: string, toolName: string): ExplainCodeResponse {
  const parsed = parseJsonObject(rawText, toolName);
  return {
    summary: expectString(parsed.summary, "summary", toolName),
    stepByStep: expectStringArray(parsed.stepByStep, "stepByStep", toolName),
    conceptsUsed: expectStringArray(parsed.conceptsUsed, "conceptsUsed", toolName),
    whatItDoes: expectString(parsed.whatItDoes, "whatItDoes", toolName),
    potentialIssues: expectStringArray(parsed.potentialIssues, "potentialIssues", toolName),
    nextConcepts: expectStringArray(parsed.nextConcepts, "nextConcepts", toolName),
  };
}

export function parseDebugResponse(rawText: string, toolName: string): DebugResponse {
  const parsed = parseJsonObject(rawText, toolName);
  const improvedCode = parsed.improvedCode;
  if (!(typeof improvedCode === "string" || improvedCode === null)) {
    throw new Error(`${toolName}: field "improvedCode" must be a string or null.`);
  }
  return {
    problem: expectString(parsed.problem, "problem", toolName),
    whyItHappens: expectString(parsed.whyItHappens, "whyItHappens", toolName),
    involvedConcepts: expectStringArray(parsed.involvedConcepts, "involvedConcepts", toolName),
    fix: expectString(parsed.fix, "fix", toolName),
    improvedCode,
    preventionTips: expectStringArray(parsed.preventionTips, "preventionTips", toolName),
  };
}

export function parseGenerateResponse(rawText: string, toolName: string): GenerateResponse {
  const parsed = parseJsonObject(rawText, toolName);
  const language = parsed.language;
  if (language !== "rust" && language !== "typescript" && language !== "both") {
    throw new Error(`${toolName}: field "language" must be rust, typescript, or both.`);
  }
  return {
    code: expectString(parsed.code, "code", toolName),
    language,
    explanation: expectString(parsed.explanation, "explanation", toolName),
    conceptsUsed: expectStringArray(parsed.conceptsUsed, "conceptsUsed", toolName),
    implementationNotes: expectStringArray(
      parsed.implementationNotes,
      "implementationNotes",
      toolName,
    ),
    requiredDependencies: expectStringArray(
      parsed.requiredDependencies,
      "requiredDependencies",
      toolName,
    ),
    nextSteps: expectStringArray(parsed.nextSteps, "nextSteps", toolName),
  };
}

export function parsePlannerResponse(rawText: string, toolName: string): PlannerResponse {
  const parsed = parseJsonObject(rawText, toolName);
  const rawPlan = parsed.plan;
  if (!Array.isArray(rawPlan)) {
    throw new Error(`${toolName}: field "plan" must be an array.`);
  }

  const plan = rawPlan.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${toolName}: plan[${index}] must be an object.`);
    }
    const stepRecord = item as JsonRecord;
    if (typeof stepRecord.step !== "number") {
      throw new Error(`${toolName}: plan[${index}].step must be a number.`);
    }
    return {
      step: stepRecord.step,
      title: expectString(stepRecord.title, `plan[${index}].title`, toolName),
      description: expectString(stepRecord.description, `plan[${index}].description`, toolName),
      concepts: expectStringArray(stepRecord.concepts, `plan[${index}].concepts`, toolName),
      estimatedTime: expectString(
        stepRecord.estimatedTime,
        `plan[${index}].estimatedTime`,
        toolName,
      ),
      resources: expectStringArray(stepRecord.resources, `plan[${index}].resources`, toolName),
    };
  });

  return {
    goalBreakdown: expectStringArray(parsed.goalBreakdown, "goalBreakdown", toolName),
    requiredConcepts: expectStringArray(parsed.requiredConcepts, "requiredConcepts", toolName),
    plan,
    implementationApproach: expectString(
      parsed.implementationApproach,
      "implementationApproach",
      toolName,
    ),
    recommendedNextTerms: expectStringArray(
      parsed.recommendedNextTerms,
      "recommendedNextTerms",
      toolName,
    ),
    estimatedTotalTime: expectString(parsed.estimatedTotalTime, "estimatedTotalTime", toolName),
  };
}
