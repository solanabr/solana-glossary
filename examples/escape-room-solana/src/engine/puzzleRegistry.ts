/**
 * @arquivo puzzleRegistry.ts
 * @descricao Registro dos 12 puzzles — mapeia (tema, nivel) para componente
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { lazy } from "react";
import type { ThemeId, LevelId } from "./themes";
import type { PuzzleMode } from "./puzzleTypes";

/** Entrada no registro de puzzles */
export interface PuzzleEntry {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  mode: PuzzleMode;
  labelKey: string;
}

/** Mapa completo: 3 temas x 4 niveis = 12 puzzles distintos */
const REGISTRY: Record<string, PuzzleEntry> = {
  // ── Tema 1: O Bloco Genesis ──────────────────────────────
  "genesis:surface": {
    component: lazy(() => import("../puzzles/MultipleChoice")),
    mode: "per-term",
    labelKey: "puzzle.multipleChoice",
  },
  "genesis:confirmation": {
    component: lazy(() => import("../puzzles/TrueFalse")),
    mode: "per-term",
    labelKey: "puzzle.trueFalse",
  },
  "genesis:finality": {
    component: lazy(() => import("../puzzles/FillBlank")),
    mode: "per-term",
    labelKey: "puzzle.fillBlank",
  },
  "genesis:consensus": {
    component: lazy(() => import("../puzzles/ConnectionWeb")),
    mode: "batch",
    labelKey: "puzzle.connectionWeb",
  },

  // ── Tema 2: O Cofre DeFi ─────────────────────────────────
  "defi:surface": {
    component: lazy(() => import("../puzzles/TermMatcher")),
    mode: "batch",
    labelKey: "puzzle.termMatcher",
  },
  "defi:confirmation": {
    component: lazy(() => import("../puzzles/CategorySort")),
    mode: "batch",
    labelKey: "puzzle.categorySort",
  },
  "defi:finality": {
    component: lazy(() => import("../puzzles/DefinitionBuilder")),
    mode: "per-term",
    labelKey: "puzzle.definitionBuilder",
  },
  "defi:consensus": {
    component: lazy(() => import("../puzzles/OddOneOut")),
    mode: "per-term",
    labelKey: "puzzle.oddOneOut",
  },

  // ── Tema 3: O Laboratorio do Dev ─────────────────────────
  "lab:surface": {
    component: lazy(() => import("../puzzles/AliasResolver")),
    mode: "per-term",
    labelKey: "puzzle.aliasResolver",
  },
  "lab:confirmation": {
    component: lazy(() => import("../puzzles/RelatedTerms")),
    mode: "per-term",
    labelKey: "puzzle.relatedTerms",
  },
  "lab:finality": {
    component: lazy(() => import("../puzzles/CodeBreaker")),
    mode: "per-term",
    labelKey: "puzzle.codeBreaker",
  },
  "lab:consensus": {
    component: lazy(() => import("../puzzles/TermTimeline")),
    mode: "batch",
    labelKey: "puzzle.termTimeline",
  },
};

/** Busca a entrada do puzzle para um tema/nivel */
export function getPuzzleEntry(theme: ThemeId, level: LevelId): PuzzleEntry {
  const entry = REGISTRY[`${theme}:${level}`];
  if (!entry) throw new Error(`Puzzle nao registrado: ${theme}:${level}`);
  return entry;
}
