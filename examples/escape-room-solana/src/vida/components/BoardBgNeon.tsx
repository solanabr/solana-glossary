/**
 * @arquivo BoardBgNeon.tsx
 * @descricao Background animado neon/futurista para o tema normie
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { memo } from "react";

function BoardBgNeon() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Grid lines — cyan horizontal, violet vertical */}
      <div
        className="absolute inset-0 opacity-10 animate-pulse"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6,182,212,0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139,92,246,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          animationDuration: "4s",
        }}
      />

      {/* Horizontal scan line */}
      <div
        className="absolute left-0 right-0 h-px bg-cyan-400/20"
        style={{
          animation: "scanDown 6s linear infinite",
        }}
      />

      {/* Center radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Corner accent — top left */}
      <div
        className="absolute top-0 left-0 w-32 h-32 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 0 0, rgba(6,182,212,0.4) 0%, transparent 70%)",
        }}
      />

      <style>{`
        @keyframes scanDown {
          0% { top: -1px; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

export default memo(BoardBgNeon);
