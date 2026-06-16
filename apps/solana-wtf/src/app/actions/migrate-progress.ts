"use server";

import { createClient } from "@/lib/supabase/server";
import type { GameProgress } from "@/lib/unlocks";

/* ------------------------------------------------------------------ */
/*  Migrate local progress to Supabase                                  */
/* ------------------------------------------------------------------ */

export async function migrateLocalProgress(
  localProgress: GameProgress
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  // Get current remote progress
  const { data: remote } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!remote) return { success: false };

  const remoteProgress: GameProgress = {
    gamesCompleted: remote.games_completed || [],
    bestScores: remote.best_scores || {},
    dailySolvedDate: remote.daily_solved_date || null,
    unlockedPersonalities: remote.unlocked_personalities || ["maid", "dm"],
    decodeCounts: remote.decode_counts || {},
  };

  // Merge: union arrays, max scores, max decode counts
  const gamesCompleted = Array.from(
    new Set([...localProgress.gamesCompleted, ...remoteProgress.gamesCompleted])
  );

  const bestScores: Record<string, number> = { ...remoteProgress.bestScores };
  for (const [gameId, score] of Object.entries(localProgress.bestScores)) {
    if (!bestScores[gameId] || score > bestScores[gameId]) {
      bestScores[gameId] = score;
    }
  }

  const dailySolvedDate = (() => {
    if (!localProgress.dailySolvedDate) return remoteProgress.dailySolvedDate;
    if (!remoteProgress.dailySolvedDate) return localProgress.dailySolvedDate;
    if (localProgress.dailySolvedDate === "legacy" || remoteProgress.dailySolvedDate === "legacy")
      return "legacy";
    return localProgress.dailySolvedDate > remoteProgress.dailySolvedDate
      ? localProgress.dailySolvedDate
      : remoteProgress.dailySolvedDate;
  })();

  const unlockedPersonalities = Array.from(
    new Set([...localProgress.unlockedPersonalities, ...remoteProgress.unlockedPersonalities])
  );

  const decodeCounts: Record<string, number> = { ...remoteProgress.decodeCounts };
  for (const [pid, count] of Object.entries(localProgress.decodeCounts)) {
    if (!decodeCounts[pid] || count > decodeCounts[pid]) {
      decodeCounts[pid] = count;
    }
  }

  // Re-check unlocks on merged data
  checkMergedUnlocks(unlockedPersonalities, bestScores, gamesCompleted, dailySolvedDate);

  // Save merged progress
  await supabase
    .from("user_progress")
    .update({
      games_completed: gamesCompleted,
      best_scores: bestScores,
      daily_solved_date: dailySolvedDate,
      unlocked_personalities: unlockedPersonalities,
      decode_counts: decodeCounts,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Unlock check (mirrors client logic)                                 */
/* ------------------------------------------------------------------ */

const DEGEN_THRESHOLDS: Record<string, number> = {
  speedrun: 10,
  blitz: 10,
  connections: 4,
  daily: 1,
};

function checkMergedUnlocks(
  unlockedPersonalities: string[],
  bestScores: Record<string, number>,
  gamesCompleted: string[],
  dailySolvedDate: string | null
) {
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
