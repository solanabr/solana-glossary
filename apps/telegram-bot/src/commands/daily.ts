// src/commands/daily.ts
import { allTerms } from "../glossary/index.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";
import { getEffectiveLocale } from "../utils/locale.js";
import { buildEnrichedTermCard } from "../utils/term-card.js";
import { getBotDate } from "../utils/date.js";

/** Returns the same term for every user on the app's canonical day. */
export function getDailyTerm(date: Date = new Date()) {
  const [year, month, day] = getBotDate(date).split("-").map(Number);
  const seed = year * 10000 + month * 100 + day;
  return allTerms[seed % allTerms.length];
}

export async function dailyTermCommand(ctx: MyContext): Promise<void> {
  const term = getDailyTerm();
  const userId = ctx.from?.id;

  let streakText = "";
  if (userId) {
    const { streak, isNew } = await db.viewDailyTerm(userId);
    if (isNew) {
      streakText =
        streak === 1
          ? ctx.t("streak-first")
          : ctx.t("streak-days", { count: streak });
    } else {
      streakText = ctx.t("streak-days", { count: streak });
    }
  }

  const header = streakText
    ? `📆 <b>${ctx.t("daily-term-header")}</b>  ${streakText}\n\n`
    : `📆 <b>${ctx.t("daily-term-header")}</b>\n\n`;

  const card = await buildEnrichedTermCard(
    term,
    ctx.t.bind(ctx),
    await getEffectiveLocale(ctx),
  );

  await ctx.reply(header + card, {
    parse_mode: "HTML",
    reply_markup: await buildTermKeyboard(term.id, ctx.t.bind(ctx), userId),
  });
}
