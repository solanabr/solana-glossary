/**
 * @arquivo useTimer.ts
 * @descricao Hook de timer com contagem regressiva, pause e callbacks
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useRef, useCallback, useEffect } from "react";

export interface TimerState {
  /** Segundos restantes */
  remaining: number;
  /** Timer esta rodando? */
  isRunning: boolean;
  /** Timer esgotou? */
  isExpired: boolean;
  /** Formato mm:ss */
  display: string;
  /** Porcentagem de tempo restante (0-100) */
  percent: number;
}

interface UseTimerOptions {
  /** Tempo total em segundos */
  totalSeconds: number;
  /** Callback quando o tempo esgota */
  onExpire?: () => void;
  /** Iniciar automaticamente? */
  autoStart?: boolean;
}

/** Formata segundos para mm:ss */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Hook para timer de contagem regressiva.
 * Retorna estado do timer e controles (start, pause, reset).
 */
export function useTimer({
  totalSeconds,
  onExpire,
  autoStart = false,
}: UseTimerOptions) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Limpa intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Gerencia o intervalo
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setRemaining(totalSeconds);
    setIsRunning(false);
  }, [totalSeconds]);

  const state: TimerState = {
    remaining,
    isRunning,
    isExpired: remaining === 0,
    display: formatTime(remaining),
    percent: (remaining / totalSeconds) * 100,
  };

  return { ...state, start, pause, reset };
}
