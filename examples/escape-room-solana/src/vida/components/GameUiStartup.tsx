/**
 * @arquivo GameUiStartup.tsx
 * @descricao UX Terminal — CLI verde monocromo, sem dice visual, texto-only
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameUiProps } from "./GameBoard";
import BoardBgMatrix from "./BoardBgMatrix";
import BoardStartup from "./BoardStartup";
import EventCardModal from "./EventCardModal";
import ChallengeModal from "./ChallengeModal";

function AsciiTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = Math.max(0, timeLeft / total);
  const filled = Math.round(pct * 16);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(16 - filled);
  const color = pct > 0.5 ? "#4ade80" : pct > 0.2 ? "#a3e635" : "#ef4444";
  return (
    <span className="text-[11px]" style={{ color }}>
      [{bar}] {timeLeft}s
    </span>
  );
}

export default function GameUiStartup({
  state,
  currentPlayer,
  isMyTurn,
  timeLeft,
  roll,
  dismissEvent,
  answerChallenge,
}: GameUiProps) {
  const [rolling, setRolling] = useState(false);
  const canRoll = state.turnPhase === "roll" && isMyTurn && !rolling;

  const handleRoll = () => {
    if (rolling) return;
    setRolling(true);
    setTimeout(() => {
      setRolling(false);
      roll();
    }, 600);
  };

  return (
    <div className="relative min-h-screen text-green-400 px-4 py-20 bg-[#000a00] font-mono">
      <BoardBgMatrix />
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Terminal header */}
        <div className="mb-4 p-3 border border-green-800/50 bg-black/80 text-[12px] leading-relaxed">
          <p className="text-green-600/60 mb-1">
            $ solana-vida --room {state.turnCount} --player{" "}
            {state.players.length}
          </p>
          <p>
            <span className="text-green-700">&gt; </span>
            <span className="text-green-300">ACTIVE:</span>{" "}
            <span style={{ color: currentPlayer.color }}>
              {currentPlayer.name}
            </span>
            <span className="text-green-700"> | </span>
            <span className="text-green-300">POS:</span>{" "}
            {currentPlayer.position}/49
            <span className="text-green-700"> | </span>
            <span className="text-green-300">SCORE:</span>{" "}
            <span className="text-lime-400 font-bold">
              {currentPlayer.score}
            </span>
            <span className="text-green-700"> | </span>
            <span className="text-green-300">TURN:</span> {state.turnCount + 1}
          </p>
          <div className="mt-1">
            <span className="text-green-700">&gt; </span>
            <AsciiTimer timeLeft={timeLeft} total={state.turnTimer} />
          </div>
        </div>

        {/* Turn prompt */}
        {isMyTurn ? (
          <motion.p
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-[13px] mb-3"
          >
            <span className="text-green-700">&gt; </span>
            <span className="text-lime-400 font-bold">AWAITING_INPUT</span>
            <span className="text-lime-300">{"\u2588"}</span>
          </motion.p>
        ) : (
          <p className="text-[13px] text-green-800 mb-3">
            &gt; STATUS: waiting_for_player_{state.currentPlayerIndex}...
          </p>
        )}

        <BoardStartup
          spaces={state.board}
          players={state.players}
          currentPlayerId={currentPlayer.id}
        />

        {/* Command input — text-only, NO Dice component */}
        <div className="mt-5 border border-green-800/40 bg-black/60 px-4 py-2">
          {state.diceValue && !rolling ? (
            <p className="text-[13px]">
              <span className="text-green-700">&gt; </span>
              <span className="text-green-500">RESULT:</span>{" "}
              <span className="text-lime-400 font-bold text-lg">
                [{state.diceValue}]
              </span>
            </p>
          ) : null}
          {rolling ? (
            <p className="text-[13px] text-green-600/60 animate-pulse">
              &gt; processing...
            </p>
          ) : canRoll ? (
            <button
              onClick={handleRoll}
              className="text-[13px] text-lime-400 hover:text-lime-300 cursor-pointer bg-transparent border-none p-0 font-mono"
            >
              &gt; execute roll() _
            </button>
          ) : !isMyTurn ? (
            <p className="text-[13px] text-green-900">
              &gt; [LOCKED] not_your_turn
            </p>
          ) : (
            <p className="text-[13px] text-green-800">&gt; ready_</p>
          )}
        </div>

        {/* Process table */}
        <div className="mt-4 border border-green-800/30 bg-black/60 p-2 text-[11px]">
          <p className="text-green-700 mb-1">
            PID{"  "}NAME{"            "}SCORE{"   "}POS{"  "}STATUS
          </p>
          <div className="border-t border-green-900/40" />
          {state.players.map((p) => {
            const active = p.id === currentPlayer.id;
            return (
              <p
                key={p.id}
                className={active ? "text-lime-400" : "text-green-700"}
              >
                {String(p.id).padStart(3, "0")} {p.name.padEnd(16, " ")}
                {String(p.score).padStart(5, " ")}{" "}
                {String(p.position).padStart(3, " ")}
                {"  "}
                {active ? "ACTIVE" : "IDLE  "}
              </p>
            );
          })}
        </div>
      </div>

      {/* Modals — SEM wrapper extra (modais ja tem overlay proprio) */}
      <AnimatePresence>
        {state.activeEvent && (
          <EventCardModal card={state.activeEvent} onDismiss={dismissEvent} />
        )}
        {state.activeChallenge && (
          <ChallengeModal
            question={state.activeChallenge}
            onAnswer={answerChallenge}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
