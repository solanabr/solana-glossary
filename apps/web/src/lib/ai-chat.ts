import { type GlossaryTerm } from "@stbr/solana-glossary";
import {
  buildLocalizedGlossaryContext,
  getLocalizedTerms,
  type GlossaryLocale,
} from "@/lib/glossary-i18n";
import { buildAiHeaders, isRestingBody } from "@/lib/ai-session";

// Streamed same-origin by the AI backend; callers gate on useAiEnabled("copilot").
const CHAT_URL = "/api/copilot";

type Msg = { role: "user" | "assistant"; content: string };

export async function streamChat({
  messages,
  glossaryContext,
  locale = "en",
  mode,
  onDelta,
  onDone,
  onError,
  onResting,
}: {
  messages: Msg[];
  glossaryContext: string;
  locale?: GlossaryLocale;
  mode?: "chat" | "explain-code" | "explain-file" | "usage-example";
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  /** Copilot tier dropped to resting (HTTP 429 or a `{mode:"resting"}` body). */
  onResting: () => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: await buildAiHeaders(),
      body: JSON.stringify({
        messages,
        glossaryContext,
        locale,
        mode: mode || "chat",
      }),
    });

    // Budget paused / rate-limited → show the resting state, never spin.
    if (resp.status === 429) {
      onResting();
      return;
    }

    if (!resp.ok) {
      const errorData = await resp
        .json()
        .catch(() => ({ error: "Unknown error" }));
      onError(errorData.error || `Error ${resp.status}`);
      return;
    }

    // A resting/canned tier may reply with JSON instead of an SSE stream.
    const contentType = resp.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data: unknown = await resp.json().catch(() => null);
      if (isRestingBody(data)) {
        onResting();
        return;
      }
      const errorText = (data as { error?: unknown } | null)?.error;
      if (typeof errorText === "string") {
        onError(errorText);
        return;
      }
      onDone();
      return;
    }

    if (!resp.body) {
      onError("No response body");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as
            string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as
            string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Network error");
  }
}

export function buildGlossaryContext(
  input: string,
  locale: GlossaryLocale = "en",
): string {
  return buildLocalizedGlossaryContext(input, locale);
}

export function findTermsInText(
  text: string,
  locale: GlossaryLocale = "en",
): GlossaryTerm[] {
  const lower = text.toLowerCase();
  return getLocalizedTerms(locale).filter((term) => {
    if (lower.includes(term.term.toLowerCase())) return true;
    return term.aliases?.some((alias) => lower.includes(alias.toLowerCase()));
  });
}
