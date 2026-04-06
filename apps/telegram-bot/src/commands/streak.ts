import { db, GROUP_STREAK_THRESHOLD } from "../db/index.js";
import type { MyContext } from "../context.js";
import { getBotDate } from "../utils/date.js";

export async function streakCommand(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("streak-no-user"));
    return;
  }

  const streak = await db.getOrCreateStreak(userId);
  const calendarDays = (await db.getUserStreakCalendar(userId)).map(
    (active, index, all) => {
      if (active) return "✅";
      if (index === all.length - 1) return "⏳";
      return "❌";
    },
  );
  const fireIntensity =
    streak.current_streak >= 30
      ? "🔥🔥🔥"
      : streak.current_streak >= 14
        ? "🔥🔥"
        : streak.current_streak >= 7
          ? "🔥"
          : "✨";

  const sections = [
    ctx.t("streak-message", {
      fire: fireIntensity,
      current: streak.current_streak,
      max: streak.max_streak,
      freezes: 1 - streak.streak_freezes_used,
      calendar: calendarDays.join(" "),
    }),
  ];

  const isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
  const chatId = ctx.chat?.id;

  if (isGroup && chatId) {
    sections.push(await buildGroupStreakSection(ctx, chatId, userId));
  }

  await ctx.reply(sections.join("\n\n"), { parse_mode: "HTML" });
}

async function buildGroupStreakSection(
  ctx: MyContext,
  chatId: number,
  userId: number,
): Promise<string> {
  await db.maybeResetGroupStreak(chatId);
  const groupStreak = await db.getOrCreateGroupStreak(chatId);
  const today = getBotDate();
  const participantsToday = await db.getGroupDailyParticipants(chatId, today);
  const hasParticipation = await db.hasGroupMembership(chatId, userId);
  const calendar = (await db.getGroupStreakCalendar(chatId))
    .map((active) => (active ? "✅" : "❌"))
    .join(" ");

  return [
    ctx.t("group-streak-section-title"),
    ctx.t("group-streak-current", { current: groupStreak.current_streak }),
    ctx.t("group-streak-record", { max: groupStreak.max_streak }),
    ctx.t("group-streak-today-progress", {
      count: participantsToday,
      threshold: GROUP_STREAK_THRESHOLD,
    }),
    "",
    ctx.t("group-streak-calendar-label"),
    calendar,
    "",
    hasParticipation
      ? ctx.t("group-rank-cta")
      : ctx.t("group-streak-no-participation"),
  ].join("\n");
}
