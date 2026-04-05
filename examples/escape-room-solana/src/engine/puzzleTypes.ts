/**
 * @arquivo puzzleTypes.ts
 * @descricao Tipos e interfaces compartilhados entre todos os puzzles
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import type { PuzzleTerm } from "../lib/glossary";
import type { ThemeId } from "./themes";

/** Resultado de uma interacao do jogador com um puzzle */
export interface PuzzleResult {
  correct: number;
  wrong: number;
  /** Puzzle concluido? (per-term: respondeu; batch: todos completados) */
  done: boolean;
}

/** Modos de jogo — per-term itera um a um, batch mostra todos de uma vez */
export type PuzzleMode = "per-term" | "batch";

/** Props base compartilhadas por todos os puzzles */
interface PuzzleBaseProps {
  terms: PuzzleTerm[];
  pool: PuzzleTerm[];
  seed: number;
  disabled: boolean;
  /** Tema visual herdado do GamePlay */
  theme?: ThemeId;
  onResult: (result: PuzzleResult) => void;
}

/** Props para puzzles que exibem um termo por vez */
export interface PerTermPuzzleProps extends PuzzleBaseProps {
  mode: "per-term";
  currentIndex: number;
}

/** Props para puzzles que exibem todos os termos simultaneamente */
export interface BatchPuzzleProps extends PuzzleBaseProps {
  mode: "batch";
}

/** Uniao discriminada — cada puzzle recebe um ou outro */
export type PuzzleProps = PerTermPuzzleProps | BatchPuzzleProps;

/** Tipos de puzzle disponiveis */
export type PuzzleType =
  | "multiple-choice"
  | "true-false"
  | "fill-blank"
  | "connection-web"
  | "term-matcher"
  | "category-sort"
  | "definition-builder"
  | "odd-one-out"
  | "alias-resolver"
  | "related-terms"
  | "code-breaker"
  | "term-timeline";
