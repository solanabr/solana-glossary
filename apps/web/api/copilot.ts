// POST /api/copilot — streaming Solana Glossary copilot. Re-emits OpenAI-shaped SSE
// deltas so the existing client parser is unchanged. Tiered by budget: normal
// (Flash) → economy (Flash-Lite, tighter RAG/output) → canned/resting (free
// deterministic glossary answer, zero LLM).

import {
  corsPreflight,
  encodeSseDelta,
  readJson,
  SSE_DONE,
  sseFromText,
  sseHeaders,
  withGuard,
} from "./_lib/guard.js";
import { gemini } from "./_lib/gemini.js";
import { budget } from "./_lib/budget.js";
import { cache } from "./_lib/cache.js";
import {
  config as cfg,
  costMicros,
  maxOutForTier,
  modelForTier,
} from "./_lib/config.js";
import { canonicalizePrompt, freeAnswer, searchRag } from "./_lib/glossary.js";
import type { CopilotMessage, CopilotMode, Locale } from "./_lib/types.js";

export const config = { runtime: "nodejs" };

const MODES: CopilotMode[] = [
  "chat",
  "explain-code",
  "explain-file",
  "usage-example",
];

const LANGUAGE: Record<Locale, string> = {
  en: "Respond in English.",
  pt: "Respond in Brazilian Portuguese (pt-BR).",
  es: "Respond in Spanish (es).",
};

function corePersona(locale: Locale): string {
  return `You are a senior Solana protocol engineer and educator.
You think like someone who has built real protocols. You explain with precision, clarity, and real-world engineering insight, using the Solana Glossary as your foundation.

LANGUAGE:
- ${LANGUAGE[locale]}
- Keep section headings, explanations, and prose in the requested language.
- If glossary terms are translated in the provided context, prefer those translated term names.
- Use **bold** for glossary terms exactly as they appear in the response language.

CORE RULES:
- Use the provided glossary context as the source of truth
- Do NOT hallucinate definitions outside the context
- Always connect concepts together (PDA → authority → signer → CPI)
- Prioritize how the system works, not just definitions
- Always explain why this design exists in real-world systems
- Write like a senior engineer mentoring a developer — concise but insightful`;
}

function systemPrompt(
  mode: CopilotMode,
  glossaryBlock: string,
  locale: Locale,
): string {
  const persona = corePersona(locale);
  const block = glossaryBlock
    ? `\n\nGlossary Context (SOURCE OF TRUTH — do NOT hallucinate definitions outside this):\n${glossaryBlock}`
    : "";

  if (mode === "explain-file" || mode === "explain-code") {
    return `${persona}

You are analyzing code. Your response MUST follow this exact structure:

## 🧠 High-Level Summary
2–4 sentences: what the code does and its purpose in a real system.

## 🔑 Key Concepts (Glossary-Grounded)
For each concept: what it is, where it appears in the code, why it matters in THIS context.

## 🔄 Execution Flow
Step-by-step runtime trace: user action → instruction dispatch → account validation → program execution → CPI calls → state changes.

## 🧩 Architecture & Design
How components interact (accounts, PDAs, programs). Why this structure is used. How authority and ownership are modeled.

## ⚠️ Security Insights
How access control is enforced. What could go wrong. Attack vectors (seed collisions, missing checks). Be specific, not generic.

## 🧠 Real-World Pattern
Identify the pattern (custody vault, mint authority, stateful account model, program-controlled funds) and where it appears in real protocols.

## 📌 Simple Explanation (ELI5)
No jargon, intuitive analogy, 2–4 sentences max.${block}`;
  }

  if (mode === "usage-example") {
    return `${persona}

Provide a practical, real-world usage example of the given Solana concept. Be specific and concrete.

Format:
1. 2–3 sentences on how this concept is used in practice in real protocols
2. A short code snippet showing the concept in action (if applicable)
3. One sentence on when/why a developer would use this

Keep it under 150 words. Ground it in real protocol design patterns.${block}`;
  }

  return `${persona}

You are "Solana Glossary". Your response structure depends on the input:

FOR CONCEPTS — use this structure:
## 🧠 High-Level Summary
## 🔑 Key Concepts (Glossary-Grounded)
## 🧩 Architecture & Design
## 🧠 Real-World Pattern
## 📌 Simple Explanation (ELI5)

FOR CODE — use this structure:
## 🧠 High-Level Summary
## 🔑 Key Concepts (Glossary-Grounded)
## 🔄 Execution Flow
## 🧩 Architecture & Design
## ⚠️ Security Insights
## 🧠 Real-World Pattern
## 📌 Simple Explanation (ELI5)

FOR SIMPLE QUESTIONS — answer concisely but still ground in glossary context and connect related concepts.

Always connect concepts together. Reinforce relationships between terms. Prioritize real-world engineering insight.${block}`;
}

