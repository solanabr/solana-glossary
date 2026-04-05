/**
 * @arquivo GameUiTimeline.tsx
 * @descricao UX Arcade — board hero no topo, HUD fixo no rodape, pixel art
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameUiProps } from "./GameBoard";
import BoardBgPixel from "./BoardBgPixel";
import BoardTimeline from "./BoardTimeline";
import EventCardModal from "./EventCardModal";
import ChallengeModal from "./ChallengeModal";

function PixelTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = Math.max(0, timeLeft / total);
  const filled = Math.round(pct * 12);
  const color = pct > 0.5 ? "#f59e0b" : pct > 0.2 ? "#ef4444" : "#dc2626";
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="flex gap-px">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-4"
            style={{
              backgroundColor: i < filled ? color : "#1c1917",
              border: "2px solid #44403c",
            }}
          />
        ))}
      </div>
      <span className="text-orange-400 text-[10px] tabular-nums">
        {timeLeft}
      </span>
    </div>
  );
}

export default function GameUiTimeline({
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

  const face = state.diceValue ?? "?";

  return (
    <div className="relative min-h-screen text-white bg-[#120810] font-['Press_Start_2P',monospace] pb-36">
      <BoardBgPixel />
      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-20">
        {/* Turn indicator — flashing ABOVE board */}
        {isMyTurn ? (
          <motion.p
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="text-center text-[10px] text-yellow-400 mb-3"
          >
            - YOUR TURN! -
          </motion.p>
        ) : (
          <p className="text-center text-[8px] text-stone-600 mb-3">
            WAITING...
          </p>
        )}

        {/* Board — hero element, takes most space */}
        <BoardTimeline
          spaces={state.board}
          players={state.players}
          currentPlayerId={currentPlayer.id}
        />

        {/* Player roster — between board and HUD */}
        <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
          {state.players.map((p) => {
            const active = p.id === currentPlayer.id;
            return (
              <div
                key={p.id}
                className="px-2 py-1.5 text-[7px]"
                style={{
                  backgroundColor: active ? `${p.color}30` : "#0a0a0a",
                  border: `3px solid ${active ? p.color : "#44403c"}`,
                }}
              >
                <span style={{ color: p.color }}>{p.name.charAt(0)}</span>
                <span className="text-stone-400 ml-1">{p.name}</span>
                <span className="text-orange-400 ml-2 tabular-nums">
                  {p.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Fixed bottom HUD */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-black/90 border-t-4 border-orange-800/40 py-1.5 px-4">
          <PixelTimer timeLeft={timeLeft} total={state.turnTimer} />
        </div>

        {/* HUD bar */}
        <div className="bg-[#120810]/95 border-t-4 border-pink-700/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                backgroundColor: currentPlayer.color,
                border: "3px solid #fff",
              }}
            >
              {currentPlayer.name.charAt(0)}
            </div>
            <div>
              <p className="text-[8px] text-orange-300 truncate max-w-[80px]">
                {currentPlayer.name}
              </p>
              <p className="text-[7px] text-stone-500">
                POS {currentPlayer.position}
              </p>
            </div>
          </div>

          <button
            onClick={handleRoll}
            disabled={!canRoll}
            className="w-[60px] h-[60px] flex items-center justify-center text-xl font-bold border-4 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{
              backgroundColor: canRoll ? "#f59e0b" : "#1c1917",
              borderColor: canRoll ? "#fbbf24" : "#44403c",
              color: canRoll ? "#120810" : "#57534e",
            }}
          >
            {rolling ? ".." : face}
          </button>
          <div className="flex items-center gap-3 text-center">
            <div>
              <p className="text-orange-400 text-sm tabular-nums">
                {currentPlayer.score}
              </p>
              <p className="text-[6px] text-stone-600">SCORE</p>
            </div>
            <div>
              <p className="text-pink-400 text-sm tabular-nums">
                {state.turnCount + 1}
              </p>
              <p className="text-[6px] text-stone-600">ROUND</p>
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
