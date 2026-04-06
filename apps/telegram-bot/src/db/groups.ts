import { getSupabase } from "./client.js";
import { asNumber, getBotDate, shiftDate } from "./helpers.js";
import { GROUP_STREAK_THRESHOLD, type GroupStreakRow } from "./types.js";

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

async function ensureGroupStreak(chatId: number): Promise<GroupStreakRow> {
  const streak = await getOrCreateGroupStreak(chatId);
  return {
    chat_id: chatId,
    current_streak: streak.current_streak,
    max_streak: streak.max_streak,
    last_active_date: streak.last_active_date,
    last_broken_announcement_date: streak.last_broken_announcement_date,
  };
}

export async function recordGroupMember(
  chatId: number,
  userId: number,
): Promise<void> {
  const { error } = await getSupabase()
    .from("group_members")
    .upsert(
      {
        chat_id: chatId,
        user_id: userId,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "chat_id,user_id" },
    );

  if (error) throw error;
}

export async function hasGroupMembership(
  chatId: number,
  userId: number,
): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("group_members")
    .select("user_id")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data as { user_id: number } | null);
}

export async function getGroupTop10(
  chatId: number,
): Promise<{ user_id: number; max_streak: number; first_name: string }[]> {
  const { data: members, error: memberError } = await getSupabase()
    .from("group_members")
    .select("user_id")
    .eq("chat_id", chatId);

  if (memberError) throw memberError;
  const userIds = (members ?? []).map((row: { user_id: number }) => asNumber(row.user_id));
  if (userIds.length === 0) return [];

  const { data, error } = await getSupabase()
    .from("streaks")
    .select("user_id, max_streak, updated_at")
    .in("user_id", userIds)
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

export async function getGroupRank(
  chatId: number,
  userId: number,
): Promise<{ rank: number; total: number; max_streak: number } | null> {
  const { data: members, error: memberError } = await getSupabase()
    .from("group_members")
    .select("user_id")
    .eq("chat_id", chatId);

  if (memberError) throw memberError;
  const userIds = (members ?? []).map((row: { user_id: number }) => asNumber(row.user_id));
  if (userIds.length === 0) return null;

  const { data, error } = await getSupabase()
    .from("streaks")
    .select("user_id, max_streak, updated_at")
    .in("user_id", userIds)
    .gt("max_streak", 0)
    .order("max_streak", { ascending: false })
    .order("updated_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []).map((row: { user_id: number; max_streak: number }) => ({
    user_id: asNumber(row.user_id),
    max_streak: asNumber(row.max_streak),
  }));
  const index = rows.findIndex((row: { user_id: number }) => row.user_id === userId);
  if (index === -1) return null;

  return {
    rank: index + 1,
    total: rows.length,
    max_streak: rows[index]?.max_streak ?? 0,
  };
}

export async function getOrCreateGroupStreak(chatId: number): Promise<{
  current_streak: number;
  max_streak: number;
  last_active_date: string | null;
  last_broken_announcement_date: string | null;
}> {
  const { data, error } = await getSupabase()
    .from("group_streaks")
    .select(
      "chat_id, current_streak, max_streak, last_active_date, last_broken_announcement_date",
    )
    .eq("chat_id", chatId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    const streak = data as GroupStreakRow;
    return {
      current_streak: streak.current_streak,
      max_streak: streak.max_streak,
      last_active_date: streak.last_active_date,
      last_broken_announcement_date: streak.last_broken_announcement_date,
    };
  }

  const { error: insertError } = await getSupabase()
    .from("group_streaks")
    .insert({ chat_id: chatId });

  if (insertError) throw insertError;

  return {
    current_streak: 0,
    max_streak: 0,
    last_active_date: null,
    last_broken_announcement_date: null,
  };
}

export async function maybeResetGroupStreak(chatId: number): Promise<{
  wasBroken: boolean;
  current: number;
  max: number;
  lastActiveDate: string | null;
}> {
  const today = getBotDate();
  const yesterday = shiftDate(today, -1);
  const streak = await ensureGroupStreak(chatId);

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
  const { error } = await getSupabase()
    .from("group_streaks")
    .update({
      current_streak: 0,
      last_broken_announcement_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("chat_id", chatId);

  if (error) throw error;

  return {
    wasBroken: shouldAnnounce,
    current: 0,
    max: streak.max_streak,
    lastActiveDate: streak.last_active_date,
  };
}

export async function recordGroupParticipant(
  chatId: number,
  userId: number,
): Promise<{ participantsToday: number; alreadyParticipated: boolean; date: string }> {
  const today = getBotDate();
  const { data: existing, error: existingError } = await getSupabase()
    .from("group_daily_participants")
    .select("user_id")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    const { error: insertError } = await getSupabase()
      .from("group_daily_participants")
      .insert({ chat_id: chatId, user_id: userId, date: today });

    if (insertError) throw insertError;
  }

  return {
    participantsToday: await getGroupDailyParticipants(chatId, today),
    alreadyParticipated: Boolean(existing as { user_id: number } | null),
    date: today,
  };
}

export async function getGroupDailyParticipants(
  chatId: number,
  date: string,
): Promise<number> {
  const { count, error } = await getSupabase()
    .from("group_daily_participants")
    .select("user_id", { count: "exact", head: true })
    .eq("chat_id", chatId)
    .eq("date", date);

  if (error) throw error;
  return count ?? 0;
}

export async function incrementGroupStreak(chatId: number): Promise<{
  newStreak: number;
  newMax: number;
  isNewRecord: boolean;
  justCrossedThreshold: boolean;
}> {
  const today = getBotDate();
  const streak = await ensureGroupStreak(chatId);

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

  const { error } = await getSupabase()
    .from("group_streaks")
    .update({
      current_streak: newStreak,
      max_streak: newMax,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("chat_id", chatId);

  if (error) throw error;

  return {
    newStreak,
    newMax,
    isNewRecord: newMax > streak.max_streak,
    justCrossedThreshold,
  };
}

export async function getGroupStreakCalendar(chatId: number): Promise<boolean[]> {
  const today = getBotDate();
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(today, index - 6));
  const { data, error } = await getSupabase()
    .from("group_daily_participants")
    .select("date")
    .eq("chat_id", chatId)
    .in("date", days);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { date: string }[]) {
    counts.set(row.date, (counts.get(row.date) ?? 0) + 1);
  }

  return days.map((date) => (counts.get(date) ?? 0) >= GROUP_STREAK_THRESHOLD);
}
