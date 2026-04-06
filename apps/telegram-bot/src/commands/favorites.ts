// src/commands/favorites.ts
import { getTerm } from "../glossary/index.js";
import { InlineKeyboard } from "grammy";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

export async function favoritesCommand(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  const favIds = await db.getFavorites(userId);

  if (favIds.length === 0) {
    await ctx.reply(ctx.t("favorites-empty"));
    return;
  }

  const header = ctx.t("favorites-header", { count: favIds.length });
  const keyboard = new InlineKeyboard();

  favIds.forEach((id, i) => {
    const term = getTerm(id);
    if (term) {
      keyboard.text(term.term, `select:${id}`);
      if (i < favIds.length - 1) keyboard.row();
    }
  });

  await ctx.reply(header, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
