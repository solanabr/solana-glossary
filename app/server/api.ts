import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

interface ApiConfig {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function jsonResponse(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// System prompts (ported verbatim from supabase/functions/solana-copilot)
// ---------------------------------------------------------------------------

const languageInstructions: Record<string, string> = {
  en: "Respond in English.",
  pt: "Respond in Brazilian Portuguese (pt-BR).",
  es: "Respond in Spanish (es).",
};

function buildCorePersona(locale: string, glossaryBlock: string): string {
  return `You are a senior Solana protocol engineer and educator.
You think like someone who has built real protocols. You explain with precision, clarity, and real-world engineering insight, using the Solana Glossary as your foundation.

LANGUAGE:
- ${languageInstructions[locale] ?? languageInstructions.en}
- Keep section headings, explanations, and prose in the requested language.
- If glossary terms are translated in the provided context, prefer those translated term names.
- Use **bold** for glossary terms exactly as they appear in the response language.

CORE RULES:
- Use the provided glossary context as the source of truth
- Do NOT hallucinate definitions outside the context
- Always connect concepts together (PDA → authority → signer → CPI)
- Prioritize how the system works, not just definitions
- Always explain why this design exists in real-world systems
- Write like a senior engineer mentoring a developer — concise but insightful${glossaryBlock}`;
}

function buildSystemPrompt(
  mode: string | undefined,
  locale: string,
  glossaryContext: string | undefined,
): string {
  const glossaryBlock = glossaryContext
    ? `\n\nGlossary Context (SOURCE OF TRUTH — do NOT hallucinate definitions outside this):\n${glossaryContext}`
    : "";

  const persona = buildCorePersona(locale, glossaryBlock);

  if (mode === "explain-file" || mode === "explain-code") {
    return `${persona}

You are analyzing code. Your response MUST follow this exact structure:

## High-Level Summary
2-4 sentences: what the code does and its purpose in a real system.

## Key Concepts (Glossary-Grounded)
For each concept: what it is, where it appears in the code, why it matters in THIS context.

## Execution Flow
Step-by-step runtime trace: user action → instruction dispatch → account validation → program execution → CPI calls → state changes.

## Architecture & Design
How components interact (accounts, PDAs, programs). Why this structure is used. How authority and ownership are modeled.

## Security Insights
How access control is enforced. What could go wrong if implemented incorrectly. Potential attack vectors.

## Real-World Pattern
Identify the pattern (custody vault, token minting authority, stateful account model). Where this appears in real protocols.

## Simple Explanation (ELI5)
No jargon, intuitive analogy, 2-4 sentences max.`;
  }

  if (mode === "usage-example") {
    return `${persona}

Provide a practical, real-world usage example of the given Solana concept. Be specific and concrete.

Format:
1. 2-3 sentences on how this concept is used in practice in real protocols
2. A short code snippet showing the concept in action (if applicable)
3. One sentence on when/why a developer would use this

Keep it under 150 words. Ground it in real protocol design patterns.`;
  }

  return `${persona}

You are "Solana Dev Copilot". Your response structure depends on the input:

FOR CONCEPTS — use this structure:
## High-Level Summary
## Key Concepts (Glossary-Grounded)
## Architecture & Design
## Real-World Pattern
## Simple Explanation (ELI5)

FOR CODE — use this structure:
## High-Level Summary
## Key Concepts (Glossary-Grounded)
## Execution Flow
## Architecture & Design
## Security Insights
## Real-World Pattern
## Simple Explanation (ELI5)

FOR SIMPLE QUESTIONS — answer concisely but still ground in glossary context and connect related concepts.

Always connect concepts together. Reinforce relationships between terms. Prioritize real-world engineering insight.`;
}

// ---------------------------------------------------------------------------
// Chat handler (SSE streaming)
// ---------------------------------------------------------------------------

async function handleChat(
  config: ApiConfig,
  data: Record<string, unknown>,
  res: ServerResponse,
): Promise<void> {
  const { messages, glossaryContext, mode, locale = "en" } = data;
  const systemPrompt = buildSystemPrompt(
    mode as string,
    locale as string,
    glossaryContext as string,
  );

  const upstream = await fetch(`${config.apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages as Array<{ role: string; content: string }>),
      ],
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const status = upstream.status;
    if (status === 429) {
      return jsonResponse(
        res,
        { error: "Rate limit exceeded. Please try again in a moment." },
        429,
      );
    }
    if (status === 402) {
      return jsonResponse(res, { error: "AI credits exhausted." }, 402);
    }
    const text = await upstream.text().catch(() => "");
    console.error("AI gateway error:", status, text);
    return jsonResponse(res, { error: "AI service error" }, 500);
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const reader = (upstream.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
  } catch {
    // Client disconnected
  } finally {
    res.end();
  }
}

// ---------------------------------------------------------------------------
// Quiz handler (JSON)
// ---------------------------------------------------------------------------

const quizLangInstructions: Record<string, string> = {
  en: "Write questions and explanations in English.",
  pt: "Write questions and explanations in Brazilian Portuguese (pt-BR).",
  es: "Write questions and explanations in Spanish (es).",
};

async function handleQuiz(
  config: ApiConfig,
  data: Record<string, unknown>,
  res: ServerResponse,
): Promise<void> {
  const {
    term,
    category,
    definition,
    relatedTerms,
    difficulty,
    mode,
    locale = "en",
  } = data;

  const prompt = `You are a Solana expert educator.

Generate 3 multiple-choice questions based on the concept: "${term}".

Context:
- Category: ${category}
- Definition: ${definition}
- Related terms: ${((relatedTerms as string[]) || []).join(", ")}
- Difficulty: ${difficulty}
- Mode: ${mode}

${quizLangInstructions[locale as string] || quizLangInstructions.en}

Rules:
- 4 options per question
- Only 1 correct answer
- Avoid obvious answers
- Make questions practical and contextual when possible

Modes:
- concept → definition-based questions
- connections → relationship between terms
- real-world → applied scenarios or code

Difficulty:
- beginner → simple definitions
- intermediate → relationships and how things work
- advanced → application, edge cases, or code

You MUST return valid JSON with this exact structure:
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": 0,
      "explanation": "...",
      "relatedTerms": ["Term1", "Term2"]
    }
  ]
}

The "correct" field is the 0-based index of the correct option.
Return ONLY the JSON, no markdown, no extra text.`;

  const upstream = await fetch(`${config.apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "You are a Solana expert quiz generator. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      stream: false,
    }),
  });

  if (!upstream.ok) {
    const status = upstream.status;
    if (status === 429)
      return jsonResponse(res, { error: "Rate limit exceeded" }, 429);
    if (status === 402)
      return jsonResponse(res, { error: "Credits exhausted" }, 402);
    return jsonResponse(res, { error: "AI service error" }, 500);
  }

  const result = await upstream.json();
  const raw = result.choices?.[0]?.message?.content || "";

  try {
    const cleaned = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return jsonResponse(res, parsed);
  } catch {
    console.error("Failed to parse quiz JSON:", raw);
    return jsonResponse(res, { error: "Failed to parse quiz", questions: [] });
  }
}

