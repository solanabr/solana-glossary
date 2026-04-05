/**
 * @arquivo BoardStartup.tsx
 * @descricao Tabuleiro Matrix/Terminal — celulas verdes monocromaticas, estetica hacker
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

const COLS = 5;

const LABEL: Record<SpaceType, string> = {
  start: "[INIT]",
  finish: "[EXIT]",
  normal: "",
  event: "[EVT]",
  challenge: "[QRY]",
  bonus: "[++]",
  trap: "[ERR]",
};

const INTENSITY: Record<SpaceType, number> = {
  start: 0.9,
  finish: 1,
  normal: 0.15,
  event: 0.5,
  challenge: 0.6,
  bonus: 0.7,
  trap: 0.3,
};

function snakePos(idx: number) {
  const row = Math.floor(idx / COLS);
  const col = row % 2 === 0 ? idx % COLS : COLS - 1 - (idx % COLS);
  return { col, row };
}

export default function BoardStartup({
  spaces,
  players,
  currentPlayerId,
}: Props) {
  const rows = Math.ceil(spaces.length / COLS);
  return (
    <div className="w-full max-w-3xl mx-auto overflow-x-auto font-mono text-green-400">
      {/* Scanline overlay */}
      <div className="relative">
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)",
          }}
        />
        <div
          className="grid gap-px min-w-[320px] bg-green-900/20 border border-green-800/40 p-px"
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
            const intensity = INTENSITY[sp.type];
            return (
              <div
                key={sp.index}
                className={`relative flex flex-col items-start justify-center min-h-[48px] px-1.5 py-1 transition-all ${active ? "bg-green-400/20 ring-1 ring-green-400/60" : ""}`}
                style={{
                  gridColumn: col + 1,
                  gridRow: row + 1,
                  backgroundColor: active
                    ? undefined
                    : `rgba(0,${Math.round(intensity * 60)},0,${intensity * 0.15})`,
                  borderLeft: `2px solid rgba(0,${Math.round(100 + intensity * 155)},0,${intensity * 0.6})`,
                }}
              >
                <span className="text-[9px] text-green-700 font-mono">
                  {String(sp.index).padStart(2, "0")}
                </span>
                {LABEL[sp.type] && (
                  <span
                    className="text-[10px] font-bold tracking-tight"
                    style={{
                      color: `rgba(74,222,128,${0.4 + intensity * 0.6})`,
                    }}
                  >
                    {LABEL[sp.type]}
                  </span>
                )}
                {!LABEL[sp.type] && (
                  <span className="text-green-900/60 text-[10px]">&gt;_</span>
                )}
                {here.length > 0 && (
                  <div className="absolute -top-2 right-0.5 flex gap-0.5">
                    {here.map((p) => (
                      <motion.div
                        key={p.id}
                        layoutId={`pin-${p.id}`}
                        className="w-6 h-6 border border-green-400 bg-black flex items-center justify-center text-[9px] font-bold text-green-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
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
    </div>
  );
}
