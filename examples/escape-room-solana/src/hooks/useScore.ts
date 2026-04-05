/**
 * @arquivo useScore.ts
 * @descricao Hook para sistema de pontuacao com bonus de tempo e multiplicador
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useCallback } from "react";

/** Pontos base por tipo de acao */
const POINTS = {
  correctAnswer: 100,
  wrongAnswer: -25,
  timeBonus: 2,
  perfectClear: 500,
} as const;

export interface ScoreState {
  /** Pontuacao total */
  total: number;
  /** Acertos */
  correctCount: number;
  /** Erros */
  wrongCount: number;
  /** Bonus de tempo ganho */
  timeBonus: number;
  /** Penalidade de dicas */
  hintPenalty: number;
  /** Multiplicador do nivel */
  multiplier: number;
}

interface UseScoreOptions {
  /** Multiplicador de pontos do nivel */
  multiplier: number;
}

/**
 * Hook para calcular pontuacao do escape room.
 * Pontos = (acertos * 100 - erros * 25 + bonus_tempo - penalidade_dicas) * multiplicador
 */
export function useScore({ multiplier }: UseScoreOptions) {
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [hintPenalty, setHintPenalty] = useState(0);
  const [timeBonus, setTimeBonus] = useState(0);

  /** Registra uma resposta correta */
  const addCorrect = useCallback(() => {
    setCorrectCount((prev) => prev + 1);
  }, []);

  /** Registra uma resposta errada */
  const addWrong = useCallback(() => {
    setWrongCount((prev) => prev + 1);
  }, []);

  /** Define penalidade por dicas usadas */
  const setHintPenaltyValue = useCallback((penalty: number) => {
    setHintPenalty(penalty);
  }, []);

  /** Calcula bonus de tempo baseado nos segundos restantes */
  const calculateTimeBonus = useCallback((secondsLeft: number) => {
    const bonus = secondsLeft * POINTS.timeBonus;
    setTimeBonus(bonus);
    return bonus;
  }, []);

  /** Calcula pontuacao final */
  const calculateFinal = useCallback(
    (secondsLeft: number, hintPenaltyTotal: number): number => {
      const tBonus = secondsLeft * POINTS.timeBonus;
      const base =
        correctCount * POINTS.correctAnswer +
        wrongCount * POINTS.wrongAnswer +
        tBonus -
        hintPenaltyTotal;
      // Bonus de perfect clear (zero erros, zero dicas)
      const perfect =
        wrongCount === 0 && hintPenaltyTotal === 0 ? POINTS.perfectClear : 0;
      return Math.max(0, Math.round((base + perfect) * multiplier));
    },
    [correctCount, wrongCount, multiplier],
  );

  /** Reseta para novo puzzle */
  const resetScore = useCallback(() => {
    setCorrectCount(0);
    setWrongCount(0);
    setHintPenalty(0);
    setTimeBonus(0);
  }, []);

  // Calcula total em tempo real
  const rawTotal =
    correctCount * POINTS.correctAnswer +
    wrongCount * POINTS.wrongAnswer +
    timeBonus -
    hintPenalty;
  const total = Math.max(0, Math.round(rawTotal * multiplier));

  const state: ScoreState = {
    total,
    correctCount,
    wrongCount,
    timeBonus,
    hintPenalty,
    multiplier,
  };

  return {
    ...state,
    addCorrect,
    addWrong,
    setHintPenalty: setHintPenaltyValue,
    calculateTimeBonus,
    calculateFinal,
    resetScore,
  };
}
