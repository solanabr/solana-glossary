// src/handlers/inline.ts
import { InlineQueryResultBuilder } from "grammy";
import { lookupTerm, getRandomTerms, findClosest } from "../utils/search.js";
import { formatTermCard } from "../utils/format.js";
import type { GlossaryTerm } from "../glossary/index.js";
import type { MyContext } from "../context.js";

// Intentionally uses formatTermCard (sync) instead of buildEnrichedTermCard (async).
// Inline queries must respond within ~5s; firing RPC/CoinGecko calls per result
// batch would risk timeouts. Live data is available via /explain and /glossary.
function buildInlineResult(term: GlossaryTerm, t: MyContext["t"]) {
  const card = formatTermCard(term, t);
  return InlineQueryResultBuilder.article(term.id, term.term, {
    description: term.definition.slice(0, 120),
  }).text(card, { parse_mode: "HTML" } as any);
}

export async function handleInlineQuery(ctx: MyContext): Promise<void> {
  const query = ctx.inlineQuery?.query.trim() ?? "";

  let terms: GlossaryTerm[];

  if (!query) {
    // Empty query: show 5 random terms as inspiration
    terms = getRandomTerms(5);
  } else {
    const result = lookupTerm(query);
    if (result.type === "not-found") {
      const suggestion = findClosest(query);
      terms = suggestion ? [suggestion] : [];
    } else if (result.type === "found") {
      terms = [result.term];
    } else {
      terms = result.terms;
    }
  }

  const results = terms.map((term) => buildInlineResult(term, ctx.t.bind(ctx)));

  await ctx.answerInlineQuery(results, {
    // Empty query = random terms per user; use cache_time:0 to avoid showing stale random terms
    // Keyed queries can be cached safely for 5 minutes
    cache_time: query ? 300 : 0,
    // Results depend on user's language preference — must be personal
    is_personal: true,
  });
}
