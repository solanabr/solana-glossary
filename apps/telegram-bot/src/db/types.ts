export interface QuizSession {
  termId: string;
  correctIdx: number;
  options: string[];
  mode: "single" | "round";
  difficultyKey: "all" | "easy" | "medium" | "hard" | "1" | "2" | "3" | "4" | "5";
  totalQuestions: number;
  currentQuestion: number;
  correctAnswers: number;
  wrongAnswers: number;
  failureMode: "continue" | "sudden_death";
  remainingTermIds: string[];
  askedTermIds: string[];
  poolTermIds: string[];
}

export interface StoredPathProgress {
  step: number;
  completed: boolean;
}

export interface StreakRow {
  user_id: number;
  streak_count: number;
  max_streak: number;
  last_daily_date: string | null;
  streak_freezes_used: number;
  freeze_reset_date: string | null;
  timezone: string;
}

export interface GroupStreakRow {
  chat_id: number;
  current_streak: number;
  max_streak: number;
  last_active_date: string | null;
  last_broken_announcement_date: string | null;
}

export const GROUP_STREAK_THRESHOLD = 2;
