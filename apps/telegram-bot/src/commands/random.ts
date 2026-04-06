// src/commands/random.ts
import { allTerms } from "../glossary/index.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";
import { getEffectiveLocale } from "../utils/locale.js";
import { buildEnrichedTermCard } from "../utils/term-card.js";

export async function randomTermCommand(ctx: MyContext): Promise<void> {
  const term = allTerms[Math.floor(Math.random() * allTerms.length)];
  const userId = ctx.from?.id;

  // Add to history if user exists
  if (userId) {
    await db.addHistory(userId, term.id);
  }

  const header = ctx.t("random-term-header");
  const card = await buildEnrichedTermCard(
    term,
    ctx.t.bind(ctx),
    await getEffectiveLocale(ctx),
  );

  await ctx.reply(`${header}\n\n${card}`, {
    parse_mode: "HTML",
    reply_markup: await buildTermKeyboard(term.id, ctx.t.bind(ctx), userId),
  });
}
