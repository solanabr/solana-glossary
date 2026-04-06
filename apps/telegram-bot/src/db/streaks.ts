import { getSupabase } from "./client.js";
import {
  asNumber,
  canUseFreeze,
  getNextMonday,
  getUtcDate,
  shiftDate,
} from "./helpers.js";
import type { StreakRow } from "./types.js";

async function getFirstNamesByUserId(
  userIds: number[],
): Promise<Map<number, string>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await getSupabase()
    .from("users")
    .select("user_id, first_name")
    .in("user_id", userIds);

  if (error) throw error;

  return new Map(
    (data ?? []).map((row: { user_id: number; first_name: string | null }) => [
      asNumber(row.user_id),
      row.first_name ?? "",
    ]),
  );
}

async function recordUserDailyActivity(userId: number, date: string): Promise<void> {
  const { error } = await getSupabase()
    .from("user_daily_activity")
    .upsert({ user_id: userId, date }, { onConflict: "user_id,date" });

  if (error) throw error;
}

async function useStreakFreeze(userId: number): Promise<void> {
  const streak = await getOrCreateStreak(userId);
  const { error } = await getSupabase()
    .from("streaks")
    .update({
      streak_freezes_used: streak.streak_freezes_used + 1,
      freeze_reset_date: getNextMonday().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;
}

export async function viewDailyTerm(
  userId: number,
): Promise<{ streak: number; isNew: boolean }> {
  const today = getUtcDate();
  const { data, error } = await getSupabase()
    .from("streaks")
    .select("last_daily_date, streak_count, max_streak")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { error: insertError } = await getSupabase().from("streaks").insert({
      user_id: userId,
      last_daily_date: today,
      streak_count: 1,
      max_streak: 1,
    });
    if (insertError) throw insertError;
    return { streak: 1, isNew: true };
  }

  const streakData = data as {
    last_daily_date: string | null;
    streak_count: number;
    max_streak: number;
  };

  if (streakData.last_daily_date === today) {
    if (streakData.streak_count > streakData.max_streak) {
      const { error: updateError } = await getSupabase()
        .from("streaks")
        .update({
          max_streak: streakData.streak_count,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (updateError) throw updateError;
    }
    return { streak: streakData.streak_count, isNew: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getUtcDate(yesterday);
  const newStreak =
    streakData.last_daily_date === yesterdayStr
      ? streakData.streak_count + 1
      : 1;
  const newMax = Math.max(newStreak, streakData.max_streak);

  const { error: updateError } = await getSupabase()
    .from("streaks")
    .update({
      last_daily_date: today,
      streak_count: newStreak,
      max_streak: newMax,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) throw updateError;
  return { streak: newStreak, isNew: true };
}

export async function getOrCreateStreak(userId: number): Promise<{
  user_id: number;
  current_streak: number;
  max_streak: number;
  last_daily_date: string | null;
  streak_freezes_used: number;
  freeze_reset_date: string | null;
  timezone: string;
}> {
  const { data, error } = await getSupabase()
    .from("streaks")
    .select(
      "user_id, streak_count, max_streak, last_daily_date, streak_freezes_used, freeze_reset_date, timezone",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    const streak = data as StreakRow;
    return {
      user_id: streak.user_id,
      current_streak: streak.streak_count,
      max_streak: streak.max_streak,
      last_daily_date: streak.last_daily_date,
      streak_freezes_used: streak.streak_freezes_used,
      freeze_reset_date: streak.freeze_reset_date,
      timezone: streak.timezone ?? "America/Sao_Paulo",
    };
  }

  const { error: insertError } = await getSupabase().from("streaks").insert({
    user_id: userId,
    streak_count: 0,
    max_streak: 0,
    timezone: "America/Sao_Paulo",
  });

  if (insertError) throw insertError;

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

export async function incrementStreak(userId: number): Promise<{
  current: number;
  max: number;
  isNewRecord: boolean;
}> {
  const today = getUtcDate();
  const streak = await getOrCreateStreak(userId);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getUtcDate(yesterday);

  let newCurrent: number;
  let isNewRecord = false;

  if (streak.last_daily_date === today) {
    if (streak.current_streak > streak.max_streak) {
      const { error } = await getSupabase()
        .from("streaks")
        .update({
          max_streak: streak.current_streak,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw error;
      await recordUserDailyActivity(userId, today);
      return {
        current: streak.current_streak,
        max: streak.current_streak,
        isNewRecord: false,
      };
    }

    await recordUserDailyActivity(userId, today);
    return {
      current: streak.current_streak,
      max: streak.max_streak,
      isNewRecord: false,
    };
  }

  if (
    streak.last_daily_date === yesterdayStr ||
    streak.last_daily_date === null
  ) {
    newCurrent = streak.current_streak + 1;
  } else if (
    streak.streak_freezes_used === 0 &&
    canUseFreeze(streak.freeze_reset_date)
  ) {
    newCurrent = streak.current_streak + 1;
    await useStreakFreeze(userId);
  } else {
    newCurrent = 1;
  }

  const newMax = Math.max(newCurrent, streak.max_streak);
  isNewRecord = newMax > streak.max_streak && newMax > 1;

  const { error } = await getSupabase()
    .from("streaks")
    .update({
      last_daily_date: today,
      streak_count: newCurrent,
      max_streak: newMax,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;

  await recordUserDailyActivity(userId, today);
  return { current: newCurrent, max: newMax, isNewRecord };
}

export async function getUserStreakCalendar(userId: number): Promise<boolean[]> {
  const today = getUtcDate();
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(today, index - 6));
  const { data, error } = await getSupabase()
    .from("user_daily_activity")
    .select("date")
    .eq("user_id", userId)
    .in("date", days);

  if (error) throw error;

  const activeDates = new Set((data ?? []).map((row: { date: string }) => row.date));
  return days.map((date) => activeDates.has(date));
}

export async function resetWeeklyFreezes(): Promise<void> {
  const { error } = await getSupabase()
    .from("streaks")
    .update({
      streak_freezes_used: 0,
      freeze_reset_date: getNextMonday().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .not("freeze_reset_date", "is", null)
    .lte("freeze_reset_date", getUtcDate());

  if (error) throw error;
}

export async function setTimezone(userId: number, timezone: string): Promise<void> {
  const { error } = await getSupabase()
    .from("streaks")
    .upsert(
      {
        user_id: userId,
        timezone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) throw error;
}

export async function getTop10(): Promise<
  { user_id: number; max_streak: number; first_name: string }[]
> {
  const { data, error } = await getSupabase()
    .from("streaks")
    .select("user_id, max_streak, updated_at")
    .gt("max_streak", 0)
    .order("max_streak", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(10);

  if (error) throw error;
  const rows = (data ?? []).map((row: { user_id: number; max_streak: number }) => ({
    user_id: asNumber(row.user_id),
    max_streak: asNumber(row.max_streak),
  }));
  const firstNames = await getFirstNamesByUserId(
    rows.map((row: { user_id: number }) => row.user_id),
  );

  return rows.map((row: { user_id: number; max_streak: number }, index: number) => ({
    ...row,
    first_name: firstNames.get(row.user_id) || `User ${index + 1}`,
  }));
}

export async function getUserRank(
  userId: number,
): Promise<{ rank: number; total: number; max_streak: number } | null> {
  const { data, error } = await getSupabase()
    .from("streaks")
    .select("user_id, max_streak, updated_at")
    .gt("max_streak", 0)
    .order("max_streak", { ascending: false })
    .order("updated_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []).map((row: { user_id: number; max_streak: number }) => ({
    user_id: asNumber(row.user_id),
    max_streak: asNumber(row.max_streak),
  }));
  const current = rows.find((row: { user_id: number }) => row.user_id === userId);
  if (!current) return null;

  return {
    rank:
      rows.filter((row: { max_streak: number }) => row.max_streak > current.max_streak)
        .length + 1,
    total: rows.length,
    max_streak: current.max_streak,
  };
}

export async function getNearbyRanks(
  userId: number,
  range = 2,
): Promise<
  {
    rank: number;
    user_id: number;
    max_streak: number;
    isCurrentUser: boolean;
  }[]
> {
  const { data, error } = await getSupabase()
    .from("streaks")
    .select("user_id, max_streak, updated_at")
    .gt("max_streak", 0)
    .order("max_streak", { ascending: false })
    .order("updated_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []).map((row: { user_id: number; max_streak: number }) => ({
    user_id: asNumber(row.user_id),
    max_streak: asNumber(row.max_streak),
  }));
  const userIndex = rows.findIndex((row: { user_id: number }) => row.user_id === userId);
  if (userIndex === -1) return [];

  return rows
    .slice(Math.max(0, userIndex - range), Math.min(rows.length, userIndex + range + 1))
    .map((row: { user_id: number; max_streak: number }) => ({
      ...row,
      rank:
        rows.filter(
          (candidate: { max_streak: number }) =>
            candidate.max_streak > row.max_streak,
        ).length + 1,
      isCurrentUser: row.user_id === userId,
    }));
}
