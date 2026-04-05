/**
 * @arquivo Confetti.tsx
 * @descricao Particulas de confetti para tela de vitoria
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#9945FF", "#14F195", "#00D1FF", "#FFD700", "#FF6B6B"];

export default function Confetti() {
  const dots = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        color: COLORS[i % 5],
        x: Math.random() * 100,
        delay: Math.random() * 2,
        dur: 2 + Math.random() * 3,
        size: 4 + Math.random() * 8,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full"
          style={{
            background: d.color,
            width: d.size,
            height: d.size,
            left: `${d.x}%`,
            top: -10,
          }}
          animate={{
            y: ["0vh", "110vh"],
            rotate: [0, 360],
            opacity: [1, 0.6, 0],
          }}
          transition={{
            duration: d.dur,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}
