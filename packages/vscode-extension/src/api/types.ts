export type ExtensionLocale = "en" | "pt" | "es";

export type GlossaryLiteTerm = {
  id: string;
  term: string;
  definition: string;
  category: string;
  aliases?: string[];
  related?: string[];
};

export type CopilotLinkedReason = {
  id: string;
  label: string;
  reason: string;
};

export type CopilotLinkedTerm = {
  id: string;
  label: string;
  aliases: string[];
};

export type CopilotAnswer = {
  explanation: string;
  keyConcepts: CopilotLinkedReason[];
  suggestedNextTerms: CopilotLinkedReason[];
  highlightTerms: CopilotLinkedTerm[];
  caveat: string;
  mode: "term" | "code";
};

export type CopilotApiResponse = {
  answer: CopilotAnswer;
};

export type ExplainCodeResult = CopilotAnswer & {
  sourceCode: string;
  title: string;
};

export type DebugErrorResult = CopilotAnswer & {
  error: string;
  sourceCode?: string;
  title: string;
};

export type GenerateCodeResult = CopilotAnswer & {
  request: string;
  extractedCode: string;
  title: string;
};

export type PlanLearningResult = CopilotAnswer & {
  goal: string;
  title: string;
};
