import type { GlossaryTerm } from "../../../../src/types";

import type { Locale } from "./locales";
import {
  getAllTerms,
  getBuilderPathTerms,
  getBuilderPathsForTerm,
  getCategoryMeta,
  getCategoryTermPreview,
  getCompactContext,
  getConceptGraph,
  getConfusableTerms,
  getMentalModel,
  getRelatedTerms,
  getSiblingTerms,
  getTermById,
  searchTerms,
} from "./glossary";
import type { CopilotAnswer, CopilotLinkedReason, CopilotLinkedTerm } from "./copilot-types";

type CopilotSchemaAnswer = {
  explanation: string;
  key_concepts: Array<{ term_id: string; reason: string }>;
  suggested_next_terms: Array<{ term_id: string; reason: string }>;
  glossary_mentions: string[];
  caveat: string;
};

export type GlossaryContextBundle = {
  term: GlossaryTerm;
  candidateTerms: GlossaryTerm[];
  highlightTerms: CopilotLinkedTerm[];
  mode: "term" | "code";
  contextText: string;
};

type GlossaryContextOptions = {
  locale?: Locale;
  question?: string;
  codeSnippet?: string;
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const COPILOT_SCHEMA = {
  type: "json_schema",
  name: "glossary_copilot_response",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      explanation: { type: "string" },
      key_concepts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            term_id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["term_id", "reason"],
        },
      },
      suggested_next_terms: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            term_id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["term_id", "reason"],
        },
      },
      glossary_mentions: {
        type: "array",
        items: { type: "string" },
      },
      caveat: { type: "string" },
    },
    required: [
      "explanation",
      "key_concepts",
      "suggested_next_terms",
      "glossary_mentions",
      "caveat",
    ],
  },
} as const;

