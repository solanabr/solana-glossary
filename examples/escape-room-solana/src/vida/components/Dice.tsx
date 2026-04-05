/**
 * @arquivo Dice.tsx
 * @descricao Dado virtual com animacao de rolagem
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface DiceProps {
  value: number | null;
  disabled: boolean;
  onRoll: () => void;
}

const DOTS: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

export default function Dice({ value, disabled, onRoll }: DiceProps) {
  const { t } = useTranslation();
  const [rolling, setRolling] = useState(false);

  const handleRoll = () => {
    if (disabled || rolling) return;
    setRolling(true);
    setTimeout(() => {
      setRolling(false);
      onRoll();
    }, 600);
  };

  const face = value ?? 1;
  const dots = DOTS[face] ?? [];

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        onClick={handleRoll}
        disabled={disabled || rolling}
        animate={
          rolling
            ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 0.9, 1.1, 1] }
            : {}
        }
        transition={{ duration: 0.6 }}
        className="w-20 h-20 bg-white/10 border-2 border-white/20 rounded-xl grid grid-cols-3 grid-rows-3 gap-0 p-2 cursor-pointer hover:border-yellow-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const hasDot = dots.some(([r, c]) => r === row && c === col);
          return (
            <div key={i} className="flex items-center justify-center">
              {hasDot && (
                <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
              )}
            </div>
          );
        })}
      </motion.button>
      <span className="text-[10px] text-gray-500 font-mono">
        {disabled ? "" : rolling ? "..." : t("vida.rollDice")}
      </span>
    </div>
  );
}
