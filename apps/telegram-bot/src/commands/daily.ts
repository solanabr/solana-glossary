// src/commands/daily.ts
import { allTerms } from "../glossary/index.js";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

/** Returns the same term for every user on a given day (date-based seed) */
function getDailyTerm() {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return allTerms[seed % allTerms.length];
}

export async function dailyTermCommand(ctx: MyContext): Promise<void> {
  const term = getDailyTerm();
  const userId = ctx.from?.id;

  let streakText = "";
  if (userId) {
    const { streak, isNew } = db.viewDailyTerm(userId);
    if (isNew) {
      // First time viewing today's term
      if (streak === 1) {
        streakText = ctx.t("streak-first");
      } else {
        streakText = ctx.t("streak-days", { count: streak });
      }
    } else {
      // Already viewed today, just show current streak
      streakText = ctx.t("streak-days", { count: streak });
    }
  }

  const header = streakText
    ? `📅 <b>${ctx.t("daily-term-header")}</b>  ${streakText}\n\n`
    : `📅 <b>${ctx.t("daily-term-header")}</b>\n\n`;

  const card = formatTermCard(
    term,
    ctx.t.bind(ctx),
    ctx.session.language || "en",
  );

  await ctx.reply(header + card, {
    parse_mode: "HTML",
    reply_markup: buildTermKeyboard(term.id, ctx.t.bind(ctx), userId),
  });
}