const CODE_PATTERNS: Array<{ pattern: RegExp; termId: string; score: number }> = [
  { pattern: /#\s*\[\s*account\s*\]/i, termId: "anchor-account-macro", score: 7 },
  { pattern: /derive\s*\(\s*Accounts\s*\)/i, termId: "anchor-derive-accounts", score: 7 },
  { pattern: /\bContext\s*</i, termId: "anchor-context", score: 6 },
  { pattern: /\bSigner\s*</i, termId: "signer", score: 5 },
  { pattern: /\bAccount\s*</i, termId: "account", score: 5 },
  { pattern: /\bProgram\s*</i, termId: "program", score: 4 },
  { pattern: /\bPDA\b|\bfind_program_address\b/i, termId: "pda", score: 6 },
  { pattern: /\bseeds\b/i, termId: "seeds", score: 4 },
  { pattern: /\bbump\b/i, termId: "bump", score: 4 },
  { pattern: /\binvoke_signed\b/i, termId: "invoke-signed", score: 5 },
  { pattern: /\binvoke\b/i, termId: "invoke", score: 3 },
  { pattern: /\bCpiContext\b|\bCPI\b/i, termId: "cpi", score: 5 },
  { pattern: /\bsimulateTransaction\b/i, termId: "simulate-transaction", score: 5 },
  { pattern: /\btransaction\b/i, termId: "transaction", score: 2 },
  { pattern: /\brent\b/i, termId: "rent", score: 3 },
  { pattern: /\bRPC\b/i, termId: "rpc", score: 2 },
];

function uniqueTerms(terms: Array<GlossaryTerm | undefined | null>): GlossaryTerm[] {
  const seen = new Set<string>();
  const result: GlossaryTerm[] = [];

  for (const term of terms) {
    if (!term || seen.has(term.id)) continue;
    seen.add(term.id);
    result.push(term);
  }

  return result;
}

function getLocaleLabel(locale: Locale): string {
  switch (locale) {
    case "pt":
      return "Brazilian Portuguese";
    case "es":
      return "Spanish";
    default:
      return "English";
  }
}

function trimDefinition(definition: string, limit = 220): string {
  if (definition.length <= limit) return definition;
  return `${definition.slice(0, limit - 1).trim()}…`;
}

function getNextConcepts(
  term: GlossaryTerm,
  relatedTerms: GlossaryTerm[],
  categoryPreview: GlossaryTerm[],
  siblingTerms: { previous?: GlossaryTerm; next?: GlossaryTerm },
) {
  const seen = new Set<string>();
  const candidates = [
    ...relatedTerms,
    siblingTerms.next,
    siblingTerms.previous,
    ...categoryPreview,
  ].filter((candidate): candidate is GlossaryTerm => Boolean(candidate));

  return candidates
    .filter((candidate) => {
      if (seen.has(candidate.id) || candidate.id === term.id) {
        return false;
      }

      seen.add(candidate.id);
      return true;
    })
    .slice(0, 4);
}

function scoreCodeSnippetAgainstTerms(codeSnippet: string): Map<string, number> {
  const scores = new Map<string, number>();
  const lowerCode = codeSnippet.toLowerCase();

  for (const entry of CODE_PATTERNS) {
    if (entry.pattern.test(codeSnippet)) {
      scores.set(entry.termId, (scores.get(entry.termId) ?? 0) + entry.score);
    }
  }

  for (const term of getAllTerms("en")) {
    const candidates = [term.id, term.term, ...(term.aliases ?? [])];
    for (const candidate of candidates) {
      const normalized = candidate.trim().toLowerCase();
      if (normalized.length < 4) continue;
      if (!lowerCode.includes(normalized)) continue;

      const bonus = candidate.includes(" ") ? 3 : 1;
      scores.set(term.id, (scores.get(term.id) ?? 0) + bonus);
    }
  }

  return scores;
}

function getCodeTerms(codeSnippet: string, locale: Locale, limit = 6): GlossaryTerm[] {
  if (!codeSnippet.trim()) return [];

  const scored = [...scoreCodeSnippetAgainstTerms(codeSnippet).entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([termId]) => getTermById(termId, locale));

  return uniqueTerms(scored);
}

function getQuestionTerms(question: string, locale: Locale, limit = 4): GlossaryTerm[] {
  if (!question.trim()) return [];
  return searchTerms(question, locale)
    .filter((candidate) => candidate.definition)
    .slice(0, limit);
}

function toLinkedTerm(term: GlossaryTerm): CopilotLinkedTerm {
  return {
    id: term.id,
    label: term.term,
    aliases: term.aliases ?? [],
  };
}

function toLinkedReason(term: GlossaryTerm, reason: string): CopilotLinkedReason {
  return {
    id: term.id,
    label: term.term,
    reason,
  };
}

export function getGlossaryContext(
  termSlug: string,
  options: GlossaryContextOptions = {},
): GlossaryContextBundle {
  const locale = options.locale ?? "en";
  const term = getTermById(termSlug, locale);

  if (!term) {
    throw new Error(`Glossary term "${termSlug}" was not found.`);
  }

  const relatedTerms = getRelatedTerms(term, locale).slice(0, 5);
  const confusableTerms = getConfusableTerms(term, locale, 3);
  const categoryPreview = getCategoryTermPreview(term, locale, 4);
  const siblingTerms = getSiblingTerms(term, locale);
  const nextConcepts = getNextConcepts(term, relatedTerms, categoryPreview, siblingTerms);
  const builderPaths = getBuilderPathsForTerm(term.id, locale);
  const builderPathTerms = builderPaths.flatMap((path) =>
    getBuilderPathTerms(path.slug, locale).filter((candidate) => candidate.id !== term.id).slice(0, 3),
  );
  const conceptGraph = getConceptGraph(term, locale, 3);
  const codeTerms = options.codeSnippet ? getCodeTerms(options.codeSnippet, locale) : [];
  const questionTerms = options.question ? getQuestionTerms(options.question, locale) : [];
  const categoryMeta = getCategoryMeta(term.category, locale);
  const mentalModel = getMentalModel(term, locale);
  const compactContext = getCompactContext(term, locale);

  const candidateTerms = uniqueTerms([
    term,
    ...relatedTerms,
    ...confusableTerms,
    ...nextConcepts,
    ...builderPathTerms,
    ...questionTerms,
    ...codeTerms,
    ...conceptGraph.flatMap((node) => [node.term, ...node.children]),
  ]).slice(0, 18);

  const sections = [
    `Current Term`,
    `- ID: ${term.id}`,
    `- Name: ${term.term}`,
    `- Category: ${categoryMeta.label}`,
    `- Definition: ${term.definition}`,
    term.aliases?.length ? `- Aliases: ${term.aliases.join(", ")}` : null,
    `- Mental Model: ${mentalModel}`,
    "",
    "Compact Context",
    compactContext,
    "",
    "Related Concepts",
    ...relatedTerms.map((candidate) => `- ${candidate.term} (${candidate.id}): ${trimDefinition(candidate.definition)}`),
    "",
    "Common Confusions",
    ...(confusableTerms.length > 0
      ? confusableTerms.map(
          (candidate) => `- ${candidate.term} (${candidate.id}): ${trimDefinition(candidate.definition, 170)}`,
        )
      : ["- None mapped for this term."]),
    "",
    "Next-step Terms",
    ...nextConcepts.map((candidate) => `- ${candidate.term} (${candidate.id}): ${trimDefinition(candidate.definition, 170)}`),
    "",
    "Builder Paths",
    ...(builderPaths.length > 0
      ? builderPaths.map((path) => `- ${path.title}: ${path.description}`)
      : ["- No builder path is directly attached to this term."]),
    "",
    "Concept Graph",
    ...(conceptGraph.length > 0
      ? conceptGraph.map(
          (node) =>
            `- ${node.term.term} (${node.term.id}) -> ${
              node.children.length > 0
                ? node.children.map((child) => `${child.term} (${child.id})`).join(", ")
                : "no mapped second-order children"
            }`,
        )
      : ["- No extra concept graph branches available."]),
    options.question?.trim()
      ? [
          "",
          "Question-matched Terms",
          ...questionTerms.map(
            (candidate) => `- ${candidate.term} (${candidate.id}): ${trimDefinition(candidate.definition, 160)}`,
          ),
        ]
      : null,
    options.codeSnippet?.trim()
      ? [
          "",
          "Code-matched Terms",
          ...codeTerms.map(
            (candidate) => `- ${candidate.term} (${candidate.id}): ${trimDefinition(candidate.definition, 160)}`,
          ),
        ]
      : null,
    "",
    "Available Glossary Terms For Linking",
    ...candidateTerms.map((candidate) => {
      const aliases = candidate.aliases?.length ? ` | aliases: ${candidate.aliases.join(", ")}` : "";
      return `- ${candidate.id}: ${candidate.term}${aliases}`;
    }),
  ]
    .flat()
    .filter((line): line is string => Boolean(line))
    .join("\n");

  return {
    term,
    candidateTerms,
    highlightTerms: candidateTerms.map(toLinkedTerm),
    mode: options.codeSnippet?.trim() ? "code" : "term",
    contextText: sections,
  };
}

function buildPrompt(bundle: GlossaryContextBundle, question: string, locale: Locale, codeSnippet?: string) {
  const language = getLocaleLabel(locale);
  const modeLine = bundle.mode === "code"
    ? "The user also provided Solana or Anchor code. Explain only what is supported by the code snippet and the glossary context."
    : "The user is asking about the current glossary term and its surrounding concepts.";

  const userSections = [
    `Answer language: ${language}`,
    modeLine,
    "",
    "Glossary context:",
    bundle.contextText,
    "",
    "User question:",
    question.trim(),
    codeSnippet?.trim()
      ? ["", "Code snippet:", "```", codeSnippet.trim(), "```"].join("\n")
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    system: [
      "You are Glossary Copilot, a senior Solana engineer embedded inside Glossary OS.",
      "Use the provided glossary context as the source of truth.",
      "Explain clearly, step by step, and connect concepts together for developers.",
      "Do not hallucinate missing facts. If the glossary context is insufficient, say so in caveat.",
      "For structured term references, only use glossary term IDs that appear in the provided context.",
    ].join(" "),
    user: userSections,
  };
}

function mapIdsToTerms(candidateTerms: GlossaryTerm[], entries: Array<{ term_id: string; reason: string }>) {
  const candidateMap = new Map(candidateTerms.map((term) => [term.id, term]));
  return entries
    .map((entry) => {
      const term = candidateMap.get(entry.term_id);
      if (!term) return null;
      return toLinkedReason(term, entry.reason);
    })
    .filter((entry): entry is CopilotLinkedReason => Boolean(entry));
}

function mapHighlightTerms(candidateTerms: GlossaryTerm[], mentionIds: string[]) {
  const candidateMap = new Map(candidateTerms.map((term) => [term.id, term]));
  return uniqueTerms(mentionIds.map((termId) => candidateMap.get(termId))).map(toLinkedTerm);
}

async function requestGemini(prompt: { system: string; user: string }): Promise<CopilotSchemaAnswer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: prompt.system }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt.user }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: COPILOT_SCHEMA.schema,
      },
    }),
  });

  if (!response.ok) {
    let message = `Gemini request failed with status ${response.status}.`;
    try {
      const errorPayload = await response.json();
      if (typeof errorPayload?.error?.message === "string") {
        message = errorPayload.error.message;
      }
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }

  const payload = await response.json();
  const outputText =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!outputText) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(outputText) as CopilotSchemaAnswer;
}

