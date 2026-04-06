// src/commands/history.ts
import { getTerm } from "../glossary/index.js";
import { InlineKeyboard } from "grammy";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

export async function historyCommand(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  const historyIds = await db.getHistory(userId);

  if (historyIds.length === 0) {
    await ctx.reply(ctx.t("history-empty"));
    return;
  }

  const header = ctx.t("history-header");
  const keyboard = new InlineKeyboard();

  historyIds.forEach((id, i) => {
    const term = getTerm(id);
    if (term) {
      keyboard.text(term.term, `select:${id}`);
      if (i < historyIds.length - 1) keyboard.row();
    }
  });

  await ctx.reply(header, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
