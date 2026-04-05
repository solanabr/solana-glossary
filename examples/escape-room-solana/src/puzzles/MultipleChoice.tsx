/**
 * @arquivo MultipleChoice.tsx
 * @descricao Puzzle multipla escolha — definicao → escolher termo correto
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PerTermPuzzleProps } from "../engine/puzzleTypes";
import { shuffle } from "../lib/glossary";
import PuzzleShell from "./shared/PuzzleShell";

const LABELS = ["A", "B", "C", "D"] as const;

export default function MultipleChoice({
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
  const [showFb, setShowFb] = useState(false);

  // Gera 4 opcoes: 1 correta + 3 distratores
  const opts = useMemo(() => {
    const distractors = pool.filter((p) => p.id !== cur.id).slice(0, 3);
    return shuffle([cur, ...distractors], seed + currentIndex * 997);
  }, [cur, pool, seed, currentIndex]);

  const handleClick = (id: string) => {
    if (disabled || showFb) return;
    setSelId(id);
    setShowFb(true);
    const isCorrect = id === cur.id;
    onResult({
      correct: isCorrect ? 1 : 0,
      wrong: isCorrect ? 0 : 1,
      done: true,
    });
    setTimeout(() => {
      setSelId(null);
      setShowFb(false);
    }, 900);
  };

  // Estilos dinamicos baseados no feedback
  const btnClass = (id: string) => {
    const base =
      "w-full text-left px-5 py-4 rounded-xl border font-medium transition-all flex items-center gap-3";
    if (!showFb)
      return `${base} bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-purple-500/40`;
    if (id === cur.id)
      return `${base} bg-emerald-600/30 border-emerald-400/50 text-emerald-200`;
    if (id === selId)
      return `${base} bg-red-600/30 border-red-400/50 text-red-200`;
    return `${base} bg-white/5 border-white/10 text-gray-500 opacity-50`;
  };

  return (
    <PuzzleShell
      puzzleKey={currentIndex}
      titleKey="puzzle.multipleChoice"
      hintKey="puzzle.multipleChoiceHint"
      theme={theme}
    >
      {/* Definicao */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
        <p className="text-xs text-purple-300 uppercase tracking-wider mb-2">
          {t("escape.station", {
            current: currentIndex + 1,
            total: terms.length,
          })}
        </p>
        <p className="text-lg text-gray-100 leading-relaxed">
          {cur.definition}
        </p>
      </div>

      {/* Opcoes */}
      <div className="space-y-3">
        {opts.map((o, i) => (
          <motion.button
            key={o.id}
            onClick={() => handleClick(o.id)}
            disabled={disabled || showFb}
            className={btnClass(o.id)}
            whileHover={!showFb ? { scale: 1.01 } : {}}
            whileTap={!showFb ? { scale: 0.98 } : {}}
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-sm font-bold shrink-0">
              {LABELS[i]}
            </span>
            <span className="text-sm">{o.term}</span>
          </motion.button>
        ))}
      </div>
    </PuzzleShell>
  );
}
