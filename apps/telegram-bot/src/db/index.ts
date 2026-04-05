// src/db/index.ts
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH =
  process.env["BOT_DB_PATH"] || resolve(__dirname, "../../data/bot.db");
const DB_DIR = dirname(DB_PATH);

export interface QuizSession {
  termId: string;
  correctIdx: number;
  options: string[];
}

export interface StoredPathProgress {
  step: number;
  completed: boolean;
}

export const GROUP_STREAK_THRESHOLD = 2;

class DatabaseWrapper {
  private db: Database.Database;

  constructor() {
    mkdirSync(DB_DIR, { recursive: true });
    this.db = new Database(DB_PATH);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        language TEXT,
        first_name TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER NOT NULL,
        term_id TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        PRIMARY KEY (user_id, term_id)
      );

      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        term_id TEXT NOT NULL,
        viewed_at INTEGER DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id, viewed_at DESC);

      CREATE TABLE IF NOT EXISTS streaks (
        user_id INTEGER PRIMARY KEY,
        last_daily_date TEXT,
        streak_count INTEGER DEFAULT 0,
        max_streak INTEGER DEFAULT 0,
        streak_freezes_used INTEGER DEFAULT 0,
        freeze_reset_date TEXT,
        timezone TEXT DEFAULT 'America/Sao_Paulo',
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS scheduled_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        scheduled_at TEXT NOT NULL,
        sent_at TEXT,
        type TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES streaks(user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON scheduled_notifications(scheduled_at, sent_at);

      CREATE TABLE IF NOT EXISTS quiz_sessions (
        user_id INTEGER PRIMARY KEY,
        term_id TEXT NOT NULL,
        correct_idx INTEGER NOT NULL,
        options TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_daily_activity (
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        PRIMARY KEY (user_id, date)
      );

      CREATE TABLE IF NOT EXISTS user_path_progress (
        user_id INTEGER NOT NULL,
        path_id TEXT NOT NULL,
        step INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        started_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        PRIMARY KEY (user_id, path_id)
      );

      CREATE TABLE IF NOT EXISTS group_members (
        chat_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        last_seen INTEGER DEFAULT (unixepoch()),
        PRIMARY KEY (chat_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS group_streaks (
        chat_id INTEGER PRIMARY KEY,
        current_streak INTEGER DEFAULT 0,
        max_streak INTEGER DEFAULT 0,
        last_active_date TEXT,
        last_broken_announcement_date TEXT,
        updated_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS group_daily_participants (
        chat_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        PRIMARY KEY (chat_id, user_id, date)
      );
    `);

    // Migration: Add new columns to existing tables
    this.migrateStreaksTable();
    this.migrateUsersTable();
  }

  private getBotDate(date: Date = new Date()): string {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo",
    }).format(date);
  }

  private shiftDate(date: string, offsetDays: number): string {
    const base = new Date(`${date}T12:00:00Z`);
    base.setUTCDate(base.getUTCDate() + offsetDays);
    return base.toISOString().slice(0, 10);
  }

  private migrateStreaksTable(): void {
    try {
      // Check if max_streak column exists
      const tableInfo = this.db.prepare("PRAGMA table_info(streaks)").all() as {
        name: string;
      }[];
      const columns = tableInfo.map((col) => col.name);

      if (!columns.includes("max_streak")) {
        this.db.exec(
          `ALTER TABLE streaks ADD COLUMN max_streak INTEGER DEFAULT 0`,
        );
        console.log("✓ Migration: Added max_streak column");
      }

      if (!columns.includes("streak_freezes_used")) {
        this.db.exec(
          `ALTER TABLE streaks ADD COLUMN streak_freezes_used INTEGER DEFAULT 0`,
        );
        console.log("✓ Migration: Added streak_freezes_used column");
      }

      if (!columns.includes("freeze_reset_date")) {
        this.db.exec(`ALTER TABLE streaks ADD COLUMN freeze_reset_date TEXT`);
        console.log("✓ Migration: Added freeze_reset_date column");
      }

      if (!columns.includes("timezone")) {
        this.db.exec(
          `ALTER TABLE streaks ADD COLUMN timezone TEXT DEFAULT 'America/Sao_Paulo'`,
        );
        console.log("✓ Migration: Added timezone column");
      }

      if (!columns.includes("updated_at")) {
        // SQLite doesn't support functions as default in ALTER TABLE
        this.db.exec(
          `ALTER TABLE streaks ADD COLUMN updated_at INTEGER DEFAULT 0`,
        );
        // Update existing rows with current timestamp
        this.db.exec(
          `UPDATE streaks SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) WHERE updated_at = 0`,
        );
        console.log("✓ Migration: Added updated_at column");
      }
    } catch (err) {
      console.error("Migration error:", err);
    }
  }

  private migrateUsersTable(): void {
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info(users)").all() as {
        name: string;
      }[];
      const columns = tableInfo.map((col) => col.name);

      if (!columns.includes("first_name")) {
        this.db.exec(`ALTER TABLE users ADD COLUMN first_name TEXT`);
        console.log("✓ Migration: Added first_name column to users");
      }
    } catch (err) {
      console.error("Users migration error:", err);
    }
  }

  // Users
  getLanguage(userId: number): string | undefined {
    const row = this.db
      .prepare("SELECT language FROM users WHERE user_id = ?")
      .get(userId) as { language: string } | undefined;
    return row?.language;
  }

  setLanguage(userId: number, lang: string): void {
    this.db
      .prepare(
        "INSERT INTO users (user_id, language) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET language = excluded.language",
      )
      .run(userId, lang);
  }

  setFirstName(userId: number, firstName: string): void {
    this.db
      .prepare(
        "INSERT INTO users (user_id, first_name) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET first_name = excluded.first_name",
      )
      .run(userId, firstName);
  }

  // Favorites
  addFavorite(userId: number, termId: string): void {
    const count = this.db
      .prepare("SELECT COUNT(*) as count FROM favorites WHERE user_id = ?")
      .get(userId) as { count: number };
    if (count.count >= 50) {
      throw new Error("Favorites limit reached (50)");
    }
    this.db
      .prepare(
        "INSERT OR IGNORE INTO favorites (user_id, term_id) VALUES (?, ?)",
      )
      .run(userId, termId);
  }

  removeFavorite(userId: number, termId: string): void {
    this.db
      .prepare("DELETE FROM favorites WHERE user_id = ? AND term_id = ?")
      .run(userId, termId);
  }

  getFavorites(userId: number): string[] {
    const rows = this.db
      .prepare(
        "SELECT term_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
      )
      .all(userId) as { term_id: string }[];
    return rows.map((r) => r.term_id);
  }

  isFavorite(userId: number, termId: string): boolean {
    const row = this.db
      .prepare("SELECT 1 FROM favorites WHERE user_id = ? AND term_id = ?")
      .get(userId, termId);
    return !!row;
  }

  // History
  addHistory(userId: number, termId: string): void {
    this.db
      .prepare("INSERT INTO history (user_id, term_id) VALUES (?, ?)")
      .run(userId, termId);
    // Keep only last 10
    this.db
      .prepare(
        `
      DELETE FROM history WHERE id IN (
        SELECT id FROM history WHERE user_id = ? ORDER BY viewed_at DESC LIMIT -1 OFFSET 10
      )
    `,
      )
      .run(userId);
  }

  getHistory(userId: number): string[] {
    const rows = this.db
      .prepare(
        "SELECT term_id FROM history WHERE user_id = ? ORDER BY viewed_at DESC LIMIT 10",
      )
      .all(userId) as { term_id: string }[];
    return rows.map((r) => r.term_id);
  }

  // Streaks
  viewDailyTerm(userId: number): { streak: number; isNew: boolean } {
    const today = new Date().toISOString().split("T")[0];
    const row = this.db
      .prepare(
        "SELECT last_daily_date, streak_count, max_streak FROM streaks WHERE user_id = ?",
      )
      .get(userId) as
      | {
          last_daily_date: string;
          streak_count: number;
          max_streak: number;
        }
      | undefined;

    if (!row) {
      this.db
        .prepare(
          "INSERT INTO streaks (user_id, last_daily_date, streak_count, max_streak, updated_at) VALUES (?, ?, 1, 1, unixepoch())",
        )
        .run(userId, today);
      return { streak: 1, isNew: true };
    }

    if (row.last_daily_date === today) {
      if (row.streak_count > row.max_streak) {
        this.db
          .prepare(
            "UPDATE streaks SET max_streak = ?, updated_at = unixepoch() WHERE user_id = ?",
          )
          .run(row.streak_count, userId);
      }
      return { streak: row.streak_count, isNew: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak: number;
    if (row.last_daily_date === yesterdayStr) {
      newStreak = row.streak_count + 1;
    } else {
      newStreak = 1;
    }

    const newMax = Math.max(newStreak, row.max_streak);
    this.db
      .prepare(
        "UPDATE streaks SET last_daily_date = ?, streak_count = ?, max_streak = ?, updated_at = unixepoch() WHERE user_id = ?",
      )
      .run(today, newStreak, newMax, userId);
    return { streak: newStreak, isNew: true };
  }

  // Enhanced Streaks
  getOrCreateStreak(userId: number): {
    user_id: number;
    current_streak: number;
    max_streak: number;
    last_daily_date: string | null;
    streak_freezes_used: number;
    freeze_reset_date: string | null;
    timezone: string;
  } {
    const row = this.db
      .prepare(
        "SELECT user_id, streak_count as current_streak, max_streak, last_daily_date, streak_freezes_used, freeze_reset_date, timezone FROM streaks WHERE user_id = ?",
      )
      .get(userId) as
      | {
          user_id: number;
          current_streak: number;
          max_streak: number;
          last_daily_date: string | null;
          streak_freezes_used: number;
          freeze_reset_date: string | null;
          timezone: string;
        }
      | undefined;

    if (row) return row;

    this.db
      .prepare(
        "INSERT INTO streaks (user_id, streak_count, max_streak) VALUES (?, 0, 0)",
      )
      .run(userId);

    return {
      user_id: userId,
      current_streak: 0,
      max_streak: 0,
      last_daily_date: null,
      streak_freezes_used: 0,
      freeze_reset_date: null,
      timezone: "America/Sao_Paulo",
    };
  }

  incrementStreak(userId: number): {
    current: number;
    max: number;
    isNewRecord: boolean;
  } {
    const today = new Date().toISOString().split("T")[0];
    const streak = this.getOrCreateStreak(userId);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newCurrent: number;
    let isNewRecord = false;

    if (streak.last_daily_date === today) {
      // Already did quiz today, no change
      if (streak.current_streak > streak.max_streak) {
        this.db
          .prepare(
            "UPDATE streaks SET max_streak = ?, updated_at = unixepoch() WHERE user_id = ?",
          )
          .run(streak.current_streak, userId);
        this.recordUserDailyActivity(userId, today);
        return {
          current: streak.current_streak,
          max: streak.current_streak,
          isNewRecord: false,
        };
      }
      this.recordUserDailyActivity(userId, today);
      return {
        current: streak.current_streak,
        max: streak.max_streak,
        isNewRecord: false,
      };
    } else if (
      streak.last_daily_date === yesterdayStr ||
      streak.last_daily_date === null
    ) {
      // Continue or start streak
      newCurrent = streak.current_streak + 1;
    } else {
      // Check if can use freeze
      if (
        streak.streak_freezes_used === 0 &&
        this.canUseFreeze(streak.freeze_reset_date)
      ) {
        newCurrent = streak.current_streak + 1;
        this.useStreakFreeze(userId);
      } else {
        newCurrent = 1; // Reset streak
      }
    }

    const newMax = Math.max(newCurrent, streak.max_streak);
    isNewRecord = newMax > streak.max_streak && newMax > 1;

    this.db
      .prepare(
        "UPDATE streaks SET last_daily_date = ?, streak_count = ?, max_streak = ?, updated_at = unixepoch() WHERE user_id = ?",
      )
      .run(today, newCurrent, newMax, userId);

    this.recordUserDailyActivity(userId, today);

    return { current: newCurrent, max: newMax, isNewRecord };
  }

  private recordUserDailyActivity(userId: number, date: string): void {
    this.db
      .prepare(
        "INSERT OR IGNORE INTO user_daily_activity (user_id, date) VALUES (?, ?)",
      )
      .run(userId, date);
  }

  getUserStreakCalendar(userId: number): boolean[] {
    const today = new Date().toISOString().slice(0, 10);
    const days = Array.from({ length: 7 }, (_, index) =>
      this.shiftDate(today, index - 6),
    );

    return days.map((date) => {
      const row = this.db
        .prepare(
          "SELECT 1 FROM user_daily_activity WHERE user_id = ? AND date = ? LIMIT 1",
        )
        .get(userId, date);
      return Boolean(row);
    });
  }

  private canUseFreeze(freezeResetDate: string | null): boolean {
    if (!freezeResetDate) return true;
    const now = new Date();
    const reset = new Date(freezeResetDate);
    return now > reset;
  }

  private useStreakFreeze(userId: number): void {
    const nextMonday = this.getNextMonday();
    this.db
      .prepare(
        "UPDATE streaks SET streak_freezes_used = streak_freezes_used + 1, freeze_reset_date = ? WHERE user_id = ?",
      )
      .run(nextMonday.toISOString().split("T")[0], userId);
  }

  private getNextMonday(): Date {
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
    nextMonday.setHours(0, 0, 0, 0);
    if (nextMonday <= now) {
      nextMonday.setDate(nextMonday.getDate() + 7);
    }
    return nextMonday;
  }

  resetWeeklyFreezes(): void {
    const nextMonday = this.getNextMonday();
    this.db
      .prepare(
        "UPDATE streaks SET streak_freezes_used = 0, freeze_reset_date = ? WHERE freeze_reset_date IS NOT NULL AND freeze_reset_date <= date('now')",
      )
      .run(nextMonday.toISOString().split("T")[0]);
  }

  setTimezone(userId: number, timezone: string): void {
    this.db
      .prepare("UPDATE streaks SET timezone = ? WHERE user_id = ?")
      .run(timezone, userId);
  }

  // Leaderboard
  getTop10(): { user_id: number; max_streak: number; first_name: string }[] {
    const rows = this.db
      .prepare(
        `
      SELECT s.user_id, s.max_streak, u.first_name
      FROM streaks s
      LEFT JOIN users u ON s.user_id = u.user_id
      WHERE s.max_streak > 0
      ORDER BY s.max_streak DESC, s.updated_at ASC
      LIMIT 10
    `,
      )
      .all() as {
      user_id: number;
      max_streak: number;
      first_name: string | null;
    }[];

    return rows.map((r, idx) => ({
      ...r,
      first_name: r.first_name || `User ${idx + 1}`,
    }));
  }

  getUserRank(
    userId: number,
  ): { rank: number; total: number; max_streak: number } | null {
    const totalRow = this.db
      .prepare("SELECT COUNT(*) as count FROM streaks WHERE max_streak > 0")
      .get() as { count: number };

    const rankRow = this.db
      .prepare(
        `
      SELECT COUNT(*) + 1 as rank, max_streak
      FROM streaks
      WHERE max_streak > (SELECT max_streak FROM streaks WHERE user_id = ?)
    `,
      )
      .get(userId) as { rank: number; max_streak: number } | undefined;

    if (!rankRow) return null;

    return {
      rank: rankRow.rank,
      total: totalRow.count,
      max_streak: rankRow.max_streak,
    };
  }

  getNearbyRanks(
    userId: number,
    range: number = 2,
  ): {
    rank: number;
    user_id: number;
    max_streak: number;
    isCurrentUser: boolean;
  }[] {
    const userRankRow = this.db
      .prepare(
        `
      SELECT COUNT(*) + 1 as rank
      FROM streaks
      WHERE max_streak > (SELECT max_streak FROM streaks WHERE user_id = ?)
    `,
      )
      .get(userId) as { rank: number } | undefined;

    if (!userRankRow) return [];

    const userRank = userRankRow.rank;

    const rows = this.db
      .prepare(
        `
      SELECT user_id, max_streak,
        (SELECT COUNT(*) + 1 FROM streaks s2 WHERE s2.max_streak > s.max_streak) as rank
      FROM streaks s
      WHERE max_streak > 0
      ORDER BY max_streak DESC, updated_at ASC
    `,
      )
      .all() as { user_id: number; max_streak: number; rank: number }[];

    const userIndex = rows.findIndex((r) => r.user_id === userId);
    if (userIndex === -1) return [];

    const start = Math.max(0, userIndex - range);
    const end = Math.min(rows.length, userIndex + range + 1);

    return rows
      .slice(start, end)
      .map((r) => ({ ...r, isCurrentUser: r.user_id === userId }));
  }

  recordGroupMember(chatId: number, userId: number): void {
    this.db
      .prepare(
        `INSERT INTO group_members (chat_id, user_id, last_seen)
         VALUES (?, ?, unixepoch())
         ON CONFLICT(chat_id, user_id) DO UPDATE SET last_seen = unixepoch()`,
      )
      .run(chatId, userId);
  }

  hasGroupMembership(chatId: number, userId: number): boolean {
    const row = this.db
      .prepare(
        "SELECT 1 FROM group_members WHERE chat_id = ? AND user_id = ? LIMIT 1",
      )
      .get(chatId, userId);
    return Boolean(row);
  }

  getGroupTop10(
    chatId: number,
  ): { user_id: number; max_streak: number; first_name: string }[] {
    const rows = this.db
      .prepare(
        `
        SELECT s.user_id, s.max_streak, u.first_name
        FROM streaks s
        JOIN group_members gm ON s.user_id = gm.user_id
        LEFT JOIN users u ON s.user_id = u.user_id
        WHERE gm.chat_id = ? AND s.max_streak > 0
        ORDER BY s.max_streak DESC, s.updated_at ASC
        LIMIT 10
      `,
      )
      .all(chatId) as {
      user_id: number;
      max_streak: number;
      first_name: string | null;
    }[];

    return rows.map((row, index) => ({
      ...row,
      first_name: row.first_name || `User ${index + 1}`,
    }));
  }

  getGroupRank(
    chatId: number,
    userId: number,
  ): { rank: number; total: number; max_streak: number } | null {
    const rows = this.db
      .prepare(
        `
        SELECT s.user_id, s.max_streak
        FROM streaks s
        JOIN group_members gm ON s.user_id = gm.user_id
        WHERE gm.chat_id = ? AND s.max_streak > 0
        ORDER BY s.max_streak DESC, s.updated_at ASC
      `,
      )
      .all(chatId) as { user_id: number; max_streak: number }[];

    const index = rows.findIndex((row) => row.user_id === userId);
    if (index === -1) return null;

    return {
      rank: index + 1,
      total: rows.length,
      max_streak: rows[index]?.max_streak ?? 0,
    };
  }

  getOrCreateGroupStreak(chatId: number): {
    current_streak: number;
    max_streak: number;
    last_active_date: string | null;
    last_broken_announcement_date: string | null;
  } {
    const row = this.db
      .prepare(
        `SELECT current_streak, max_streak, last_active_date, last_broken_announcement_date
         FROM group_streaks
         WHERE chat_id = ?`,
      )
      .get(chatId) as
      | {
          current_streak: number;
          max_streak: number;
          last_active_date: string | null;
          last_broken_announcement_date: string | null;
        }
      | undefined;

    if (row) return row;

    this.db
      .prepare("INSERT INTO group_streaks (chat_id) VALUES (?)")
      .run(chatId);

    return {
      current_streak: 0,
      max_streak: 0,
      last_active_date: null,
      last_broken_announcement_date: null,
    };
  }

  maybeResetGroupStreak(chatId: number): {
    wasBroken: boolean;
    current: number;
    max: number;
    lastActiveDate: string | null;
  } {
    const today = this.getBotDate();
    const yesterday = this.shiftDate(today, -1);
    const streak = this.getOrCreateGroupStreak(chatId);

    if (
      !streak.last_active_date ||
      streak.last_active_date === today ||
      streak.last_active_date === yesterday
    ) {
      return {
        wasBroken: false,
        current: streak.current_streak,
        max: streak.max_streak,
        lastActiveDate: streak.last_active_date,
      };
    }

    const shouldAnnounce = streak.last_broken_announcement_date !== today;

    this.db
      .prepare(
        `UPDATE group_streaks
         SET current_streak = 0,
             last_broken_announcement_date = ?,
             updated_at = unixepoch()
         WHERE chat_id = ?`,
      )
      .run(today, chatId);

    return {
      wasBroken: shouldAnnounce,
      current: 0,
      max: streak.max_streak,
      lastActiveDate: streak.last_active_date,
    };
  }

  recordGroupParticipant(
    chatId: number,
    userId: number,
  ): { participantsToday: number; alreadyParticipated: boolean; date: string } {
    const today = this.getBotDate();
    const result = this.db
      .prepare(
        `INSERT OR IGNORE INTO group_daily_participants (chat_id, user_id, date)
         VALUES (?, ?, ?)`,
      )
      .run(chatId, userId, today);

    return {
      participantsToday: this.getGroupDailyParticipants(chatId, today),
      alreadyParticipated: result.changes === 0,
      date: today,
    };
  }

  getGroupDailyParticipants(chatId: number, date: string): number {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM group_daily_participants
         WHERE chat_id = ? AND date = ?`,
      )
      .get(chatId, date) as { count: number };
    return row.count;
  }

  incrementGroupStreak(chatId: number): {
    newStreak: number;
    newMax: number;
    isNewRecord: boolean;
    justCrossedThreshold: boolean;
  } {
    const today = this.getBotDate();
    const streak = this.getOrCreateGroupStreak(chatId);

    if (streak.last_active_date === today) {
      return {
        newStreak: streak.current_streak,
        newMax: streak.max_streak,
        isNewRecord: false,
        justCrossedThreshold: false,
      };
    }

    const newStreak = streak.current_streak + 1;
    const newMax = Math.max(newStreak, streak.max_streak);
    const justCrossedThreshold = streak.current_streak === 0;

    this.db
      .prepare(
        `UPDATE group_streaks
         SET current_streak = ?,
             max_streak = ?,
             last_active_date = ?,
             updated_at = unixepoch()
         WHERE chat_id = ?`,
      )
      .run(newStreak, newMax, today, chatId);

    return {
      newStreak,
      newMax,
      isNewRecord: newMax > streak.max_streak,
      justCrossedThreshold,
    };
  }

  getGroupStreakCalendar(chatId: number): boolean[] {
    const today = this.getBotDate();
    const days = Array.from({ length: 7 }, (_, index) =>
      this.shiftDate(today, index - 6),
    );

    return days.map(
      (date) =>
        this.getGroupDailyParticipants(chatId, date) >= GROUP_STREAK_THRESHOLD,
    );
  }

  // Notifications
  scheduleNotification(userId: number, scheduledAt: Date, type: string): void {
    this.db
      .prepare(
        "INSERT INTO scheduled_notifications (user_id, scheduled_at, type) VALUES (?, ?, ?)",
      )
      .run(userId, scheduledAt.toISOString(), type);
  }

  getPendingNotifications(
    beforeTime: Date,
  ): { id: number; user_id: number; type: string }[] {
    return this.db
      .prepare(
        "SELECT id, user_id, type FROM scheduled_notifications WHERE scheduled_at <= ? AND sent_at IS NULL",
      )
      .all(beforeTime.toISOString()) as {
      id: number;
      user_id: number;
      type: string;
    }[];
  }

  markNotificationSent(id: number, sentAt: Date): void {
    this.db
      .prepare("UPDATE scheduled_notifications SET sent_at = ? WHERE id = ?")
      .run(sentAt.toISOString(), id);
  }

  clearPendingNotifications(userId: number, type: string): void {
    this.db
      .prepare(
        "DELETE FROM scheduled_notifications WHERE user_id = ? AND type = ? AND sent_at IS NULL",
      )
      .run(userId, type);
  }

  clearOldNotifications(days: number = 7): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    this.db
      .prepare("DELETE FROM scheduled_notifications WHERE sent_at < ?")
      .run(cutoff.toISOString());
  }

  // Quiz
  saveQuizSession(
    userId: number,
    termId: string,
    correctIdx: number,
    options: string[],
  ): void {
    this.db
      .prepare(
        "INSERT INTO quiz_sessions (user_id, term_id, correct_idx, options) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET term_id = excluded.term_id, correct_idx = excluded.correct_idx, options = excluded.options",
      )
      .run(userId, termId, correctIdx, JSON.stringify(options));
  }

  getQuizSession(userId: number): QuizSession | undefined {
    const row = this.db
      .prepare(
        "SELECT term_id, correct_idx, options FROM quiz_sessions WHERE user_id = ?",
      )
      .get(userId) as
      | { term_id: string; correct_idx: number; options: string }
      | undefined;
    if (!row) return undefined;
    return {
      termId: row.term_id,
      correctIdx: row.correct_idx,
      options: JSON.parse(row.options),
    };
  }

  clearQuizSession(userId: number): void {
    this.db.prepare("DELETE FROM quiz_sessions WHERE user_id = ?").run(userId);
  }

  // Learning paths
  getPathProgress(
    userId: number,
    pathId: string,
  ): StoredPathProgress | undefined {
    const row = this.db
      .prepare(
        "SELECT step, completed FROM user_path_progress WHERE user_id = ? AND path_id = ?",
      )
      .get(userId, pathId) as { step: number; completed: number } | undefined;

    if (!row) return undefined;

    return {
      step: row.step,
      completed: row.completed === 1,
    };
  }

  setPathStep(userId: number, pathId: string, step: number): void {
    this.db
      .prepare(
        `INSERT INTO user_path_progress (user_id, path_id, step, completed, updated_at)
         VALUES (?, ?, ?, 0, unixepoch())
         ON CONFLICT(user_id, path_id) DO UPDATE SET
           step = excluded.step,
           updated_at = unixepoch()`,
      )
      .run(userId, pathId, step);
  }

  markPathCompleted(userId: number, pathId: string): void {
    this.db
      .prepare(
        `UPDATE user_path_progress
         SET completed = 1, updated_at = unixepoch()
         WHERE user_id = ? AND path_id = ?`,
      )
      .run(userId, pathId);
  }

  resetPath(userId: number, pathId: string): void {
    this.db
      .prepare(
        "DELETE FROM user_path_progress WHERE user_id = ? AND path_id = ?",
      )
      .run(userId, pathId);
  }

  getAllPathProgress(userId: number): Record<string, StoredPathProgress> {
    const rows = this.db
      .prepare(
        "SELECT path_id, step, completed FROM user_path_progress WHERE user_id = ?",
      )
      .all(userId) as { path_id: string; step: number; completed: number }[];

    return Object.fromEntries(
      rows.map((row) => [
        row.path_id,
        {
          step: row.step,
          completed: row.completed === 1,
        },
      ]),
    );
  }

  close(): void {
    this.db.close();
  }
}

export const db = new DatabaseWrapper();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Closing database...");
  db.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Closing database...");
  db.close();
  process.exit(0);
});
