// POST /api/quiz — generates multiple-choice questions as structured JSON.
// Runs on the cheap Flash-Lite model. Canned/resting tiers return an empty set
// with a mode marker (the client shows its resting state).

import { corsPreflight, jsonResponse, readJson, withGuard } from "./_lib/guard";
import { gemini, Type } from "./_lib/gemini";
import { budget } from "./_lib/budget";
import { cache } from "./_lib/cache";
import {
  config as cfg,
  costMicros,
  maxOutForTier,
  modelForTier,
} from "./_lib/config";
import {
  canonicalizePrompt,
  lookupTerm,
  relatedTermNames,
} from "./_lib/glossary";
import type { Locale, QuizResponse } from "./_lib/types";

export const config = { runtime: "nodejs" };

const LANGUAGE: Record<Locale, string> = {
  en: "Write questions and explanations in English.",
  pt: "Write questions and explanations in Brazilian Portuguese (pt-BR).",
  es: "Write questions and explanations in Spanish (es).",
};

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correct: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          relatedTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          "question",
          "options",
          "correct",
          "explanation",
          "relatedTerms",
        ],
        propertyOrdering: [
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

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return corsPreflight();

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;

  const guard = await withGuard("quiz", req, parsed.body);
  if (!guard.ok) return guard.response as Response;
  const { tier, identity, locale } = guard;

  const b = parsed.body as {
    term?: string;
    category?: string;
    definition?: string;
    relatedTerms?: string[];
    difficulty?: string;
    mode?: string;
  };

  const term = String(b.term ?? "").trim();
  if (!term) return jsonResponse({ error: "Missing term", questions: [] }, 400);

  const difficulty = String(b.difficulty ?? "intermediate");
  const quizMode = String(b.mode ?? "concept");

  if (tier === "canned" || tier === "resting") {
    return jsonResponse({ mode: tier, questions: [] });
  }

  // Enrich context from the SDK when the client didn't supply it.
  const known = lookupTerm(term, locale);
  const category = String(b.category ?? known?.category ?? "");
  const definition = String(b.definition ?? known?.definition ?? "");
  const related =
    Array.isArray(b.relatedTerms) && b.relatedTerms.length
      ? b.relatedTerms
      : relatedTermNames(term, locale);

  const { norm } = canonicalizePrompt(term, locale);
  const key = cache.key(
    "quiz",
    locale,
    `${norm}|${difficulty}|${quizMode}`,
    known?.related ?? [],
  );
  const hit = await cache.get(key);
  if (hit) {
    try {
      return jsonResponse(JSON.parse(hit));
    } catch {
      /* fall through to regenerate */
    }
  }

  if (!cfg.hasGemini) return jsonResponse({ mode: "disabled", questions: [] });

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
  const reserved = costMicros(
    model,
    Math.ceil((SYSTEM.length + prompt.length) / 4) + 32,
    maxOut,
  );
  await budget.reserve(identity, reserved);

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
    return jsonResponse({ questions });
  } catch (err) {
    console.error("[quiz] generation error:", err);
    await budget.settle(identity, reserved, 0);
    return jsonResponse({ error: "Failed to generate quiz", questions: [] });
  }
}
