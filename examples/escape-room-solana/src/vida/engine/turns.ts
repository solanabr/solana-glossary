/**
 * @arquivo turns.ts
 * @descricao Maquina de estado dos turnos do Jogo da Vida
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import type { GameState, BoardThemeId, TurnTimerOption } from "./types";
import { generateBoard } from "./board";
import { rollDice } from "./dice";
import { drawEventCard } from "./events";
import { generateChallenge } from "./challenges";

/** Cria estado inicial do jogo */
export function createInitialState(
  theme: BoardThemeId,
  players: Array<{ name: string; color: string; wallet: string }>,
  turnTimer: TurnTimerOption = 30,
): GameState {
  const board = generateBoard(theme);
  return {
    board,
    players: players.map((p, i) => ({
      id: i,
      name: p.name,
      wallet: p.wallet,
      color: p.color,
      position: 0,
      score: 0,
      finished: false,
      timeoutCount: 0,
    })),
    currentPlayerIndex: 0,
    turnPhase: "roll",
    diceValue: null,
    activeEvent: null,
    activeChallenge: null,
    winner: null,
    theme,
    turnCount: 0,
    turnTimer,
    turnStartedAt: new Date().toISOString(),
    abortedBy: null,
  };
}

/** Rola o dado e avanca o jogador */
export function performRoll(state: GameState): GameState {
  if (state.turnPhase !== "roll" || state.winner) return state;
  const value = rollDice();
  const player = state.players[state.currentPlayerIndex];
  const maxPos = state.board.length - 1;
  const newPos = Math.min(player.position + value, maxPos);

  const updatedPlayers = state.players.map((p) =>
    p.id === player.id ? { ...p, position: newPos } : p,
  );

  return {
    ...state,
    diceValue: value,
    players: updatedPlayers,
    turnPhase: "moving",
  };
}

/** Resolve o efeito da casa onde o jogador parou */
export function resolveSpace(state: GameState, locale?: string): GameState {
  if (state.turnPhase !== "moving") return state;
  const player = state.players[state.currentPlayerIndex];
  const space = state.board[player.position];

  if (space.type === "finish") {
    const winner = { ...player, finished: true, score: player.score + 500 };
    const updatedPlayers = state.players.map((p) =>
      p.id === player.id ? winner : p,
    );
    return { ...state, players: updatedPlayers, winner, turnPhase: "resolve" };
  }

  if (space.type === "event") {
    const card = drawEventCard(state.theme, locale);
    return { ...state, activeEvent: card, turnPhase: "resolve" };
  }

  if (space.type === "challenge") {
    const q = generateChallenge(state.theme, locale);
    return { ...state, activeChallenge: q, turnPhase: "resolve" };
  }

  if (space.type === "bonus") {
    const ps = state.players.map((p) =>
      p.id === player.id ? { ...p, score: p.score + 100 } : p,
    );
    return { ...state, players: ps, turnPhase: "next" };
  }

  if (space.type === "trap") {
    const newPos = Math.max(0, player.position - 3);
    const ps = state.players.map((p) =>
      p.id === player.id ? { ...p, position: newPos, score: p.score - 50 } : p,
    );
    return { ...state, players: ps, turnPhase: "next" };
  }

  return { ...state, turnPhase: "next" };
}

/** Aplica resultado de evento e limpa */
export function applyEvent(state: GameState): GameState {
  if (!state.activeEvent)
    return { ...state, activeEvent: null, turnPhase: "next" };
  const ev = state.activeEvent;
  const player = state.players[state.currentPlayerIndex];
  const maxPos = state.board.length - 1;

  let newPos = player.position;
  let newScore = player.score;
  if (ev.effect === "advance") newPos = Math.min(newPos + ev.value, maxPos);
  else if (ev.effect === "retreat") newPos = Math.max(0, newPos - ev.value);
  else if (ev.effect === "bonus") newScore += ev.value;
  else if (ev.effect === "penalty") newScore = Math.max(0, newScore - ev.value);

  const ps = state.players.map((p) =>
    p.id === player.id ? { ...p, position: newPos, score: newScore } : p,
  );
  return { ...state, players: ps, activeEvent: null, turnPhase: "next" };
}

/** Aplica resultado do desafio quiz */
export function applyChallenge(state: GameState, correct: boolean): GameState {
  const player = state.players[state.currentPlayerIndex];
  const delta = correct ? 150 : -50;
  const ps = state.players.map((p) =>
    p.id === player.id ? { ...p, score: Math.max(0, p.score + delta) } : p,
  );
  return { ...state, players: ps, activeChallenge: null, turnPhase: "next" };
}

/** Avanca para o proximo jogador */
export function nextTurn(state: GameState): GameState {
  if (state.turnPhase !== "next") return state;
  let next = (state.currentPlayerIndex + 1) % state.players.length;
  while (state.players[next].finished && next !== state.currentPlayerIndex) {
    next = (next + 1) % state.players.length;
  }
  return {
    ...state,
    currentPlayerIndex: next,
    turnPhase: "roll",
    diceValue: null,
    turnCount: state.turnCount + 1,
    turnStartedAt: new Date().toISOString(),
  };
}

/** Pula turno por timeout — 3 skips consecutivos encerram a partida */
export function skipTurn(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const newCount = player.timeoutCount + 1;
  const ps = state.players.map((p) =>
    p.id === player.id ? { ...p, timeoutCount: newCount } : p,
  );
  if (newCount >= 3) {
    return { ...state, players: ps, abortedBy: player.id };
  }
  return nextTurn({ ...state, players: ps, turnPhase: "next" });
}
