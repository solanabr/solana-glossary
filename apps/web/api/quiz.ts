// POST /api/quiz — generates multiple-choice questions as structured JSON.
// Runs on the cheap Flash-Lite model. Canned/resting tiers return an empty set
// with a mode marker (the client shows its resting state).

import {
  corsPreflight,
  jsonResponse,
  pickLocale,
  readJson,
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
import {
  canonicalizePrompt,
  lookupTerm,
  relatedTermNames,
} from "./_lib/glossary.js";
import type { Locale, QuizResponse } from "./_lib/types.js";

export const config = { runtime: "nodejs" };

const LANGUAGE: Record<Locale, string> = {
  en: "Write questions and explanations in English.",
  pt: "Write questions and explanations in Brazilian Portuguese (pt-BR).",
  es: "Write questions and explanations in Spanish (es).",
};

// Plain JSON Schema — the Interactions API `response_format.schema` dialect.
const SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correct: { type: "integer" },
          explanation: { type: "string" },
          relatedTerms: { type: "array", items: { type: "string" } },
        },
        required: [
          "question",
          "options",
          "correct",
          "explanation",
          "relatedTerms",
        ],
      },
    },
  },
  required: ["questions"],
};

const SYSTEM =
  "You are a Solana expert quiz generator. Produce accurate, practical questions grounded in the provided concept.";

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return corsPreflight(req);

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;

  const b = parsed.body as {
    term?: string;
    category?: string;
    definition?: string;
    relatedTerms?: string[];
    difficulty?: string;
    mode?: string;
    locale?: unknown;
  };

  const term = String(b.term ?? "").trim();
  if (!term)
    return jsonResponse({ error: "Missing term", questions: [] }, 400, {}, req);

  const locale = pickLocale(b.locale);
  const difficulty = String(b.difficulty ?? "intermediate");
  const quizMode = String(b.mode ?? "concept");

  // Enrich context from the SDK when the client didn't supply it.
  const known = lookupTerm(term, locale);

  const { norm } = canonicalizePrompt(term, locale);
  const key = cache.key(
    "quiz",
    locale,
    `${norm}|${difficulty}|${quizMode}`,
    known?.related ?? [],
  );
  let cached: unknown = null;
  const hit = await cache.get(key);
  if (hit) {
    try {
      cached = JSON.parse(hit);
    } catch {
      /* corrupt entry → regenerate */
    }
  }

  // A cache hit is a $0 answer — pass the guard unmetered so a replayed quiz
  // doesn't spend the rate/budget a fresh generation needs.
  const guard = await withGuard("quiz", req, parsed.body, { metered: !cached });
  if (!guard.ok) return guard.response as Response;
  const { tier, identity } = guard;

  if (cached) return jsonResponse(cached, 200, {}, req);

  if (tier === "canned" || tier === "resting") {
    return jsonResponse({ mode: tier, questions: [] }, 200, {}, req);
  }

  const category = String(b.category ?? known?.category ?? "");
  const definition = String(b.definition ?? known?.definition ?? "");
  const related =
    Array.isArray(b.relatedTerms) && b.relatedTerms.length
      ? b.relatedTerms
      : relatedTermNames(term, locale);

  if (!cfg.hasGemini)
    return jsonResponse({ mode: "disabled", questions: [] }, 200, {}, req);

  const prompt = `Generate 3 multiple-choice questions based on the concept: "${term}".

Context:
- Category: ${category}
- Definition: ${definition}
- Related terms: ${related.join(", ")}
- Difficulty: ${difficulty}
- Mode: ${quizMode}

${LANGUAGE[locale]}

Rules:
- 4 options per question
- Exactly 1 correct answer
- Avoid obvious answers; make questions practical and contextual
- "correct" is the 0-based index of the correct option

Modes: concept → definition-based · connections → relationships between terms · real-world → applied scenarios or code
Difficulty: beginner → simple definitions · intermediate → relationships/how things work · advanced → application, edge cases, or code`;

  const model = modelForTier("quiz", tier);
  const maxOut = maxOutForTier("quiz", tier);
  const approxIn = Math.ceil((SYSTEM.length + prompt.length) / 4) + 32;
  const reserved = costMicros(model, approxIn, maxOut);
  const reservedTier = await budget.reserve(identity, reserved);
  if (reservedTier === "resting") {
    await budget.settle(identity, reserved, 0);
    return jsonResponse({ mode: "resting", questions: [] }, 200, {}, req);
  }

  try {
    const { data, usage } = await gemini.generateStructured<QuizResponse>({
      model,
      system: SYSTEM,
      prompt,
      schema: SCHEMA,
      maxOutputTokens: maxOut,
    });
    await budget.settle(identity, reserved, gemini.cost(model, usage));

    const questions = Array.isArray(data?.questions) ? data.questions : [];
    if (tier === "normal" && questions.length) {
      await cache.set(key, JSON.stringify({ questions }));
    }
    return jsonResponse({ questions }, 200, {}, req);
  } catch (err) {
    console.error("[quiz] generation error:", err);
    // Input-cost floor, never 0 — a failed-after-dispatch call still bills.
    await budget.settle(identity, reserved, costMicros(model, approxIn, 0));
    return jsonResponse(
      { error: "Failed to generate quiz", questions: [] },
      200,
      {},
      req,
    );
  }
}

// Web-standard invocation on Vercel: a bare default-exported function would be
// invoked Node-style (req, res); the { fetch } form selects the Request/Response path.
export default { fetch: handler };
