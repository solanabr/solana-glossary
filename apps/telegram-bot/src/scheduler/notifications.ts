// src/scheduler/notifications.ts
import cron from "node-cron";
import { Bot } from "grammy";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

let isRunning = false;

export function startNotificationScheduler(bot: Bot<MyContext>): void {
  if (isRunning) return;
  isRunning = true;

  // Run every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    const now = new Date();
    const pendingNotifications = db.getPendingNotifications(now);

    for (const notification of pendingNotifications) {
      try {
        const streak = db.getOrCreateStreak(notification.user_id);

        if (
          notification.type === "streak_warning" &&
          streak.current_streak > 0
        ) {
          // Note: For full i18n, we'd need to store user's language preference
          // and use the i18n system. Using English as default for notifications.
          await bot.api.sendMessage(
            notification.user_id,
            `🔥 Streak Alert! You have 2 hours to take the /quiz and keep your ${streak.current_streak} day streak.`,
            { parse_mode: "HTML" },
          );
        }

        db.markNotificationSent(notification.id, now);
      } catch (err) {
        console.error(
          `Failed to send notification to ${notification.user_id}:`,
          err,
        );
      }
    }

    // Clean old notifications (older than 7 days)
    db.clearOldNotifications(7);
  });

  // Reset weekly freezes on Monday at 00:00
  cron.schedule("0 0 * * 1", () => {
    db.resetWeeklyFreezes();
    console.log("Weekly streak freezes reset");
  });

  console.log("Notification scheduler started (every 15 minutes)");
}

export function scheduleStreakWarning(
  userId: number,
  timezone: string = "America/Sao_Paulo",
): void {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);

  let warningTime = new Date(Date.UTC(year, month - 1, day, 22, 0, 0));
  if (now > warningTime) {
    warningTime = new Date(Date.UTC(year, month - 1, day + 1, 22, 0, 0));
  }

  db.clearPendingNotifications(userId, "streak_warning");
  db.scheduleNotification(userId, warningTime, "streak_warning");
}
