/**
 * @arquivo GameUiNormie.tsx
 * @descricao UX Cockpit holografico — HUD glass, 2-col layout, glow cyan/violet
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { AnimatePresence, motion } from "framer-motion";
import type { GameUiProps } from "./GameBoard";
import BoardBgNeon from "./BoardBgNeon";
import BoardNormie from "./BoardNormie";
import Dice from "./Dice";
import EventCardModal from "./EventCardModal";
import ChallengeModal from "./ChallengeModal";

const glass = {
  background: "rgba(6,182,212,0.04)",
  border: "1px solid rgba(6,182,212,0.2)",
  boxShadow:
    "0 0 30px rgba(6,182,212,0.08), inset 0 0 20px rgba(6,182,212,0.03)",
};

const neonTxt = (c: string) => ({ textShadow: `0 0 12px ${c}80` });

export default function GameUiNormie({
  state,
  currentPlayer,
  isMyTurn,
  timeLeft,
  roll,
  dismissEvent,
  answerChallenge,
  t,
}: GameUiProps) {
  const pct = (timeLeft / state.turnTimer) * 100;
  const timerGrad =
    pct > 50
      ? "linear-gradient(90deg,#06b6d4,#8b5cf6)"
      : pct > 20
        ? "linear-gradient(90deg,#eab308,#f59e0b)"
        : "linear-gradient(90deg,#ef4444,#dc2626)";

  return (
    <div className="relative min-h-screen text-white px-4 py-20 bg-[#0a0018] font-['Space_Grotesk',sans-serif]">
      <BoardBgNeon />
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* HUD — glassmorphic bar */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl backdrop-blur-md"
          style={glass}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-bold"
              style={{
                borderColor: currentPlayer.color,
                backgroundColor: `${currentPlayer.color}20`,
                boxShadow: `0 0 18px ${currentPlayer.color}80`,
              }}
            >
              {currentPlayer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-bold text-cyan-100">
                {currentPlayer.name}
              </span>
              <span className="block text-[10px] text-cyan-400/50">
                CASA {currentPlayer.position}/49
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-center">
              <span
                className="text-cyan-400 font-bold text-xl block tabular-nums"
                style={neonTxt("#06b6d4")}
              >
                {currentPlayer.score}
              </span>
              <span className="text-cyan-600/40 text-[9px] uppercase tracking-wider">
                {t("common.score")}
              </span>
            </div>
            <div className="text-center">
              <span className="text-violet-300 font-bold text-xl block">
                {state.turnCount + 1}
              </span>
              <span className="text-violet-400/40 text-[9px] uppercase tracking-wider">
                Turno
              </span>
            </div>
          </div>
        </div>

        {/* Timer — thin gradient glow bar */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-2 mb-1">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: timerGrad }}
          />
        </div>
        <p className="text-right text-[9px] text-cyan-600/30 mb-2">
          {timeLeft}s
        </p>

        {/* Turn indicator */}
        {isMyTurn ? (
          <motion.p
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-center text-sm font-bold mb-3"
            style={{ color: "#06b6d4", ...neonTxt("#06b6d4") }}
          >
            {t("vida.yourTurn")}
          </motion.p>
        ) : (
          <p className="text-center text-sm text-cyan-700/40 mb-3">
            {t("vida.waitingTurn")}
          </p>
        )}

        {/* 2-column: board left, dice+players right */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-[70%]">
            <BoardNormie
              spaces={state.board}
              players={state.players}
              currentPlayerId={currentPlayer.id}
            />
          </div>

          <div className="md:w-[30%] flex flex-col gap-4">
            {/* Dice in glowing circle container */}
            <div
              className="flex justify-center p-4 rounded-2xl backdrop-blur-md"
              style={glass}
            >
              <Dice
                value={state.diceValue}
                disabled={state.turnPhase !== "roll" || !isMyTurn}
                onRoll={roll}
              />
            </div>

            {/* Player list — vertical glow cards */}
            <div className="flex flex-row md:flex-col gap-2 flex-wrap">
              {state.players.map((p) => {
                const active = p.id === currentPlayer.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${active ? "bg-cyan-400/5 border border-cyan-400/30" : "opacity-30"}`}
                    style={active ? { boxShadow: `0 0 12px ${p.color}40` } : {}}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{
                        backgroundColor: p.color,
                        boxShadow: `0 0 8px ${p.color}60`,
                      }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate">{p.name}</span>
                      <span className="text-cyan-400/60 tabular-nums">
                        {p.score} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
