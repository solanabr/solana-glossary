"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { GameProgress } from "@/lib/unlocks";
import {
  getProgress,
  recordGameResult as rawRecordGameResult,
  recordDecode as rawRecordDecode,
  checkUnlocks,
  checkSkinUnlock,
} from "@/lib/unlocks";
import { useAuth } from "@/lib/auth-context";
import {
  submitGameScore,
  recordDecodeAction,
  fetchProgress,
} from "@/app/actions/progress";
import { migrateLocalProgress } from "@/app/actions/migrate-progress";

/* ------------------------------------------------------------------ */
/*  Toast event bus (consumed by ToastProvider)                         */
/* ------------------------------------------------------------------ */

export type UnlockToastEvent = CustomEvent<{ personalityId: string }>;

function fireUnlockToast(personalityId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("solana-wtf-unlock", { detail: { personalityId } })
  );
}

/* ------------------------------------------------------------------ */
/*  Context shape                                                       */
/* ------------------------------------------------------------------ */

interface ProgressContextValue {
  progress: GameProgress;
  recordGameResult: (gameId: string, score: number, dailyDate?: string) => void;
  recordDecode: (personalityId: string) => void;
  isPersonalityUnlocked: (id: string) => boolean;
  isDailySolvedToday: () => boolean;
  refreshProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                            */
/* ------------------------------------------------------------------ */

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [progress, setProgress] = useState<GameProgress>(() => getProgress());
  const migrationDone = useRef(false);

  // On auth: migrate local → cloud, then switch source to Supabase
  useEffect(() => {
    if (!isAuthenticated || !user || migrationDone.current) return;
    migrationDone.current = true;

    const localData = getProgress();

    (async () => {
      try {
        // Migrate local progress to cloud
        const hasLocalData =
          localData.gamesCompleted.length > 0 ||
          Object.keys(localData.bestScores).length > 0 ||
          Object.keys(localData.decodeCounts).length > 0;

        if (hasLocalData) {
          await migrateLocalProgress(localData);
        }

        // Fetch merged cloud progress
        const cloudProgress = await fetchProgress();
        if (cloudProgress) {
          setProgress(cloudProgress);
          // Write-through to localStorage as cache
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "solana-wtf-progress",
              JSON.stringify(cloudProgress)
            );
          }
        }
      } catch {
        // Cloud unavailable — fall back to localStorage silently
      }
    })();
  }, [isAuthenticated, user]);

  // When user signs out, reset migration flag
  useEffect(() => {
    if (!isAuthenticated) {
      migrationDone.current = false;
    }
  }, [isAuthenticated]);

  const refreshProgress = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const cloudProgress = await fetchProgress();
        if (cloudProgress) {
          setProgress(cloudProgress);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "solana-wtf-progress",
              JSON.stringify(cloudProgress)
            );
          }
          return;
        }
      } catch {
        // Fall through to localStorage
      }
    }
    setProgress(getProgress());
  }, [isAuthenticated]);

  const recordGameResultCtx = useCallback(
    (gameId: string, score: number, dailyDate?: string) => {
      // Always write to localStorage
      const { progress: updated, newUnlocks } = rawRecordGameResult(
        gameId,
        score,
        dailyDate
      );
      setProgress({ ...updated });
      for (const id of newUnlocks) {
        fireUnlockToast(id);
      }

      // If authenticated, also sync to cloud (fire-and-forget)
      if (isAuthenticated) {
        submitGameScore(gameId, score, "normal", dailyDate).catch(() => {
          // Silently fail — localStorage has the data
        });
      }
    },
    [isAuthenticated]
  );

  const recordDecodeCtx = useCallback(
    (personalityId: string) => {
      // Capture old count before incrementing
      const oldCount = getProgress().decodeCounts[personalityId] || 0;

      // Always write to localStorage
      const updated = rawRecordDecode(personalityId);
      const before = [...updated.unlockedPersonalities];
      checkUnlocks(updated);
      const newUnlocks = updated.unlockedPersonalities.filter(
        (id) => !before.includes(id)
      );
      setProgress({ ...updated });
      for (const id of newUnlocks) {
        fireUnlockToast(id);
      }

      // Check for skin unlock threshold crossing
      const newCount = oldCount + 1;
      const skinUnlock = checkSkinUnlock(personalityId, oldCount, newCount);
      if (skinUnlock) {
        window.dispatchEvent(
          new CustomEvent("solana-wtf-skin-unlock", { detail: skinUnlock })
        );
      }

      // If authenticated, also sync to cloud
      if (isAuthenticated) {
        recordDecodeAction(personalityId).catch(() => {});
      }
    },
    [isAuthenticated]
  );

  const isPersonalityUnlockedCtx = useCallback(
    (id: string) => progress.unlockedPersonalities.includes(id),
    [progress.unlockedPersonalities]
  );

  const isDailySolvedTodayCtx = useCallback(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return progress.dailySolvedDate === today;
  }, [progress.dailySolvedDate]);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        recordGameResult: recordGameResultCtx,
        recordDecode: recordDecodeCtx,
        isPersonalityUnlocked: isPersonalityUnlockedCtx,
        isDailySolvedToday: isDailySolvedTodayCtx,
        refreshProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within ProgressProvider");
  }
  return ctx;
}
