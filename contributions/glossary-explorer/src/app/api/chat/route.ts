import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  explainConceptTool,
  getCategoryTermsTool,
  getRelatedTermsTool,
  glossaryStatsTool,
  lookupTermTool,
  searchTermsTool,
} from "@/lib/chat-tools";
import { isLocaleCode } from "@/lib/i18n";
import type { Category, ChatMode, LocaleCode } from "@/lib/types";

const categorySchema = z
  .string()
  .describe("Category slug such as 'defi', 'core-protocol', or 'dev-tools'.");

const modeInstructions: Record<ChatMode, string> = {
  normal:
    "Be direct, concise, and useful. Answer clearly without adding extra teaching theatrics.",
  learn:
    "Teach step by step. Use one concrete analogy when it helps, and optionally ask one short check-for-understanding question at the end.",
  bro: "Keep the tone playful and crypto-native, but stay technically correct and readable. Avoid turning every sentence into slang.",
};

function buildSystemPrompt({
  locale,
  mode,
  context,
}: {
  locale: LocaleCode;
  mode: ChatMode;
  context?: {
    pathname?: string;
    pageType?: string;
    focusId?: string;
    focusLabel?: string;
  };
}) {
  const contextLines = [
    context?.pathname ? `Current page path: ${context.pathname}` : null,
    context?.pageType ? `Current page type: ${context.pageType}` : null,
    context?.focusId
      ? `Current focus term/category id: ${context.focusId}`
      : null,
    context?.focusLabel ? `Current focus label: ${context.focusLabel}` : null,
  ].filter(Boolean);

  return `You are Ask Solana, an AI guide for solexicon — the Solana knowledge base.

You help users understand Solana concepts using glossary tools backed by an MCP server.
Always use the available tools before answering factual questions about terms, categories, relationships, or glossary stats.
Respond in locale "${locale}" unless the user explicitly asks for another language.
${modeInstructions[mode]}

Linking rules:
- When you mention a glossary term as a primary concept, use canonical markdown links like [PDA](/term/pda).
- When graph exploration would help, optionally add [View in Graph](/explore?highlight=pda).
- Never invent routes or IDs. Only link terms you are confident exist.

Style rules:
- Prefer short paragraphs or compact bullets.
- If a tool returns a long block, synthesize it instead of dumping it verbatim.
- If the user is comparing concepts, explicitly name the differences.

${
  contextLines.length > 0
    ? `Page context:\n${contextLines.map((line) => `- ${line}`).join("\n")}`
    : "Page context: none provided."
}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const locale = isLocaleCode(body.locale) ? body.locale : "en";
  const mode: ChatMode =
    body.mode === "learn" || body.mode === "bro" ? body.mode : "normal";
  const context =
    body.context &&
    typeof body.context === "object" &&
    !Array.isArray(body.context)
      ? body.context
      : undefined;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: buildSystemPrompt({ locale, mode, context }),
    messages,
    tools: {
      lookup_term: tool({
        description:
          "Look up one Solana glossary term by ID or alias and return the structured term object.",
        inputSchema: z.object({
          id: z
            .string()
            .describe("Term ID or alias such as 'pda' or 'proof-of-history'."),
        }),
        execute: async ({ id }) => lookupTermTool({ id, locale }),
      }),
      search_terms: tool({
        description:
          "Search the glossary by query across terms, definitions, ids, and aliases.",
        inputSchema: z.object({
          query: z.string().describe("Search query."),
          limit: z.number().min(1).max(10).optional().default(5),
        }),
        execute: async ({ query, limit }) =>
          searchTermsTool({ query, limit, locale }),
      }),
      get_category_terms: tool({
        description: "Get terms from a glossary category.",
        inputSchema: z.object({
          category: categorySchema,
        }),
        execute: async ({ category }) =>
          getCategoryTermsTool({
            category: category as Category,
            locale,
          }),
      }),
      get_related_terms: tool({
        description:
          "Traverse related terms from one concept using BFS depth 1 to 3.",
        inputSchema: z.object({
          id: z.string().describe("Starting term ID or alias."),
          depth: z.number().min(1).max(3).optional().default(1),
        }),
        execute: async ({ id, depth }) =>
          getRelatedTermsTool({ id, depth, locale }),
      }),
      explain_concept: tool({
        description:
          "Explain a term with its core definition and expanded related concepts.",
        inputSchema: z.object({
          id: z.string().describe("Term ID or alias."),
        }),
        execute: async ({ id }) => explainConceptTool({ id, locale }),
      }),
      glossary_stats: tool({
        description: "Get glossary-wide statistics and category breakdown.",
        inputSchema: z.object({}),
        execute: async () => glossaryStatsTool(),
      }),
    },
  });

  return result.toTextStreamResponse();
}