export async function generateCopilotAnswer(args: {
  termSlug: string;
  locale: Locale;
  question: string;
  codeSnippet?: string;
}): Promise<CopilotAnswer> {
  const bundle = getGlossaryContext(args.termSlug, {
    locale: args.locale,
    question: args.question,
    codeSnippet: args.codeSnippet,
  });
  const prompt = buildPrompt(bundle, args.question, args.locale, args.codeSnippet);
  const raw = await requestGemini(prompt);
  const keyConcepts = mapIdsToTerms(bundle.candidateTerms, raw.key_concepts).slice(0, 5);
  const suggestedNextTerms = mapIdsToTerms(bundle.candidateTerms, raw.suggested_next_terms).slice(0, 4);
  const highlightTerms = mapHighlightTerms(
    bundle.candidateTerms,
    uniqueTerms([
      ...raw.glossary_mentions.map((termId) => getTermById(termId, args.locale)),
      ...keyConcepts.map((item) => getTermById(item.id, args.locale)),
      ...suggestedNextTerms.map((item) => getTermById(item.id, args.locale)),
      bundle.term,
    ]).map((term) => term.id),
  );

  return {
    explanation: raw.explanation.trim(),
    keyConcepts,
    suggestedNextTerms,
    highlightTerms,
    caveat: raw.caveat.trim(),
    mode: bundle.mode,
  };
}
