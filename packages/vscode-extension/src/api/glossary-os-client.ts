import type {
  CopilotApiResponse,
  DebugErrorResult,
  ExplainCodeResult,
  ExtensionLocale,
  GenerateCodeResult,
  PlanLearningResult,
} from "./types";
import { getSettings } from "../config/settings";
import { detectAnchorTermFromText } from "./local-glossary";

function extractCodeBlock(text: string): string {
  const fenced = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return fenced?.[1]?.trim() ?? "";
}

export class GlossaryOSClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = getSettings().apiBaseUrl.replace(/\/$/, "");
  }

  async explainCode(params: {
    code: string;
    locale: ExtensionLocale;
    filename?: string;
  }): Promise<ExplainCodeResult> {
    const anchor = detectAnchorTermFromText(params.code, "anchor");
    const answer = await this.askCopilot({
      termSlug: anchor.id,
      locale: params.locale,
      question: `Explain this Solana or Anchor code step by step. Focus on what the code does, the glossary concepts involved, and what a developer should learn next.${params.filename ? ` Filename: ${params.filename}.` : ""}`,
      codeSnippet: params.code,
    });

    return {
      ...answer,
      sourceCode: params.code,
      title: `Explain ${params.filename ?? anchor.term}`,
    };
  }

  async debugError(params: {
    error: string;
    code?: string;
    locale: ExtensionLocale;
    anchorHint?: string;
  }): Promise<DebugErrorResult> {
    const source = `${params.error}\n${params.code ?? ""}`;
    const anchor = detectAnchorTermFromText(source, params.anchorHint ?? "account");
    const answer = await this.askCopilot({
      termSlug: anchor.id,
      locale: params.locale,
      question: `Debug this Solana or Anchor issue. Explain the likely root cause, the concepts involved, and the safest next fix.\n\nError:\n${params.error}`,
      codeSnippet: params.code,
    });

    return {
      ...answer,
      error: params.error,
      sourceCode: params.code,
      title: `Debug ${anchor.term}`,
    };
  }

  async generateCode(params: {
    request: string;
    locale: ExtensionLocale;
  }): Promise<GenerateCodeResult> {
    const anchor = detectAnchorTermFromText(params.request, "anchor");
    const answer = await this.askCopilot({
      termSlug: anchor.id,
      locale: params.locale,
      question: `Generate a starter Solana implementation for this request. Include a fenced code block when possible, mention assumptions, and use placeholders like REPLACE_WITH_YOUR_PROGRAM_ID when the exact value is unknown.\n\nRequest:\n${params.request}`,
    });

    return {
      ...answer,
      request: params.request,
      extractedCode: extractCodeBlock(answer.explanation),
      title: `Generate from ${anchor.term}`,
    };
  }

  async planLearning(params: {
    goal: string;
    locale: ExtensionLocale;
  }): Promise<PlanLearningResult> {
    const anchor = detectAnchorTermFromText(params.goal, "transaction");
    const answer = await this.askCopilot({
      termSlug: anchor.id,
      locale: params.locale,
      question: `Create a practical learning and build plan for this Solana goal. Break it into steps, mention the most important glossary concepts, and explain what to study next.\n\nGoal:\n${params.goal}`,
    });

    return {
      ...answer,
      goal: params.goal,
      title: `Plan ${anchor.term}`,
    };
  }

  private async askCopilot(params: {
    locale: ExtensionLocale;
    termSlug: string;
    question: string;
    codeSnippet?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/api/copilot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale: params.locale,
        termSlug: params.termSlug,
        question: params.question,
        codeSnippet: params.codeSnippet,
      }),
    });

    const payload = (await response.json()) as CopilotApiResponse & { error?: string };

    if (!response.ok || !payload.answer) {
      throw new Error(payload.error ?? `Glossary OS API failed with status ${response.status}.`);
    }

    return payload.answer;
  }
}
