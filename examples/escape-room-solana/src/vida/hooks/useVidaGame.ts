/**
 * @arquivo useVidaGame.ts
 * @descricao Hook principal do Jogo da Vida — multiplayer via Supabase sync
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GameState, BoardThemeId, TurnTimerOption } from "../engine/types";
import {
  createInitialState,
  performRoll,
  resolveSpace,
  applyEvent,
  applyChallenge,
  nextTurn,
  skipTurn,
} from "../engine/turns";
import { saveGameState, loadGameState } from "../engine/rooms";
import { audioManager } from "../../lib/audio";

interface UseVidaGameOpts {
  theme: BoardThemeId;
  players: Array<{ name: string; color: string; wallet: string }>;
  roomCode?: string;
  myWallet: string;
  turnTimer?: TurnTimerOption;
}

/**
 * Modelo de sync:
 * - Jogador ativo: computa turno local, salva 1x, NAO faz poll
 * - Jogadores esperando: poll a cada 1.5s, NAO salvam
 * - Timer: countdown por turno, auto-skip no timeout, 3x = game over
 */
export function useVidaGame({
  theme,
  players,
  roomCode,
  myWallet,
  turnTimer = 30,
}: UseVidaGameOpts) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const [state, setState] = useState<GameState>(() =>
    createInitialState(theme, players, turnTimer),
  );
  const [timeLeft, setTimeLeft] = useState<number>(turnTimer);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer?.wallet === myWallet;

  const stateRef = useRef(state);
  stateRef.current = state;
  const isMyTurnRef = useRef(isMyTurn);
  isMyTurnRef.current = isMyTurn;

  const sync = useCallback(
    (s: GameState) => {
      if (!roomCode) return;
      console.log("[vida] sync →", {
        idx: s.currentPlayerIndex,
        phase: s.turnPhase,
        turn: s.turnCount,
      });
      saveGameState(roomCode, s);
    },
    [roomCode],
  );

  // Poll Supabase — PULA quando e minha vez
  useEffect(() => {
    if (!roomCode) return;
    const id = setInterval(async () => {
      if (isMyTurnRef.current) return;
      const raw = await loadGameState(roomCode);
      if (!raw) return;
      const remote = raw as GameState;
      const local = stateRef.current;
      if (
        remote.turnCount !== local.turnCount ||
        remote.currentPlayerIndex !== local.currentPlayerIndex ||
        remote.abortedBy !== local.abortedBy ||
        !!remote.winner !== !!local.winner
      ) {
        console.log("[vida] poll ←", {
          idx: remote.currentPlayerIndex,
          phase: remote.turnPhase,
          turn: remote.turnCount,
        });
        setState(remote);
        return;
      }
      // Timeout fallback — jogador ativo desconectou (+3s buffer)
      if (!remote.abortedBy && !remote.winner && remote.turnPhase === "roll") {
        const elapsed =
          (Date.now() - new Date(remote.turnStartedAt).getTime()) / 1000;
        if (elapsed > remote.turnTimer + 3) {
          console.log("[vida] poll: timeout fallback, skipping");
          const skipped = skipTurn(remote);
          setState(skipped);
          stateRef.current = skipped;
          sync(skipped);
        }
      }
    }, 1500);
    return () => clearInterval(id);
  }, [roomCode, sync]);

  // Reset visual timer quando turno muda
  useEffect(() => {
    setTimeLeft(stateRef.current.turnTimer);
  }, [state.turnCount]);

  // Countdown — so conta na fase "roll", auto-skip para jogador ativo
  useEffect(() => {
    if (state.abortedBy !== null || state.winner) return;
    const id = setInterval(() => {
      const cur = stateRef.current;
      if (cur.turnPhase !== "roll") return;
      const elapsed =
        (Date.now() - new Date(cur.turnStartedAt).getTime()) / 1000;
      const remaining = Math.max(0, cur.turnTimer - elapsed);
      setTimeLeft(Math.ceil(remaining));
      if (isMyTurnRef.current && remaining <= 0 && !cur.abortedBy) {
        console.log("[vida] timeout: auto-skip");
        const skipped = skipTurn(cur);
        setState(skipped);
        stateRef.current = skipped;
        sync(skipped);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.turnCount, state.abortedBy, state.winner, sync]);

  /** Reseta timeoutCount do jogador ao tomar acao */
  const resetTimeout = (s: GameState): GameState => {
    const p = s.players[s.currentPlayerIndex];
    if (p.timeoutCount === 0) return s;
    const ps = s.players.map((pl) =>
      pl.id === p.id ? { ...pl, timeoutCount: 0 } : pl,
    );
    return { ...s, players: ps };
  };

  const roll = useCallback(() => {
    const prev = stateRef.current;
    if (prev.turnPhase !== "roll" || !isMyTurnRef.current) return;
    audioManager.playSfx("diceRoll");
    const clean = resetTimeout(prev);
    const rolled = performRoll(clean);
    setState(rolled);
    stateRef.current = rolled;
    setTimeout(() => {
      if (stateRef.current !== rolled) return;
      const resolved = resolveSpace(rolled, locale);
      if (resolved.activeEvent) {
        audioManager.playSfx("event");
        setState(resolved);
        stateRef.current = resolved;
        sync(resolved);
        return;
      }
      if (resolved.activeChallenge || resolved.winner) {
        setState(resolved);
        stateRef.current = resolved;
        sync(resolved);
        return;
      }
      // Check space type for SFX
      const sp =
        rolled.board[rolled.players[rolled.currentPlayerIndex].position];
      if (sp?.type === "bonus") audioManager.playSfx("bonus");
      else if (sp?.type === "trap") audioManager.playSfx("trap");
      else audioManager.playSfx("move");
      const final = nextTurn(resolved);
      setState(final);
      stateRef.current = final;
      sync(final);
    }, 1000);
  }, [locale, sync]);

  const dismissEvent = useCallback(() => {
    if (!isMyTurnRef.current) return;
    const prev = stateRef.current;
    if (!prev.activeEvent) return;
    const applied = applyEvent(prev);
    const final = nextTurn(applied);
    setState(final);
    stateRef.current = final;
    sync(final);
  }, [sync]);

  const answerChallenge = useCallback(
    (correct: boolean) => {
      if (!isMyTurnRef.current) return;
      const prev = stateRef.current;
      if (!prev.activeChallenge) return;
      audioManager.playSfx(correct ? "correct" : "wrong");
      const applied = applyChallenge(prev, correct);
      const final = nextTurn(applied);
      setState(final);
      stateRef.current = final;
      sync(final);
    },
    [sync],
  );

  return {
    state,
    currentPlayer,
    isMyTurn,
    timeLeft,
    roll,
    dismissEvent,
    answerChallenge,
  };
}
