import { getSupabase } from "./client.js";
import type { QuizSession } from "./types.js";

export async function saveQuizSession(
  userId: number,
  session: QuizSession,
): Promise<void> {
  const { error } = await getSupabase()
    .from("quiz_sessions")
    .upsert(
      {
        user_id: userId,
        term_id: session.termId,
        correct_idx: session.correctIdx,
        session_data: session,
      },
      { onConflict: "user_id" },
    );

  if (error) throw error;
}

export async function getQuizSession(
  userId: number,
): Promise<QuizSession | undefined> {
  const { data, error } = await getSupabase()
    .from("quiz_sessions")
    .select("term_id, correct_idx, session_data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;

  const row = data as {
    term_id: string;
    correct_idx: number;
    session_data: QuizSession | string[];
  };
  const parsed = row.session_data as QuizSession | string[];
  if (Array.isArray(parsed)) {
    return {
      termId: row.term_id,
      correctIdx: row.correct_idx,
      options: parsed,
      mode: "single",
      difficultyKey: "all",
      totalQuestions: 1,
      currentQuestion: 1,
      correctAnswers: 0,
      wrongAnswers: 0,
      failureMode: "continue",
      remainingTermIds: [],
      askedTermIds: [row.term_id],
      poolTermIds: parsed,
    };
  }

  return {
    termId: parsed.termId ?? row.term_id,
    correctIdx: parsed.correctIdx ?? row.correct_idx,
    options: parsed.options ?? [],
    mode: parsed.mode ?? "single",
    difficultyKey: parsed.difficultyKey ?? "all",
    totalQuestions: parsed.totalQuestions ?? 1,
    currentQuestion: parsed.currentQuestion ?? 1,
    correctAnswers: parsed.correctAnswers ?? 0,
    wrongAnswers: parsed.wrongAnswers ?? 0,
    failureMode: parsed.failureMode ?? "continue",
    remainingTermIds: parsed.remainingTermIds ?? [],
    askedTermIds: parsed.askedTermIds ?? [row.term_id],
    poolTermIds: parsed.poolTermIds ?? parsed.options ?? [],
  };
}

export async function clearQuizSession(userId: number): Promise<void> {
  const { error } = await getSupabase()
    .from("quiz_sessions")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}
