// src/handlers/text.ts
import { lookupTerm } from "../utils/search.js";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard, buildSelectKeyboard } from "../utils/keyboard.js";
import type { MyContext } from "../context.js";

export async function handleTextMessage(ctx: MyContext): Promise<void> {
  // Only respond to free text in private chats (DMs)
  if (ctx.chat?.type !== "private") return;

  const text = ctx.message?.text?.trim() ?? "";
  if (!text) return;

  const result = lookupTerm(text);

  if (result.type === "not-found") {
    await ctx.reply(ctx.t("term-not-found", { query: text }), { parse_mode: "HTML" });
    return;
  }

  if (result.type === "found") {
    const userId = ctx.from?.id;
    const card = formatTermCard(result.term, ctx.t.bind(ctx), ctx.session.language || "en");
    await ctx.reply(card, {
      parse_mode: "HTML",
      reply_markup: buildTermKeyboard(result.term.id, ctx.t.bind(ctx), userId),
    });
    return;
  }

  // Multiple results
  const header = ctx.t("multiple-results", { count: result.terms.length, query: text });
  await ctx.reply(header, {
    parse_mode: "HTML",
    reply_markup: buildSelectKeyboard(result.terms),
  });
}
