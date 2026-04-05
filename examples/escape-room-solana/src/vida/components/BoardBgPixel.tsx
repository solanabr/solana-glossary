/**
 * @arquivo BoardBgPixel.tsx
 * @descricao Background pixel art star field para o tema timeline
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { memo, useMemo } from "react";

const STAR_COUNT = 40;
const COLORS = ["#fb923c", "#f472b6", "#fbbf24", "#ffffff", "#e879f9"];

interface Star {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: string;
  twinkle: boolean;
}

function genStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.random() > 0.6 ? 3 : 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: `${Math.random() * -5}s`,
    twinkle: Math.random() > 0.5,
  }));
}

function BoardBgPixel() {
  const stars = useMemo(genStars, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          className={s.twinkle ? "animate-pulse" : ""}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            opacity: s.twinkle ? undefined : 0.4,
            animationDelay: s.delay,
            animationDuration: "3s",
          }}
        />
      ))}

      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(251,146,60,0.15) 3px, rgba(251,146,60,0.15) 4px)",
        }}
      />
    </div>
  );
}

export default memo(BoardBgPixel);
