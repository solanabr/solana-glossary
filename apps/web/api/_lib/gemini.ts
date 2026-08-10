// The only module that talks to @google/genai. Wraps streaming (copilot) and
// structured JSON (quiz/apply-code) generation. Thinking is always disabled
// (thinkingBudget: 0) and every call carries a hard maxOutputTokens cap.

import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { config, costMicros, type Config } from "./config.js";

// Re-export so routes build response schemas without importing the SDK directly.
export { Type };

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface StreamHandle {
  /** Text deltas, ready to be re-emitted as OpenAI-shaped SSE. */
  stream: AsyncGenerator<string>;
  /** Token usage — only meaningful after the stream is fully drained. */
  getUsage(): TokenUsage;
}

export interface Gemini {
  streamText(opts: {
    model: string;
    system: string;
    messages: ChatTurn[];
    maxOutputTokens: number;
    temperature?: number;
  }): StreamHandle;

  generateStructured<T>(opts: {
    model: string;
    system: string;
    prompt: string;
    schema: unknown;
    maxOutputTokens: number;
    temperature?: number;
  }): Promise<{ data: T; usage: TokenUsage }>;

  /** Micro-dollar cost for a usage split on a model (via config prices). */
  cost(model: string, usage: TokenUsage): number;
}

interface UsageMetadataLike {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
}

function toUsage(
  meta: UsageMetadataLike | undefined,
  prev: TokenUsage,
): TokenUsage {
  if (!meta) return prev;
  return {
    inputTokens: meta.promptTokenCount ?? prev.inputTokens,
    outputTokens: meta.candidatesTokenCount ?? prev.outputTokens,
  };
}

function toContents(messages: ChatTurn[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/**
 * Build a Gemini client. `apiKey` empty → a stub that throws on use; routes
 * must check `config.hasGemini` and take the free-answer path instead.
 */
export function createGemini(deps: {
  apiKey: string;
  config?: Config;
}): Gemini {
  const cfg = deps.config ?? config;
  const ai = deps.apiKey ? new GoogleGenAI({ apiKey: deps.apiKey }) : null;

  function requireClient(): GoogleGenAI {
    if (!ai) throw new Error("Gemini client unavailable (no GEMINI_API_KEY)");
    return ai;
  }

  return {
    streamText(opts): StreamHandle {
      let usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

      async function* run(): AsyncGenerator<string> {
        const response = await requireClient().models.generateContentStream({
          model: opts.model,
          contents: toContents(opts.messages),
          config: {
            systemInstruction: opts.system,
            maxOutputTokens: opts.maxOutputTokens,
            temperature: opts.temperature ?? 0.6,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        for await (const chunk of response) {
          usage = toUsage(chunk.usageMetadata, usage);
          const text = chunk.text;
          if (text) yield text;
        }
      }

      return { stream: run(), getUsage: () => usage };
    },

    async generateStructured<T>(opts: {
      model: string;
      system: string;
      prompt: string;
      schema: unknown;
      maxOutputTokens: number;
      temperature?: number;
    }): Promise<{ data: T; usage: TokenUsage }> {
      const response = await requireClient().models.generateContent({
        model: opts.model,
        contents: opts.prompt,
        config: {
          systemInstruction: opts.system,
          maxOutputTokens: opts.maxOutputTokens,
          temperature: opts.temperature ?? 0.7,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: opts.schema as Schema,
        },
      });

      const usage = toUsage(response.usageMetadata, {
        inputTokens: 0,
        outputTokens: 0,
      });
      const raw = (response.text ?? "").trim();
      const data = JSON.parse(stripFences(raw)) as T;
      return { data, usage };
    },

    cost(model, usage) {
      return costMicros(model, usage.inputTokens, usage.outputTokens, cfg);
    },
  };
}

/** Defensive: peel ```json fences if the model ignores responseMimeType. */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/** Default singleton wired from env. */
export const gemini: Gemini = createGemini({ apiKey: config.geminiApiKey });
