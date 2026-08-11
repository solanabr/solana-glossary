// POST /api/apply-code — generates a short, targeted Solana code example as
// structured JSON. Runs on Flash (drops to Flash-Lite under the economy tier).
// Canned/resting return a mode marker; the client renders its resting state.

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
import type { ApplyCodeResponse, Locale } from "./_lib/types.js";

export const config = { runtime: "nodejs" };

const LANGUAGE: Record<Locale, string> = {
  en: "Write everything in English.",
  pt: "Write everything in Brazilian Portuguese (pt-BR).",
  es: "Write everything in Spanish (es).",
};

// Plain JSON Schema — the Interactions API `response_format.schema` dialect.
const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    code: { type: "string" },
    language: { type: "string" },
    explanation: { type: "string" },
    keyConcepts: { type: "array", items: { type: "string" } },
  },
  required: ["title", "code", "language", "explanation", "keyConcepts"],
};

const SYSTEM =
  "You are a senior Solana developer and educator who writes concise, correct, runnable examples.";

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return corsPreflight(req);

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;

  const b = parsed.body as {
    term?: string;
    incorrectTerms?: string[];
    relatedTerms?: string[];
    difficulty?: string;
    mode?: string;
    locale?: unknown;
  };

  const term = String(b.term ?? "").trim();
  if (!term) return jsonResponse({ error: "Missing term" }, 400, {}, req);

  const locale = pickLocale(b.locale);
  const difficulty = String(b.difficulty ?? "intermediate");
  const applyMode = String(b.mode ?? "concept");
  const incorrect = (Array.isArray(b.incorrectTerms) ? b.incorrectTerms : [])
    .map(String)
    .sort();

  const known = lookupTerm(term, locale);
  const { norm } = canonicalizePrompt(term, locale);
  const key = cache.key(
    "apply-code",
    locale,
    `${norm}|${difficulty}|${applyMode}|${incorrect.join(",")}`,
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

  // A cache hit is a $0 answer — pass the guard unmetered so replays don't
  // spend the rate/budget a fresh generation needs.
  const guard = await withGuard("apply-code", req, parsed.body, {
    metered: !cached,
  });
  if (!guard.ok) return guard.response as Response;
  const { tier, identity } = guard;

  if (cached) return jsonResponse(cached, 200, {}, req);

  if (tier === "canned" || tier === "resting") {
    return jsonResponse({ mode: tier }, 200, {}, req);
  }

  const related =
    Array.isArray(b.relatedTerms) && b.relatedTerms.length
      ? b.relatedTerms
      : relatedTermNames(term, locale);

  if (!cfg.hasGemini) return jsonResponse({ mode: "disabled" }, 200, {}, req);

  const prompt = `The user just completed a learning session about: "${term}"

They struggled with:
${incorrect.join(", ") || "None"}

Related concepts:
${related.join(", ")}

Difficulty: ${difficulty}
Quiz mode: ${applyMode}

${LANGUAGE[locale]}

Goal: generate a practical, real-world Solana example that helps the user apply what they just learned.

Requirements:
- Use realistic Solana context (Anchor, CLI, or Web3.js)
- Focus on the concepts the user struggled with
- Keep it educational and clear, with inline comments explaining the logic
- Avoid overly long code (max ~30 lines)
- "language" is one of: rust, typescript, bash`;

  const model = modelForTier("apply-code", tier);
  const maxOut = maxOutForTier("apply-code", tier);
  const approxIn = Math.ceil((SYSTEM.length + prompt.length) / 4) + 32;
  const reserved = costMicros(model, approxIn, maxOut);
  const reservedTier = await budget.reserve(identity, reserved);
  if (reservedTier === "resting") {
    await budget.settle(identity, reserved, 0);
    return jsonResponse({ mode: "resting" }, 200, {}, req);
  }

  try {
    const { data, usage } = await gemini.generateStructured<ApplyCodeResponse>({
      model,
      system: SYSTEM,
      prompt,
      schema: SCHEMA,
      maxOutputTokens: maxOut,
    });
    await budget.settle(identity, reserved, gemini.cost(model, usage));

    if (tier === "normal" && data?.code) {
      await cache.set(key, JSON.stringify(data));
    }
    return jsonResponse(data, 200, {}, req);
  } catch (err) {
    console.error("[apply-code] generation error:", err);
    // Input-cost floor, never 0 — a failed-after-dispatch call still bills.
    await budget.settle(identity, reserved, costMicros(model, approxIn, 0));
    return jsonResponse({ error: "Failed to generate example" }, 200, {}, req);
  }
}

// Web-standard invocation on Vercel: a bare default-exported function would be
// invoked Node-style (req, res); the { fetch } form selects the Request/Response path.
export default { fetch: handler };
