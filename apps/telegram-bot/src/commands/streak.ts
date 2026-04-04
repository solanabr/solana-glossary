// src/commands/streak.ts
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

export async function streakCommand(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("streak-no-user"));
    return;
  }

  const streak = db.getOrCreateStreak(userId);

  // Build calendar view (last 7 days)
  const calendarDays: string[] = [];
  const today = new Date();
  const lastQuizDate = streak.last_daily_date
    ? new Date(streak.last_daily_date)
    : null;

  for (let i = 6; i >= 0; i--) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (lastQuizDate && dateStr === streak.last_daily_date) {
      calendarDays.push("✅");
    } else if (i === 0) {
      calendarDays.push("⏳");
    } else {
      calendarDays.push("❌");
    }
  }

  // Fire emoji intensity based on streak
  const fireIntensity =
    streak.current_streak >= 30
      ? "🔥🔥🔥"
      : streak.current_streak >= 14
        ? "🔥🔥"
        : streak.current_streak >= 7
          ? "🔥"
          : "✨";

  const message = ctx.t("streak-message", {
    fire: fireIntensity,
    current: streak.current_streak,
    max: streak.max_streak,
    freezes: 1 - streak.streak_freezes_used,
    calendar: calendarDays.join(" "),
  });

  await ctx.reply(message, { parse_mode: "HTML" });
}
