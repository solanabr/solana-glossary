/**
 * @arquivo useHints.ts
 * @descricao Hook para sistema de dicas progressivo com penalidade
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useCallback } from "react";
import type { PuzzleTerm } from "../lib/glossary";
import { generateHint } from "../lib/glossary";

export interface Hint {
  /** Indice do termo que a dica revela */
  termIndex: number;
  /** Texto da dica */
  text: string;
  /** Ja foi revelada? */
  revealed: boolean;
}

export interface HintsState {
  /** Dicas disponiveis */
  hints: Hint[];
  /** Quantas dicas ja foram usadas */
  usedCount: number;
  /** Maximo de dicas permitido */
  maxHints: number;
  /** Pode usar mais dicas? */
  canUseHint: boolean;
  /** Total de penalidade acumulada */
  totalPenalty: number;
}

interface UseHintsOptions {
  /** Termos do puzzle atual */
  terms: PuzzleTerm[];
  /** Maximo de dicas permitido neste nivel */
  maxHints: number;
  /** Pontos perdidos por dica usada */
  penaltyPerHint: number;
}

/**
 * Hook para gerenciar dicas do escape room.
 * Gera dicas pre-carregadas (bloqueadas) e revela conforme o jogador pede.
 */
export function useHints({ terms, maxHints, penaltyPerHint }: UseHintsOptions) {
  // Gera dicas para os primeiros N termos (ate maxHints)
  const initialHints: Hint[] = terms.slice(0, maxHints).map((term, i) => ({
    termIndex: i,
    text: generateHint(term),
    revealed: false,
  }));

  const [hints, setHints] = useState<Hint[]>(initialHints);
  const [usedCount, setUsedCount] = useState(0);

  /** Revela a proxima dica disponivel */
  const revealNext = useCallback((): Hint | null => {
    const nextIndex = hints.findIndex((h) => !h.revealed);
    if (nextIndex === -1) return null;

    setHints((prev) =>
      prev.map((h, i) => (i === nextIndex ? { ...h, revealed: true } : h)),
    );
    setUsedCount((prev) => prev + 1);
    return hints[nextIndex];
  }, [hints]);

  /** Reseta todas as dicas (novo puzzle) */
  const resetHints = useCallback(
    (newTerms: PuzzleTerm[]) => {
      setHints(
        newTerms.slice(0, maxHints).map((term, i) => ({
          termIndex: i,
          text: generateHint(term),
          revealed: false,
        })),
      );
      setUsedCount(0);
    },
    [maxHints],
  );

  const state: HintsState = {
    hints,
    usedCount,
    maxHints,
    canUseHint: usedCount < maxHints,
    totalPenalty: usedCount * penaltyPerHint,
  };

  return { ...state, revealNext, resetHints };
}
