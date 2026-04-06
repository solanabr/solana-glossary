import { getSupabase, shouldBypassSupabase } from "./client.js";
import type { StoredPathProgress } from "./types.js";
import { asNumber } from "./helpers.js";

export async function getLanguage(userId: number): Promise<string | undefined> {
  if (shouldBypassSupabase()) return undefined;
  const { data, error } = await getSupabase()
    .from("users")
    .select("language")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as { language: string | null } | null)?.language ?? undefined;
}

export async function setLanguage(userId: number, lang: string): Promise<void> {
  if (shouldBypassSupabase()) return;
  const { error } = await getSupabase()
    .from("users")
    .upsert({ user_id: userId, language: lang }, { onConflict: "user_id" });

  if (error) throw error;
}

export async function getGroupLanguage(
  chatId: number,
): Promise<string | undefined> {
  if (shouldBypassSupabase()) return undefined;
  const { data, error } = await getSupabase()
    .from("group_settings")
    .select("language")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (error) throw error;
  return (data as { language: string | null } | null)?.language ?? undefined;
}

export async function setGroupLanguage(
  chatId: number,
  lang: string,
): Promise<void> {
  if (shouldBypassSupabase()) return;
  const { error } = await getSupabase()
    .from("group_settings")
    .upsert(
      {
        chat_id: chatId,
        language: lang,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chat_id" },
    );

  if (error) throw error;
}

export async function setFirstName(
  userId: number,
  firstName: string,
): Promise<void> {
  if (shouldBypassSupabase()) return;
  const { error } = await getSupabase()
    .from("users")
    .upsert({ user_id: userId, first_name: firstName }, { onConflict: "user_id" });

  if (error) throw error;
}

export async function addFavorite(userId: number, termId: string): Promise<void> {
  if (shouldBypassSupabase()) return;
  const { count, error: countError } = await getSupabase()
    .from("favorites")
    .select("term_id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw countError;
  if ((count ?? 0) >= 50) {
    throw new Error("Favorites limit reached (50)");
  }

  const { error } = await getSupabase().from("favorites").upsert(
    { user_id: userId, term_id: termId },
    { onConflict: "user_id,term_id", ignoreDuplicates: true },
  );

  if (error) throw error;
}

export async function removeFavorite(
  userId: number,
  termId: string,
): Promise<void> {
  if (shouldBypassSupabase()) return;
  const { error } = await getSupabase()
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("term_id", termId);

  if (error) throw error;
}

export async function getFavorites(userId: number): Promise<string[]> {
  if (shouldBypassSupabase()) return [];
  const { data, error } = await getSupabase()
    .from("favorites")
    .select("term_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: { term_id: string }) => row.term_id);
}

export async function isFavorite(userId: number, termId: string): Promise<boolean> {
  if (shouldBypassSupabase()) return false;
  const { data, error } = await getSupabase()
    .from("favorites")
    .select("term_id")
    .eq("user_id", userId)
    .eq("term_id", termId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data as { term_id: string } | null);
}

export async function addHistory(userId: number, termId: string): Promise<void> {
  if (shouldBypassSupabase()) return;
  const { error: insertError } = await getSupabase().from("history").insert({
    user_id: userId,
    term_id: termId,
  });

  if (insertError) throw insertError;

  const { data: overflowRows, error: overflowError } = await getSupabase()
    .from("history")
    .select("id")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .range(10, 1000);

  if (overflowError) throw overflowError;

  const overflowIds = (overflowRows ?? []).map((row: { id: number }) => row.id);
  if (overflowIds.length === 0) return;

  const { error: deleteError } = await getSupabase()
    .from("history")
    .delete()
    .in("id", overflowIds);

  if (deleteError) throw deleteError;
}

export async function getHistory(userId: number): Promise<string[]> {
  if (shouldBypassSupabase()) return [];
  const { data, error } = await getSupabase()
    .from("history")
    .select("term_id")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data ?? []).map((row: { term_id: string }) => row.term_id);
}

export async function getPathProgress(
  userId: number,
  pathId: string,
): Promise<StoredPathProgress | undefined> {
  if (shouldBypassSupabase()) return undefined;
  const { data, error } = await getSupabase()
    .from("user_path_progress")
    .select("step, completed")
    .eq("user_id", userId)
    .eq("path_id", pathId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;
  const progress = data as { step: number; completed: boolean };

  return {
    step: asNumber(progress.step),
    completed: Boolean(progress.completed),
  };
}

export async function setPathStep(
  userId: number,
  pathId: string,
  step: number,
): Promise<void> {
  if (shouldBypassSupabase()) return;
  const current = await getPathProgress(userId, pathId);
  const { error } = await getSupabase()
    .from("user_path_progress")
    .upsert(
      {
        user_id: userId,
        path_id: pathId,
        step,
        completed: current?.completed ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,path_id" },
    );

  if (error) throw error;
}

export async function markPathCompleted(
  userId: number,
  pathId: string,
): Promise<void> {
  if (shouldBypassSupabase()) return;
  const { error } = await getSupabase()
    .from("user_path_progress")
    .update({
      completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("path_id", pathId);

  if (error) throw error;
}

export async function resetPath(userId: number, pathId: string): Promise<void> {
  if (shouldBypassSupabase()) return;
  const { error } = await getSupabase()
    .from("user_path_progress")
    .delete()
    .eq("user_id", userId)
    .eq("path_id", pathId);

  if (error) throw error;
}

export async function getAllPathProgress(
  userId: number,
): Promise<Record<string, StoredPathProgress>> {
  if (shouldBypassSupabase()) return {};
  const { data, error } = await getSupabase()
    .from("user_path_progress")
    .select("path_id, step, completed")
    .eq("user_id", userId);

  if (error) throw error;

  return Object.fromEntries(
    (data ?? []).map((row: { path_id: string; step: number; completed: boolean }) => [
      row.path_id,
      {
        step: asNumber(row.step),
        completed: Boolean(row.completed),
      },
    ]),
  );
}
