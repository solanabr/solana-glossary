import { getSupabase } from "./client.js";
import { getUtcDate, getNextMonday } from "./helpers.js";

export async function scheduleNotification(
  userId: number,
  scheduledAt: Date,
  type: string,
): Promise<void> {
  const { error } = await getSupabase().from("scheduled_notifications").insert({
    user_id: userId,
    scheduled_at: scheduledAt.toISOString(),
    type,
  });

  if (error) throw error;
}

export async function getPendingNotifications(
  beforeTime: Date,
): Promise<{ id: number; user_id: number; type: string }[]> {
  const { data, error } = await getSupabase()
    .from("scheduled_notifications")
    .select("id, user_id, type")
    .lte("scheduled_at", beforeTime.toISOString())
    .is("sent_at", null);

  if (error) throw error;
  return (data ?? []).map((row: { id: number; user_id: number; type: string }) => ({
    id: Number(row.id),
    user_id: Number(row.user_id),
    type: row.type,
  }));
}

export async function markNotificationSent(
  id: number,
  sentAt: Date,
): Promise<void> {
  const { error } = await getSupabase()
    .from("scheduled_notifications")
    .update({ sent_at: sentAt.toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function clearPendingNotifications(
  userId: number,
  type: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from("scheduled_notifications")
    .delete()
    .eq("user_id", userId)
    .eq("type", type)
    .is("sent_at", null);

  if (error) throw error;
}

export async function clearOldNotifications(days = 7): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { error } = await getSupabase()
    .from("scheduled_notifications")
    .delete()
    .lt("sent_at", cutoff.toISOString());

  if (error) throw error;
}

export async function resetWeeklyFreezesFromScheduler(): Promise<void> {
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
