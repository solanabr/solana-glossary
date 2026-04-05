import { db } from "../db/index.js";
import type { GlossaryTerm } from "../glossary/index.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { findClosest, findTermsInText, lookupTerm } from "../utils/search.js";
import { buildEnrichedTermCard } from "../utils/term-card.js";
import type { MyContext } from "../context.js";

export async function explainCommand(ctx: MyContext): Promise<void> {
  const replyText =
    ctx.message?.reply_to_message?.text ??
    ctx.message?.reply_to_message?.caption ??
    "";
  const inlineQuery = typeof ctx.match === "string" ? ctx.match.trim() : "";
  const sourceText = replyText || inlineQuery;
  const isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";

  if (!sourceText) {
    if (isGroup) {
      console.warn("explain_missing_reply_context", {
        chat_id: ctx.chat?.id,
        user_id: ctx.from?.id,
        message_text: ctx.message?.text ?? "",
      });
      await ctx.reply(ctx.t("explain-missing-reply-context"), {
        parse_mode: "HTML",
      });
      return;
    }

    await ctx.reply(ctx.t("explain-no-reply"), {
      parse_mode: "HTML",
    });
    return;
  }

  const matches = findTermsInText(sourceText);
  if (matches.length > 0) {
    await replyWithSummary(ctx, matches.slice(0, 3));
    await replyWithTerms(ctx, matches.slice(0, 3));
    return;
  }

  const exact = lookupTerm(sourceText);
  if (exact.type === "found") {
    await replyWithTerms(ctx, [exact.term]);
    return;
  }

  const suggestion = findClosest(sourceText);
  if (suggestion) {
    await replyWithTerms(ctx, [suggestion]);
    return;
  }

  await ctx.reply(ctx.t("explain-not-found"), { parse_mode: "HTML" });
}

async function replyWithSummary(
  ctx: MyContext,
  terms: GlossaryTerm[],
): Promise<void> {
  if (terms.length === 0) return;

  const termsList = terms.map((term) => `<code>${term.id}</code>`).join(", ");
  await ctx.reply(
    ctx.t("explain-summary", {
      count: terms.length,
      terms: termsList,
    }),
    { parse_mode: "HTML" },
  );
}

async function replyWithTerms(
  ctx: MyContext,
  terms: GlossaryTerm[],
): Promise<void> {
  const userId = ctx.from?.id;

  for (const term of terms) {
    if (userId) {
      db.addHistory(userId, term.id);
    }

    const card = await buildEnrichedTermCard(
      term,
      ctx.t.bind(ctx),
      ctx.session.language || "en",
    );

    await ctx.reply(card, {
      parse_mode: "HTML",
      reply_markup: buildTermKeyboard(term.id, ctx.t.bind(ctx), userId),
    });
  }
}
