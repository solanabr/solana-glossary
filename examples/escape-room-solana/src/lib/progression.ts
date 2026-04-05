/**
 * @arquivo progression.ts
 * @descricao Sistema de progressao — desbloqueio de niveis via localStorage
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import type { ThemeId, LevelId } from "../engine/themes";

const STORAGE_KEY = "escape-room-progress";

/** Ordem dos niveis — Surface e desbloqueado por padrao */
const LEVEL_ORDER: LevelId[] = [
  "surface",
  "confirmation",
  "finality",
  "consensus",
];

/** Mapa de progresso: tema → lista de niveis completados */
interface Progress {
  [themeId: string]: LevelId[];
}

/** Le progresso do localStorage */
function getProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Salva progresso no localStorage */
function saveProgress(progress: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/** Marca um nivel como completado e desbloqueia o proximo */
export function completeLevel(themeId: ThemeId, levelId: LevelId): void {
  const progress = getProgress();
  const completed = progress[themeId] ?? [];
  if (!completed.includes(levelId)) {
    completed.push(levelId);
    progress[themeId] = completed;
    saveProgress(progress);
  }
}

/** Retorna niveis completados para um tema */
export function getCompletedLevels(themeId: ThemeId): LevelId[] {
  return getProgress()[themeId] ?? [];
}

/** Verifica se um nivel esta desbloqueado */
export function isLevelUnlocked(themeId: ThemeId, levelId: LevelId): boolean {
  if (levelId === "surface") return true;
  const completed = getCompletedLevels(themeId);
  const idx = LEVEL_ORDER.indexOf(levelId);
  if (idx <= 0) return true;
  // Nivel anterior precisa estar completado
  return completed.includes(LEVEL_ORDER[idx - 1]);
}

/** Retorna o proximo nivel a jogar (primeiro nao completado) */
export function getNextLevel(themeId: ThemeId): LevelId {
  const completed = getCompletedLevels(themeId);
  for (const lvl of LEVEL_ORDER) {
    if (!completed.includes(lvl)) return lvl;
  }
  return "consensus"; // Todos completados — re-jogar o ultimo
}

/** Verifica se todos os niveis de um tema foram completados */
export function isThemeCompleted(themeId: ThemeId): boolean {
  const completed = getCompletedLevels(themeId);
  return LEVEL_ORDER.every((lvl) => completed.includes(lvl));
}
