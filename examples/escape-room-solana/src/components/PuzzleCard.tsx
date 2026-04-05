/**
 * @arquivo PuzzleCard.tsx
 * @descricao Card do puzzle — exibe definicao e opcoes de resposta
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PuzzleTerm } from "../lib/glossary";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface AnswerOption {
  id: string;
  term: string;
  isCorrect: boolean;
}

interface PuzzleCardProps {
  term: PuzzleTerm;
  termIndex: number;
  totalTerms: number;
  allPool: PuzzleTerm[];
  selectedId: string | null;
  showFeedback: boolean;
  onAnswer: (option: AnswerOption) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Embaralha array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Gera 4 opcoes: 1 correta + 3 distratores */
function buildOptions(correct: PuzzleTerm, pool: PuzzleTerm[]): AnswerOption[] {
  const distractors = pool.filter((t) => t.id !== correct.id);
  const picked = shuffle(distractors).slice(0, 3);
  return shuffle([
    { id: correct.id, term: correct.term, isCorrect: true },
    ...picked.map((t) => ({ id: t.id, term: t.term, isCorrect: false })),
  ]);
}

/** Determina classe visual do card de resposta */
function cardClass(
  opt: AnswerOption,
  selectedId: string | null,
  showFeedback: boolean,
): string {
  const base =
    "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/40";
  if (!showFeedback) return base;
  if (selectedId === opt.id) {
    return opt.isCorrect
      ? "bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/20"
      : "bg-red-500/20 border-red-400 shadow-lg shadow-red-500/20";
  }
  if (opt.isCorrect) return "bg-emerald-500/10 border-emerald-400/50";
  return base;
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function PuzzleCard({
  term,
  termIndex,
  totalTerms,
  allPool,
  selectedId,
  showFeedback,
  onAnswer,
}: PuzzleCardProps) {
  const { t } = useTranslation();

  // Memoiza opcoes para evitar re-shuffle a cada render
  const options = useMemo(
    () => buildOptions(term, allPool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [term.id],
  );

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Definicao do termo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={termIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-2xl bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8"
        >
          <p className="text-xs text-purple-400 uppercase tracking-wider mb-3 font-semibold">
            {t("escape.station", { current: termIndex + 1, total: totalTerms })}
          </p>
          <h2 className="text-lg md:text-xl text-gray-100 leading-relaxed">
            {term.definition}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Grade de opcoes */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="wait">
          {options.map((opt, i) => (
            <motion.button
              key={`${termIndex}-${opt.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, delay: i * 0.08 }}
              onClick={() => onAnswer(opt)}
              disabled={showFeedback}
              className={`relative text-left px-5 py-4 rounded-xl border backdrop-blur-sm transition-all duration-200 cursor-pointer disabled:cursor-default ${cardClass(opt, selectedId, showFeedback)}`}
            >
              <span className="absolute top-2 right-3 text-[10px] text-gray-500 font-mono">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm md:text-base text-gray-200 font-medium">
                {opt.term}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
