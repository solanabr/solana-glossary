/**
 * @arquivo BoardNormie.tsx
 * @descricao Tabuleiro Futurista/Neon — nos circulares com glow, trilha luminosa
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

const COLS = 10;

const ICONS: Record<SpaceType, string> = {
  start: "🚀",
  finish: "🏆",
  normal: "",
  event: "🃏",
  challenge: "🧩",
  bonus: "⭐",
  trap: "💀",
};

const GLOW: Record<SpaceType, string> = {
  start: "0 0 18px rgba(74,222,128,0.7), inset 0 0 8px rgba(74,222,128,0.3)",
  finish: "0 0 18px rgba(250,204,21,0.7), inset 0 0 8px rgba(250,204,21,0.3)",
  normal: "0 0 4px rgba(6,182,212,0.15)",
  event: "0 0 16px rgba(192,132,252,0.6), inset 0 0 6px rgba(192,132,252,0.2)",
  challenge:
    "0 0 16px rgba(34,211,238,0.6), inset 0 0 6px rgba(34,211,238,0.2)",
  bonus: "0 0 14px rgba(250,204,21,0.5)",
  trap: "0 0 14px rgba(248,113,113,0.5)",
};

const BORDER: Record<SpaceType, string> = {
  start: "#4ade80",
  finish: "#facc15",
  normal: "rgba(6,182,212,0.25)",
  event: "#c084fc",
  challenge: "#22d3ee",
  bonus: "#facc15",
  trap: "#f87171",
};

const BG: Record<SpaceType, string> = {
  start: "rgba(74,222,128,0.08)",
  finish: "rgba(250,204,21,0.08)",
  normal: "rgba(6,182,212,0.03)",
  event: "rgba(192,132,252,0.08)",
  challenge: "rgba(34,211,238,0.08)",
  bonus: "rgba(250,204,21,0.06)",
  trap: "rgba(248,113,113,0.06)",
};

function snakePos(idx: number) {
  const row = Math.floor(idx / COLS);
  const col = row % 2 === 0 ? idx % COLS : COLS - 1 - (idx % COLS);
  return { col, row };
}

export default function BoardNormie({
  spaces,
  players,
  currentPlayerId,
}: Props) {
  const rows = Math.ceil(spaces.length / COLS);
  return (
    <div className="w-full max-w-3xl mx-auto overflow-x-auto font-mono">
      <div
        className="grid gap-2 min-w-[640px]"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {spaces.map((sp) => {
          const { col, row } = snakePos(sp.index);
          const here = players.filter(
            (p) => p.position === sp.index && !p.finished,
          );
          const active = here.some((p) => p.id === currentPlayerId);
          return (
            <div
              key={sp.index}
              className={`relative flex flex-col items-center justify-center min-h-[58px] rounded-full transition-all ${active ? "scale-110 z-10" : ""}`}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                border: `2px solid ${BORDER[sp.type]}`,
                background: BG[sp.type],
                boxShadow: active
                  ? `${GLOW[sp.type]}, 0 0 24px rgba(250,204,21,0.4)`
                  : GLOW[sp.type],
              }}
            >
              {ICONS[sp.type] ? (
                <span className="text-base leading-none">{ICONS[sp.type]}</span>
              ) : (
                <span className="text-[10px] text-cyan-400/60 font-bold">
                  {sp.index}
                </span>
              )}
              {here.length > 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {here.map((p) => (
                    <motion.div
                      key={p.id}
                      layoutId={`pin-${p.id}`}
                      className="w-7 h-7 rounded-full border-2 border-white/80 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: p.color,
                        boxShadow: `0 0 14px ${p.color}, 0 0 4px ${p.color}`,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
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
    </div>
  );
}
