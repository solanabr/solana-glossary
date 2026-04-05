/**
 * @arquivo board.ts
 * @descricao Geracao do tabuleiro com casas tipadas
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import type { BoardSpace, SpaceType, BoardThemeId } from "./types";
import { getBoardConfig } from "./themes";

/** Gera o tabuleiro com casas tipadas baseado no tema */
export function generateBoard(theme: BoardThemeId): BoardSpace[] {
  const cfg = getBoardConfig(theme);
  const spaces: BoardSpace[] = [];

  for (let i = 0; i < cfg.totalSpaces; i++) {
    let type: SpaceType = "normal";
    if (i === 0) type = "start";
    else if (i === cfg.totalSpaces - 1) type = "finish";
    else if (i % cfg.challengeFrequency === 0) type = "challenge";
    else if (i % cfg.eventFrequency === 0) type = "event";
    else if (i % 11 === 0) type = "bonus";
    else if (i % 13 === 0) type = "trap";

    spaces.push({ index: i, type });
  }
  return spaces;
}

/** Icone visual por tipo de casa */
export const SPACE_ICONS: Record<SpaceType, string> = {
  start: "🚀",
  finish: "🏆",
  normal: "·",
  event: "🃏",
  challenge: "🧩",
  bonus: "⭐",
  trap: "💀",
};
