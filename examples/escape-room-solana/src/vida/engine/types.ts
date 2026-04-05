/**
 * @arquivo types.ts
 * @descricao Tipos do Jogo da Vida Solana — tabuleiro, jogadores, estado
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

/** Temas dos tabuleiros */
export type BoardThemeId = "normie" | "startup" | "timeline";

/** Tipos de casas do tabuleiro */
export type SpaceType =
  | "normal"
  | "event"
  | "challenge"
  | "bonus"
  | "trap"
  | "start"
  | "finish";

/** Uma casa do tabuleiro */
export interface BoardSpace {
  index: number;
  type: SpaceType;
  label?: string;
}

/** Cores disponiveis para jogadores */
export const PLAYER_COLORS = [
  "#9945FF",
  "#14F195",
  "#00D1FF",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#10B981",
] as const;

/** Jogador em partida */
export interface Player {
  id: number;
  name: string;
  wallet: string;
  color: string;
  position: number;
  score: number;
  finished: boolean;
  timeoutCount: number;
}

/** Fases do turno */
export type TurnPhase = "roll" | "moving" | "resolve" | "next";

/** Opcoes de tempo por turno (segundos) */
export type TurnTimerOption = 15 | 30 | 60;

/** Efeito de uma carta de evento */
export interface EventCard {
  term: string;
  definition: string;
  effect: "advance" | "retreat" | "bonus" | "penalty";
  value: number;
  category: string;
}

/** Desafio quiz em casas especiais */
export interface ChallengeQuestion {
  term: string;
  definition: string;
  options: string[];
  correctIndex: number;
}

/** Estado completo do jogo */
export interface GameState {
  board: BoardSpace[];
  players: Player[];
  currentPlayerIndex: number;
  turnPhase: TurnPhase;
  diceValue: number | null;
  activeEvent: EventCard | null;
  activeChallenge: ChallengeQuestion | null;
  winner: Player | null;
  theme: BoardThemeId;
  turnCount: number;
  turnTimer: TurnTimerOption;
  turnStartedAt: string;
  abortedBy: number | null;
}

/** Configuracao de um tabuleiro */
export interface BoardConfig {
  id: BoardThemeId;
  totalSpaces: number;
  eventFrequency: number;
  challengeFrequency: number;
  categories: string[];
}
