// Personality unlock system — persisted in localStorage
// Maid-chan and DnD Master: always available
// Degen Sensei: per-game thresholds (speedrun: 10, blitz: 10, connections: 4, daily: 1)
// GLaDOS: solve WTF Daily or complete 3 different games

const STORAGE_KEY = "solana-wtf-progress";

export interface GameProgress {
  gamesCompleted: string[]; // unique game IDs completed
  bestScores: Record<string, number>; // gameId -> best score
  dailySolvedDate: string | null; // YYYY-MM-DD or "legacy"
  unlockedPersonalities: string[];
  decodeCounts: Record<string, number>; // personalityId -> count
}

const DEFAULT_PROGRESS: GameProgress = {
  gamesCompleted: [],
  bestScores: {},
  dailySolvedDate: null,
  unlockedPersonalities: ["maid", "dm"],
  decodeCounts: {},
};

// Per-game thresholds for Degen Sensei unlock
const DEGEN_THRESHOLDS: Record<string, number> = {
  speedrun: 10,
  blitz: 10,
  connections: 4,
  daily: 1,
};

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getProgress(): GameProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);

    // Migrate old dailySolved: true → dailySolvedDate: "legacy"
    if (parsed.dailySolved === true && !parsed.dailySolvedDate) {
      parsed.dailySolvedDate = "legacy";
      delete parsed.dailySolved;
    } else if (parsed.dailySolved === false && !parsed.dailySolvedDate) {
      parsed.dailySolvedDate = null;
      delete parsed.dailySolved;
    }

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      // Ensure decodeCounts always exists
      decodeCounts: { ...DEFAULT_PROGRESS.decodeCounts, ...(parsed.decodeCounts || {}) },
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(progress: GameProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function checkUnlocks(progress: GameProgress): string[] {
  const newlyUnlocked: string[] = [];

  // Degen Sensei: per-game thresholds
  if (!progress.unlockedPersonalities.includes("degen")) {
    const meetsThreshold = Object.entries(progress.bestScores).some(
      ([gameId, score]) => {
        const threshold = DEGEN_THRESHOLDS[gameId];
        return threshold !== undefined && score >= threshold;
      }
    );
    if (meetsThreshold) {
      progress.unlockedPersonalities.push("degen");
      newlyUnlocked.push("degen");
    }
  }

  // GLaDOS: solve WTF Daily OR complete 3 different games
  if (!progress.unlockedPersonalities.includes("glados")) {
    const dailySolvedToday =
      progress.dailySolvedDate === getTodayDate() ||
      progress.dailySolvedDate === "legacy";
    const hasThreeGames = progress.gamesCompleted.length >= 3;
    if (dailySolvedToday || hasThreeGames) {
      progress.unlockedPersonalities.push("glados");
      newlyUnlocked.push("glados");
    }
  }

  return newlyUnlocked;
}

export function recordGameResult(
  gameId: string,
  score: number,
  dailyDate?: string
): { progress: GameProgress; newUnlocks: string[] } {
  const progress = getProgress();

  // Track best score
  if (!progress.bestScores[gameId] || score > progress.bestScores[gameId]) {
    progress.bestScores[gameId] = score;
  }

  // Track unique games completed
  if (!progress.gamesCompleted.includes(gameId)) {
    progress.gamesCompleted.push(gameId);
  }

  // Track daily solved date
  if (gameId === "daily") {
    progress.dailySolvedDate = dailyDate || getTodayDate();
  }

  // Check unlock conditions
  const newUnlocks = checkUnlocks(progress);

  saveProgress(progress);
  return { progress, newUnlocks };
}

export function recordDecode(personalityId: string): GameProgress {
  const progress = getProgress();
  progress.decodeCounts[personalityId] = (progress.decodeCounts[personalityId] || 0) + 1;
  saveProgress(progress);
  return progress;
}

export function isDailySolvedToday(): boolean {
  const progress = getProgress();
  return progress.dailySolvedDate === getTodayDate();
}

export function isPersonalityUnlocked(id: string): boolean {
  return getProgress().unlockedPersonalities.includes(id);
}

export function getUnlockRequirement(id: string): string {
  switch (id) {
    case "degen":
      return "Score 10+ in Speed Run or Blitz, 4+ in Connections, or solve Daily";
    case "glados":
      return "Solve WTF Daily or complete 3 games";
    default:
      return "";
  }
}

/* ─── Skin Unlocks ─────────────────────────────────────────── */

export interface SkinUnlockDef {
  personalityId: string;
  skinId: string;
  unlockAt: number;
  label: string;
  src: string;
}

export const SKIN_UNLOCKS: readonly SkinUnlockDef[] = [
  { personalityId: "maid", skinId: "cyber", unlockAt: 5, label: "Neon Cyber", src: "/personalities/maidchain-herocyber.png" },
  { personalityId: "maid", skinId: "mecha", unlockAt: 10, label: "Mecha", src: "/personalities/maidchain-herorobot.png" },
  { personalityId: "maid", skinId: "manga", unlockAt: 15, label: "Manga", src: "/personalities/maidchain-herocartoon.png" },
  { personalityId: "dm", skinId: "cyber", unlockAt: 5, label: "Neon Cyber", src: "/personalities/dedmaster-herocyber.png" },
  { personalityId: "dm", skinId: "classic", unlockAt: 15, label: "Classic", src: "/personalities/dedmaster-hero.png" },
] as const;

export function checkSkinUnlock(
  personalityId: string,
  oldCount: number,
  newCount: number
): SkinUnlockDef | null {
  for (const skin of SKIN_UNLOCKS) {
    if (
      skin.personalityId === personalityId &&
      oldCount < skin.unlockAt &&
      newCount >= skin.unlockAt
    ) {
      return skin;
    }
  }
  return null;
}

/* ─── Unlock Progress (structured data for UI) ───────────────── */

export interface UnlockPathProgress {
  gameId: string;
  label: string;
  current: number;
  required: number;
  met: boolean;
}

export interface PersonalityUnlockInfo {
  id: string;
  isUnlocked: boolean;
  paths: UnlockPathProgress[];
}

const GAME_LABELS: Record<string, string> = {
  speedrun: "Speed Run",
  blitz: "Category Blitz",
  connections: "Connections",
  daily: "WTF Daily",
};

export function getUnlockProgress(progress: GameProgress): PersonalityUnlockInfo[] {
  const result: PersonalityUnlockInfo[] = [];

  // Degen Sensei — per-game thresholds
  const degenUnlocked = progress.unlockedPersonalities.includes("degen");
  const degenPaths: UnlockPathProgress[] = Object.entries(DEGEN_THRESHOLDS).map(
    ([gameId, required]) => {
      const current = progress.bestScores[gameId] ?? 0;
      return {
        gameId,
        label: GAME_LABELS[gameId] || gameId,
        current,
        required,
        met: current >= required,
      };
    }
  );
  result.push({ id: "degen", isUnlocked: degenUnlocked, paths: degenPaths });

  // GLaDOS — daily solve OR 3 different games
  const gladosUnlocked = progress.unlockedPersonalities.includes("glados");
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const dailySolvedToday =
    progress.dailySolvedDate === today || progress.dailySolvedDate === "legacy";
  const gladosPaths: UnlockPathProgress[] = [
    {
      gameId: "daily",
      label: "Solve WTF Daily",
      current: dailySolvedToday ? 1 : 0,
      required: 1,
      met: dailySolvedToday,
    },
    {
      gameId: "games-completed",
      label: "Complete 3 different games",
      current: progress.gamesCompleted.length,
      required: 3,
      met: progress.gamesCompleted.length >= 3,
    },
  ];
  result.push({ id: "glados", isUnlocked: gladosUnlocked, paths: gladosPaths });

  return result;
}

export function mergeProgress(
  local: GameProgress,
  remote: GameProgress
): GameProgress {
  // Union of games completed
  const gamesCompleted = Array.from(
    new Set([...local.gamesCompleted, ...remote.gamesCompleted])
  );

  // Max of best scores
  const bestScores: Record<string, number> = { ...local.bestScores };
  for (const [gameId, score] of Object.entries(remote.bestScores)) {
    if (!bestScores[gameId] || score > bestScores[gameId]) {
      bestScores[gameId] = score;
    }
  }

  // Most recent daily solved date
  const dailySolvedDate = (() => {
    if (!local.dailySolvedDate) return remote.dailySolvedDate;
    if (!remote.dailySolvedDate) return local.dailySolvedDate;
    if (local.dailySolvedDate === "legacy" || remote.dailySolvedDate === "legacy") return "legacy";
    return local.dailySolvedDate > remote.dailySolvedDate
      ? local.dailySolvedDate
      : remote.dailySolvedDate;
  })();

  // Union of unlocked personalities
  const unlockedPersonalities = Array.from(
    new Set([...local.unlockedPersonalities, ...remote.unlockedPersonalities])
  );

  // Max of decode counts
  const decodeCounts: Record<string, number> = { ...local.decodeCounts };
  for (const [pid, count] of Object.entries(remote.decodeCounts)) {
    if (!decodeCounts[pid] || count > decodeCounts[pid]) {
      decodeCounts[pid] = count;
    }
  }

  const merged: GameProgress = {
    gamesCompleted,
    bestScores,
    dailySolvedDate,
    unlockedPersonalities,
    decodeCounts,
  };

  // Re-check unlocks on merged data
  checkUnlocks(merged);

  return merged;
}
