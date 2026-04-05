/**
 * @arquivo BoardBgMatrix.tsx
 * @descricao Background matrix digital rain para o tema startup
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { memo, useMemo } from "react";

const CHARS = "01アイウエオカキクケコ⚡◆▲";
const COL_COUNT = 18;
const CHARS_PER_COL = 12;

interface ColData {
  left: string;
  delay: string;
  duration: string;
  chars: string;
  opacity: number;
}

function genColumns(): ColData[] {
  return Array.from({ length: COL_COUNT }, (_, i) => {
    const chars = Array.from(
      { length: CHARS_PER_COL },
      () => CHARS[Math.floor(Math.random() * CHARS.length)],
    ).join("\n");
    return {
      left: `${(i / COL_COUNT) * 100 + Math.random() * 2}%`,
      delay: `${Math.random() * -12}s`,
      duration: `${6 + Math.random() * 8}s`,
      chars,
      opacity: 0.15 + Math.random() * 0.25,
    };
  });
}

function BoardBgMatrix() {
  const columns = useMemo(genColumns, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Falling columns */}
      {columns.map((col, i) => (
        <div
          key={i}
          className="absolute top-0 text-green-400 font-mono text-[10px] leading-4 whitespace-pre select-none"
          style={{
            left: col.left,
            opacity: col.opacity,
            animation: `matrixFall ${col.duration} linear infinite`,
            animationDelay: col.delay,
          }}
        >
          {col.chars}
        </div>
      ))}

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)",
        }}
      />

      <style>{`
        @keyframes matrixFall {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(calc(100vh + 100%)); }
        }
      `}</style>
    </div>
  );
}

export default memo(BoardBgMatrix);
