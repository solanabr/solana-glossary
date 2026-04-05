/**
 * @arquivo OddOneOut.tsx
 * @descricao Puzzle intruso — identificar o termo que nao pertence ao grupo
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PerTermPuzzleProps } from "../engine/puzzleTypes";
import { shuffle } from "../lib/glossary";
import PuzzleShell from "./shared/PuzzleShell";

export default function OddOneOut({
  terms,
  pool,
  seed,
  disabled,
  theme,
  currentIndex,
  onResult,
}: PerTermPuzzleProps) {
  const { t } = useTranslation();
  const cur = terms[currentIndex];
  const [selId, setSelId] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  // Monta grupo: 3 termos da mesma categoria + 1 intruso (de outra categoria)
  const { group, oddId } = useMemo(() => {
    const sameCategory = pool.filter(
      (p) => p.category === cur.category && p.id !== cur.id,
    );
    const diffCategory = pool.filter(
      (p) => p.category !== cur.category && p.definition.length > 0,
    );

    // 3 da mesma categoria (incluindo cur)
    const sameThree = shuffle(sameCategory, seed + currentIndex * 13).slice(
      0,
      2,
    );
    const same = [cur, ...sameThree];

    // 1 intruso de outra categoria
    const odd = shuffle(diffCategory, seed + currentIndex * 37)[0];
    if (!odd) return { group: same, oddId: "" };

    return {
      group: shuffle([...same, odd], seed + currentIndex * 53),
      oddId: odd.id,
    };
  }, [cur, pool, seed, currentIndex]);

  const handleClick = (id: string) => {
    if (disabled || answered) return;
    setSelId(id);
    setAnswered(true);
    const isCorrect = id === oddId;
    onResult({
      correct: isCorrect ? 1 : 0,
      wrong: isCorrect ? 0 : 1,
      done: true,
    });
    setTimeout(() => {
      setSelId(null);
      setAnswered(false);
    }, 900);
  };

  // Estilo do card com feedback
  const cardStyle = (id: string) => {
    const base =
      "px-5 py-4 rounded-xl border-2 text-left transition-all cursor-pointer";
    if (!answered)
      return `${base} border-white/10 bg-white/5 text-gray-200 hover:border-purple-500/40 hover:bg-white/10`;
    if (id === oddId)
      return `${base} border-emerald-400 bg-emerald-600/20 text-emerald-200`;
    if (id === selId)
      return `${base} border-red-400 bg-red-600/20 text-red-200`;
    return `${base} border-white/10 bg-white/5 text-gray-500 opacity-50`;
  };

  return (
    <PuzzleShell
      puzzleKey={currentIndex}
      titleKey="puzzle.oddOneOut"
      hintKey="puzzle.oddOneOutHint"
      theme={theme}
    >
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
        <p className="text-xs text-purple-300 uppercase tracking-wider mb-2">
          {t("escape.station", {
            current: currentIndex + 1,
            total: terms.length,
          })}
        </p>
        <p className="text-sm text-gray-400">
          {t("puzzle.oddOneOutInstruction")}
        </p>
      </div>

      {/* Grid de termos */}
      <div className="grid grid-cols-2 gap-3">
        {group.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => handleClick(item.id)}
            disabled={disabled || answered}
            className={cardStyle(item.id)}
            whileHover={!answered ? { scale: 1.02 } : {}}
            whileTap={!answered ? { scale: 0.97 } : {}}
          >
            <p className="font-bold text-base">{item.term}</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {item.definition.slice(0, 80)}...
            </p>
          </motion.button>
        ))}
      </div>
    </PuzzleShell>
  );
}
