// The only module that talks to @google/genai. Uses the Interactions API
// (POST /v1beta/interactions): generateContent is refused for API keys created
// after mid-2026 ("no longer available to new users"), so every call goes
// through interactions.create. Thinking is pinned to "minimal" (Gemini 3.5+
// dropped thinkingBudget), every call carries a hard max_output_tokens cap,
// and interactions are never stored server-side (store: false).

import { GoogleGenAI } from "@google/genai";
import { config, costMicros, type Config } from "./config.js";

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
  }): StreamHandle;

  generateStructured<T>(opts: {
    model: string;
    system: string;
    prompt: string;
    schema: unknown;
    maxOutputTokens: number;
  }): Promise<{ data: T; usage: TokenUsage }>;

  /** Micro-dollar cost for a usage split on a model (via config prices). */
  cost(model: string, usage: TokenUsage): number;
}

// ── minimal structural views of Interactions responses ───────
// (The SDK's own unions are broad; we only touch these fields.)
interface InteractionUsage {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_thought_tokens?: number;
}

interface InteractionStep {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
}

interface InteractionLike {
  usage?: InteractionUsage;
  output_text?: string;
  steps?: InteractionStep[];
}

interface InteractionEvent {
  event_type?: string;
  delta?: { type?: string; text?: string };
  metadata?: { total_usage?: InteractionUsage };
  interaction?: InteractionLike;
}

/** Thought tokens bill at the output rate, so they count as output here. */
function toUsage(
  u: InteractionUsage | undefined,
  prev: TokenUsage,
): TokenUsage {
  if (!u) return prev;
  return {
    inputTokens: u.total_input_tokens ?? prev.inputTokens,
    outputTokens:
      (u.total_output_tokens ?? 0) + (u.total_thought_tokens ?? 0) ||
      prev.outputTokens,
  };
}

// The serving API is steps-based: turn-list input is rejected with
// "use step_list input format instead of turn_list".
function toSteps(messages: ChatTurn[]) {
  return messages.map((m) => ({
    type:
      m.role === "assistant"
        ? ("model_output" as const)
        : ("user_input" as const),
    content: [{ type: "text" as const, text: m.content }],
  }));
}

/** Model output text: `output_text` when present, else the model_output steps. */
function interactionText(interaction: InteractionLike): string {
  if (typeof interaction.output_text === "string" && interaction.output_text) {
    return interaction.output_text;
  }
  const parts: string[] = [];
  for (const step of interaction.steps ?? []) {
    if (step.type !== "model_output") continue;
    for (const c of step.content ?? []) {
      if (c.type === "text" && c.text) parts.push(c.text);
    }
  }
  return parts.join("");
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
        const events = await requireClient().interactions.create({
          model: opts.model,
          input: toSteps(opts.messages),
          system_instruction: opts.system,
          store: false,
          stream: true,
          generation_config: {
            max_output_tokens: opts.maxOutputTokens,
            thinking_level: "minimal",
          },
        });

        for await (const raw of events) {
          const event = raw as InteractionEvent;
          if (event.metadata?.total_usage) {
            usage = toUsage(event.metadata.total_usage, usage);
          }
          if (event.event_type === "interaction.completed") {
            usage = toUsage(event.interaction?.usage, usage);
          }
          if (
            event.event_type === "step.delta" &&
            event.delta?.type === "text" &&
            event.delta.text
          ) {
            yield event.delta.text;
          }
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
    }): Promise<{ data: T; usage: TokenUsage }> {
      const interaction = (await requireClient().interactions.create({
        model: opts.model,
        input: opts.prompt,
        system_instruction: opts.system,
        store: false,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: opts.schema as Record<string, unknown>,
        },
        generation_config: {
          max_output_tokens: opts.maxOutputTokens,
          thinking_level: "minimal",
        },
      })) as InteractionLike;

      const usage = toUsage(interaction.usage, {
        inputTokens: 0,
        outputTokens: 0,
      });
      const raw = interactionText(interaction).trim();
      const data = JSON.parse(stripFences(raw)) as T;
      return { data, usage };
    },

    cost(model, usage) {
      return costMicros(model, usage.inputTokens, usage.outputTokens, cfg);
    },
  };
}

/** Defensive: peel ```json fences if the model ignores the response format. */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/** Default singleton wired from env. */
export const gemini: Gemini = createGemini({ apiKey: config.geminiApiKey });
