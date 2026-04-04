// src/commands/random.ts
import { allTerms } from "../glossary/index.js";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

export async function randomTermCommand(ctx: MyContext): Promise<void> {
  const term = allTerms[Math.floor(Math.random() * allTerms.length)];
  const userId = ctx.from?.id;

  // Add to history if user exists
  if (userId) {
    db.addHistory(userId, term.id);
  }

  const header = ctx.t("random-term-header");
  const card = formatTermCard(
    term,
    ctx.t.bind(ctx),
    ctx.session.language || "en",
  );

  await ctx.reply(`${header}\n\n${card}`, {
    parse_mode: "HTML",
    reply_markup: buildTermKeyboard(term.id, ctx.t.bind(ctx), userId),
  });
}