// ---------------------------------------------------------------------------
// Apply-code handler (JSON)
// ---------------------------------------------------------------------------

const applyLangInstructions: Record<string, string> = {
  en: "Write everything in English.",
  pt: "Write everything in Brazilian Portuguese (pt-BR).",
  es: "Write everything in Spanish (es).",
};

async function handleApplyCode(
  config: ApiConfig,
  data: Record<string, unknown>,
  res: ServerResponse,
): Promise<void> {
  const {
    term,
    incorrectTerms,
    relatedTerms,
    difficulty,
    mode,
    locale = "en",
  } = data;

  const prompt = `You are a senior Solana developer and educator.

The user just completed a learning session about: "${term}"

They struggled with:
${((incorrectTerms as string[]) || []).join(", ") || "None"}

Related concepts:
${((relatedTerms as string[]) || []).join(", ")}

Difficulty: ${difficulty}
Quiz mode: ${mode}

${applyLangInstructions[locale as string] || applyLangInstructions.en}

Goal:
Generate a practical, real-world Solana example that helps the user apply what they just learned.

Requirements:
- Use realistic Solana context (Anchor, CLI, or Web3.js)
- Focus on the concepts the user struggled with
- Keep it educational and clear
- Include inline comments explaining the logic
- Avoid overly long code (max ~30 lines)

You MUST return valid JSON with this exact structure:
{
  "title": "Short title describing what this example demonstrates",
  "code": "The full code example with inline comments",
  "language": "rust or typescript or bash",
  "explanation": "2-3 sentences explaining what is happening and why it matters",
  "keyConcepts": ["Term1", "Term2", "Term3"]
}

Return ONLY the JSON, no markdown, no extra text.`;

  const upstream = await fetch(`${config.apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "You are a Solana expert code generator. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      stream: false,
    }),
  });

  if (!upstream.ok) {
    const status = upstream.status;
    if (status === 429)
      return jsonResponse(res, { error: "Rate limit exceeded" }, 429);
    if (status === 402)
      return jsonResponse(res, { error: "Credits exhausted" }, 402);
    return jsonResponse(res, { error: "AI service error" }, 500);
  }

  const result = await upstream.json();
  const raw = result.choices?.[0]?.message?.content || "";

  try {
    const cleaned = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return jsonResponse(res, parsed);
  } catch {
    console.error("Failed to parse apply-code JSON:", raw);
    return jsonResponse(res, { error: "Failed to parse response" });
  }
}

// ---------------------------------------------------------------------------
// Vite plugin
// ---------------------------------------------------------------------------

export function createApiPlugin(config: ApiConfig): Plugin {
  const isConfigured = Boolean(config.apiKey && config.apiBaseUrl);

  return {
    name: "solana-glossary-api",

    config() {
      return {
        define: {
          "import.meta.env.VITE_AI_AVAILABLE": JSON.stringify(isConfigured),
        },
      };
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === "OPTIONS" && req.url?.startsWith("/api/")) {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "content-type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          });
          return res.end();
        }

        if (req.method !== "POST" || !req.url?.startsWith("/api/")) {
          return next();
        }

        if (!isConfigured) {
          return jsonResponse(
            res,
            {
              error:
                "AI API not configured. Set AI_API_KEY and AI_API_BASE_URL in app/.env",
            },
            503,
          );
        }

        try {
          const body = await readBody(req);
          const data = JSON.parse(body);

          switch (req.url) {
            case "/api/chat":
              return await handleChat(config, data, res);
            case "/api/quiz":
              return await handleQuiz(config, data, res);
            case "/api/apply-code":
              return await handleApplyCode(config, data, res);
            default:
              return jsonResponse(res, { error: "Not found" }, 404);
          }
        } catch (e) {
          console.error("API error:", e);
          return jsonResponse(
            res,
            { error: e instanceof Error ? e.message : "Internal error" },
            500,
          );
        }
      });
    },
  };
}
