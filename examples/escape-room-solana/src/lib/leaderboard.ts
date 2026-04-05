/**
 * @arquivo leaderboard.ts
 * @descricao Scores e ranking — localStorage primario + Supabase opcional
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { supabase } from "./supabase";

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface ScoreEntry {
  id: string;
  walletAddress: string;
  nickname: string;
  avatar: string;
  theme: string;
  level: string;
  score: number;
  timeSeconds: number;
  hintsUsed: number;
  completedAt: string;
}

const STORAGE_KEY = "escape_scores";

// ─── localStorage ──────────────────────────────────────────────────────────

function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

function persistScores(scores: ScoreEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

// ─── API publica ───────────────────────────────────────────────────────────

/** Submete uma pontuacao. Retorna a posicao no ranking. */
export function submitScore(
  entry: Omit<ScoreEntry, "id" | "completedAt">,
): number {
  const scores = loadScores();
  const full: ScoreEntry = {
    ...entry,
    id: crypto.randomUUID(),
    completedAt: new Date().toISOString(),
  };
  scores.push(full);
  scores.sort((a, b) => b.score - a.score);
  persistScores(scores);
  syncScoreToSupabase(full);
  return scores.findIndex((s) => s.id === full.id) + 1;
}

/** Retorna top N scores, opcionalmente filtrado por tema */
export function getTopScores(limit = 20, theme?: string): ScoreEntry[] {
  let scores = loadScores();
  if (theme) scores = scores.filter((s) => s.theme === theme);
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, limit);
}

/** Retorna scores de um jogador por wallet */
export function getUserScores(walletAddress: string): ScoreEntry[] {
  return loadScores()
    .filter((s) => s.walletAddress === walletAddress)
    .sort((a, b) => b.score - a.score);
}

/** Retorna a melhor pontuacao para um tema/nivel especifico */
export function getBestScore(
  walletAddress: string,
  theme: string,
  level: string,
): ScoreEntry | null {
  const matches = loadScores().filter(
    (s) =>
      s.walletAddress === walletAddress &&
      s.theme === theme &&
      s.level === level,
  );
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.score - a.score);
  return matches[0];
}

/** Submete score de uma partida e retorna rank + flag de recorde */
export function submitGameScore(
  profile: { walletAddress: string; nickname: string; avatar: string },
  game: {
    theme: string;
    level: string;
    score: number;
    timeSeconds: number;
    hintsUsed: number;
  },
): { rank: number; isNewRecord: boolean } {
  const prev = getBestScore(profile.walletAddress, game.theme, game.level);
  const isNewRecord = !prev || game.score > prev.score;
  const rank = submitScore({ ...profile, ...game });
  return { rank, isNewRecord };
}

// ─── Supabase sync (melhor esforco) ────────────────────────────────────────

async function syncScoreToSupabase(entry: ScoreEntry): Promise<void> {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url || url === "" || url === "https://xxx.supabase.co") return;
    const { data: profs } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", entry.walletAddress)
      .limit(1);
    if (!profs || profs.length === 0) return;
    await (
      supabase.from("leaderboard_escape") as ReturnType<typeof supabase.from>
    ).insert({
      profile_id: (profs[0] as { id: string }).id,
      theme: entry.theme,
      level: entry.level,
      score: entry.score,
      time_seconds: entry.timeSeconds,
      hints_used: entry.hintsUsed,
    } as never);
  } catch {
    /* Supabase offline — ignora */
  }
}
