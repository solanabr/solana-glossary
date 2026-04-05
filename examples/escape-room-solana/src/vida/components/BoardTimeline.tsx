/**
 * @arquivo BoardTimeline.tsx
 * @descricao Tabuleiro Retro/Pixel Art — tiles chunky, cores solidas, estetica 8-bit
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { motion } from "framer-motion";
import type { BoardSpace, Player, SpaceType } from "../engine/types";

interface Props {
  spaces: BoardSpace[];
  players: Player[];
  currentPlayerId: number;
}

const COLS = 8;

const TILE: Record<SpaceType, { bg: string; border: string; icon: string }> = {
  start: { bg: "#166534", border: "#22c55e", icon: "GO" },
  finish: { bg: "#713f12", border: "#eab308", icon: "WIN" },
  normal: { bg: "#1c1917", border: "#44403c", icon: "" },
  event: { bg: "#4a1942", border: "#ec4899", icon: "?" },
  challenge: { bg: "#451a03", border: "#f59e0b", icon: "!" },
  bonus: { bg: "#422006", border: "#facc15", icon: "+" },
  trap: { bg: "#450a0a", border: "#ef4444", icon: "X" },
};

function snakePos(idx: number) {
  const row = Math.floor(idx / COLS);
  const col = row % 2 === 0 ? idx % COLS : COLS - 1 - (idx % COLS);
  return { col, row };
}

export default function BoardTimeline({
  spaces,
  players,
  currentPlayerId,
}: Props) {
  const rows = Math.ceil(spaces.length / COLS);
  return (
    <div className="w-full max-w-3xl mx-auto overflow-x-auto font-['Press_Start_2P',monospace]">
      <div
        className="grid gap-1 min-w-[520px] p-1 border-4 border-orange-800/60 bg-black/40"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          imageRendering: "pixelated",
        }}
      >
        {spaces.map((sp) => {
          const { col, row } = snakePos(sp.index);
          const here = players.filter(
            (p) => p.position === sp.index && !p.finished,
          );
          const active = here.some((p) => p.id === currentPlayerId);
          const tile = TILE[sp.type];
          return (
            <div
              key={sp.index}
              className={`relative flex flex-col items-center justify-center min-h-[58px] transition-all ${active ? "z-10" : ""}`}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                backgroundColor: tile.bg,
                border: `3px solid ${tile.border}`,
                outline: active ? "3px solid #facc15" : "none",
                outlineOffset: "-1px",
                animation: active
                  ? "pixelBlink 0.8s steps(2) infinite"
                  : undefined,
              }}
            >
              {tile.icon ? (
                <span
                  className="text-[10px] font-bold leading-none"
                  style={{ color: tile.border }}
                >
                  {tile.icon}
                </span>
              ) : (
                <span className="text-[7px] text-stone-600">{sp.index}</span>
              )}
              {here.length > 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {here.map((p) => (
                    <motion.div
                      key={p.id}
                      layoutId={`pin-${p.id}`}
                      className="w-6 h-6 flex items-center justify-center text-[8px] font-bold text-white border-2 border-white"
                      style={{ backgroundColor: p.color }}
                      initial={{ y: -8 }}
                      animate={{ y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 15,
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes pixelBlink {
          0%, 100% { outline-color: #facc15; }
          50% { outline-color: transparent; }
        }
      `}</style>
    </div>
  );
}
