"use server";

import { createClient } from "@/lib/supabase/server";
import type { GameProgress } from "@/lib/unlocks";

/* ------------------------------------------------------------------ */
/*  Fetch progress from Supabase                                       */
/* ------------------------------------------------------------------ */

export async function fetchProgress(): Promise<GameProgress | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) return null;

  return {
    gamesCompleted: data.games_completed || [],
    bestScores: data.best_scores || {},
    dailySolvedDate: data.daily_solved_date || null,
    unlockedPersonalities: data.unlocked_personalities || ["maid", "dm"],
    decodeCounts: data.decode_counts || {},
  };
}

/* ------------------------------------------------------------------ */
/*  Submit a game score                                                 */
/* ------------------------------------------------------------------ */

export async function submitGameScore(
  gameId: string,
  score: number,
  difficulty: string = "normal",
  dailyDate?: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  // Insert audit trail
  await supabase.from("game_scores").insert({
    user_id: user.id,
    game_id: gameId,
    score,
    difficulty,
    daily_date: dailyDate || null,
  });

  // Update denormalized progress
  const { data: current } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!current) return { success: false };

  const gamesCompleted: string[] = current.games_completed || [];
  if (!gamesCompleted.includes(gameId)) {
    gamesCompleted.push(gameId);
  }

  const bestScores: Record<string, number> = current.best_scores || {};
  if (!bestScores[gameId] || score > bestScores[gameId]) {
    bestScores[gameId] = score;
  }

  const dailySolvedDate =
    gameId === "daily" ? dailyDate || current.daily_solved_date : current.daily_solved_date;

  // Re-check unlocks
  const unlockedPersonalities: string[] = current.unlocked_personalities || ["maid", "dm"];
  checkServerUnlocks(unlockedPersonalities, bestScores, gamesCompleted, dailySolvedDate);

  await supabase
    .from("user_progress")
    .update({
      games_completed: gamesCompleted,
      best_scores: bestScores,
      daily_solved_date: dailySolvedDate,
      unlocked_personalities: unlockedPersonalities,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Record a decode action                                              */
/* ------------------------------------------------------------------ */

export async function recordDecodeAction(
  personalityId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  // Insert audit trail
  await supabase.from("decode_stats").insert({
    user_id: user.id,
    personality_id: personalityId,
  });

  // Update counts in user_progress
  const { data: current } = await supabase
    .from("user_progress")
    .select("decode_counts")
    .eq("user_id", user.id)
    .single();

  const decodeCounts: Record<string, number> = current?.decode_counts || {};
  decodeCounts[personalityId] = (decodeCounts[personalityId] || 0) + 1;

  await supabase
    .from("user_progress")
    .update({
      decode_counts: decodeCounts,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Server-side unlock check (mirrors client logic)                     */
/* ------------------------------------------------------------------ */

const DEGEN_THRESHOLDS: Record<string, number> = {
  speedrun: 10,
  blitz: 10,
  connections: 4,
  daily: 1,
};

function checkServerUnlocks(
  unlockedPersonalities: string[],
  bestScores: Record<string, number>,
  gamesCompleted: string[],
  dailySolvedDate: string | null
) {
  // Degen Sensei
  if (!unlockedPersonalities.includes("degen")) {
    const meetsThreshold = Object.entries(bestScores).some(
      ([gameId, score]) => {
        const threshold = DEGEN_THRESHOLDS[gameId];
        return threshold !== undefined && score >= threshold;
      }
    );
    if (meetsThreshold) {
      unlockedPersonalities.push("degen");
    }
  }

  // GLaDOS
  if (!unlockedPersonalities.includes("glados")) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const dailySolved = dailySolvedDate === todayStr || dailySolvedDate === "legacy";
    const hasThreeGames = gamesCompleted.length >= 3;
    if (dailySolved || hasThreeGames) {
      unlockedPersonalities.push("glados");
    }
  }
}
