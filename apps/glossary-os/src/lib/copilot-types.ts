export type CopilotMode = "ask" | "explain" | "debug" | "generate" | "plan";

export type CopilotLinkedTerm = {
  id: string;
  label: string;
  aliases: string[];
};

export type CopilotLinkedReason = {
  id: string;
  label: string;
  reason: string;
};

export type CopilotAnswer = {
  explanation: string;
  keyConcepts: CopilotLinkedReason[];
  suggestedNextTerms: CopilotLinkedReason[];
  highlightTerms: CopilotLinkedTerm[];
  caveat: string;
  mode: "term" | "code";
};
