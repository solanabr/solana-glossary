import * as userLibrary from "./user-library.js";
import * as streaks from "./streaks.js";
import * as groups from "./groups.js";
import * as notifications from "./notifications.js";
import * as quiz from "./quiz.js";

export { GROUP_STREAK_THRESHOLD, type QuizSession, type StoredPathProgress } from "./types.js";

export const db = {
  ...userLibrary,
  ...streaks,
  ...groups,
  scheduleNotification: notifications.scheduleNotification,
  getPendingNotifications: notifications.getPendingNotifications,
  markNotificationSent: notifications.markNotificationSent,
  clearPendingNotifications: notifications.clearPendingNotifications,
  clearOldNotifications: notifications.clearOldNotifications,
  resetWeeklyFreezes: notifications.resetWeeklyFreezesFromScheduler,
  ...quiz,
  close(): void {},
};
