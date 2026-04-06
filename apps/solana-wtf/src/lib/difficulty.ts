export type Difficulty = "easy" | "normal" | "hard";

export interface SpeedRunConfig {
  timer: number;
  optionCount: number;
  defMaxChars: number | null; // null = full definition
}

export interface BlitzConfig {
  timer: number;
  optionCount: number;
  defMaxChars: number;
}

export interface ConnectionsConfig {
  maxMistakes: number;
  groupCount: number;
}

export interface DailyConfig {
  maxHints: number;
  autocompleteMinChars: number; // Infinity = disabled
  censorMode: "light" | "normal" | "aggressive";
}

export const SPEEDRUN_CONFIG: Record<Difficulty, SpeedRunConfig> = {
  easy: { timer: 90, optionCount: 3, defMaxChars: null },
  normal: { timer: 60, optionCount: 4, defMaxChars: null },
  hard: { timer: 40, optionCount: 5, defMaxChars: 100 },
};

export const BLITZ_CONFIG: Record<Difficulty, BlitzConfig> = {
  easy: { timer: 60, optionCount: 3, defMaxChars: 200 },
  normal: { timer: 45, optionCount: 4, defMaxChars: 150 },
  hard: { timer: 30, optionCount: 5, defMaxChars: 80 },
};

export const CONNECTIONS_CONFIG: Record<Difficulty, ConnectionsConfig> = {
  easy: { maxMistakes: 6, groupCount: 3 },
  normal: { maxMistakes: 4, groupCount: 4 },
  hard: { maxMistakes: 2, groupCount: 5 },
};

export const DAILY_CONFIG: Record<Difficulty, DailyConfig> = {
  easy: { maxHints: 4, autocompleteMinChars: 1, censorMode: "light" },
  normal: { maxHints: 3, autocompleteMinChars: 2, censorMode: "normal" },
  hard: { maxHints: 1, autocompleteMinChars: Infinity, censorMode: "aggressive" },
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#14F195",
  normal: "#00FFFF",
  hard: "#FF003F",
};