function validMode(raw: unknown): CopilotMode {
  return MODES.includes(raw as CopilotMode) ? (raw as CopilotMode) : "chat";
}

/** Rough token estimate (~4 chars/token) for reservations and cost fallbacks. */
function tokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return corsPreflight(req);

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;

  const guard = await withGuard("copilot", req, parsed.body);
  if (!guard.ok) return guard.response as Response;
  const { tier, identity, locale } = guard;

  const body = parsed.body as {
    messages?: CopilotMessage[];
    mode?: unknown;
  };
  const mode = validMode(body.mode);

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (m): m is CopilotMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    // Drop multi-turn history beyond the last two turns (cost control).
    .slice(-2)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const query =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // Build RAG from the canonical token so alias-equivalent prompts share cache
  // keys ("what's an AMM" / "define amm" → same slot).
  const { norm } = canonicalizePrompt(query, locale);
  const k = tier === "economy" ? cfg.ragK.economy : cfg.ragK.normal;
  const rag = searchRag(norm || query, locale, k);

  // Canned / resting → free deterministic answer (zero LLM), streamed as SSE.
  if (tier === "canned" || tier === "resting") {
    return sseFromText(freeAnswer(query, locale)?.text ?? "", req);
  }

  const cacheable = mode === "chat" || mode === "usage-example";
  const key = cache.key(`copilot:${mode}`, locale, norm, rag.ids);
  if (cacheable) {
    const hit = await cache.get(key);
    if (hit) return sseFromText(hit, req);
  }

  // Defensive: guard should have disabled without a key, but never spend blind.
  if (!cfg.hasGemini) {
    return sseFromText(freeAnswer(query, locale)?.text ?? "", req);
  }

  const model = modelForTier("copilot", tier);
  const maxOut = maxOutForTier("copilot", tier);
  const system = systemPrompt(mode, rag.block, locale);

  const approxIn = tokens(system) + tokens(query) + 32;
  const reserved = costMicros(model, approxIn, maxOut); // worst-case up front
  const reservedTier = await budget.reserve(identity, reserved);
  if (reservedTier === "resting") {
    // Atomic ceiling crossed (this or a concurrent call). Refuse LLM spend,
    // release the reservation, serve the free deterministic answer.
    await budget.settle(identity, reserved, 0);
    return sseFromText(freeAnswer(query, locale)?.text ?? "", req);
  }

  const enc = new TextEncoder();
  let full = "";
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const handle = gemini.streamText({
          model,
          system,
          messages,
          maxOutputTokens: maxOut,
        });
        for await (const delta of handle.stream) {
          full += delta;
          controller.enqueue(enc.encode(encodeSseDelta(delta)));
        }
        const usage = handle.getUsage();
        const actual =
          usage.inputTokens || usage.outputTokens
            ? gemini.cost(model, usage)
            : costMicros(model, approxIn, tokens(full));
        await budget.settle(identity, reserved, actual);
        if (cacheable && tier === "normal" && full.trim()) {
          await cache.set(key, full);
        }
      } catch (err) {
        console.error("[copilot] stream error:", err);
        // Settle to the real cost floor (input + whatever streamed) — NEVER 0,
        // so a billed-but-failed call still counts against the ceiling.
        await budget.settle(
          identity,
          reserved,
          costMicros(model, approxIn, tokens(full)),
        );
        if (!full) {
          const free = freeAnswer(query, locale)?.text;
          if (free) controller.enqueue(enc.encode(encodeSseDelta(free)));
        }
      } finally {
        controller.enqueue(enc.encode(SSE_DONE));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders(req) });
}

// Web-standard invocation on Vercel: a bare default-exported function would be
// invoked Node-style (req, res); the { fetch } form selects the Request/Response path.
export default { fetch: handler };
