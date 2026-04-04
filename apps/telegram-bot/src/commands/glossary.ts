// src/commands/glossary.ts
import { lookupTerm, findClosest } from "../utils/search.js";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard, buildSelectKeyboard } from "../utils/keyboard.js";
import { InlineKeyboard } from "grammy";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

export async function glossaryCommand(ctx: MyContext): Promise<void> {
  const query = (ctx.match as string).trim();

  if (!query) {
    ctx.session.awaitingGlossaryQuery = true;
    await ctx.reply(ctx.t("prompt-glossary-query"), {
      parse_mode: "HTML",
      reply_markup: { force_reply: true, selective: true },
    });
    return;
  }

  ctx.session.awaitingGlossaryQuery = false;

  const result = lookupTerm(query);

  if (result.type === "not-found") {
    // Try did-you-mean
    const closest = findClosest(query);
    if (closest) {
      const keyboard = new InlineKeyboard().text(
        ctx.t("btn-did-you-mean"),
        `select:${closest.id}`,
      );
      await ctx.reply(ctx.t("did-you-mean", { term: closest.id }), {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply(ctx.t("term-not-found", { query }), {
        parse_mode: "HTML",
      });
    }
    return;
  }

  if (result.type === "found") {
    const userId = ctx.from?.id;
    if (userId) {
      db.addHistory(userId, result.term.id);
    }

    const card = formatTermCard(
      result.term,
      ctx.t.bind(ctx),
      ctx.session.language || "en",
    );
    await ctx.reply(card, {
      parse_mode: "HTML",
      reply_markup: buildTermKeyboard(result.term.id, ctx.t.bind(ctx), userId),
    });
    return;
  }

  // Multiple results — show a selection list with inline buttons
  const header = ctx.t("multiple-results", {
    count: result.terms.length,
    query,
  });
  await ctx.reply(header, {
    parse_mode: "HTML",
    reply_markup: buildSelectKeyboard(result.terms),
  });
}
