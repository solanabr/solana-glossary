/**
 * @arquivo TermMatcher.tsx
 * @descricao Puzzle combinar termos — parear termos com definicoes (batch)
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { BatchPuzzleProps } from "../engine/puzzleTypes";
import { shuffle } from "../lib/glossary";
import PuzzleShell from "./shared/PuzzleShell";

/** Limita a 6 pares para caber na tela */
const MAX_PAIRS = 6;

export default function TermMatcher({
  terms,
  seed,
  disabled,
  theme,
  onResult,
}: BatchPuzzleProps) {
  const { t } = useTranslation();

  // Termos e definicoes embaralhados independentemente
  const { termCol, defCol } = useMemo(() => {
    const slice = terms.slice(0, MAX_PAIRS);
    return {
      termCol: shuffle(slice, seed),
      defCol: shuffle(slice, seed + 31),
    };
  }, [terms, seed]);

  const [selTerm, setSelTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const handleTermClick = (id: string) => {
    if (disabled || matched.has(id)) return;
    setSelTerm(id);
    setWrongPair(null);
  };

  const handleDefClick = (id: string) => {
    if (disabled || matched.has(id) || !selTerm) return;

    if (selTerm === id) {
      // Par correto
      const next = new Set(matched);
      next.add(id);
      setMatched(next);
      setSelTerm(null);
      setCorrectCount((c) => c + 1);
      // Verifica se terminou
      if (next.size === termCol.length) {
        onResult({ correct: correctCount + 1, wrong: wrongCount, done: true });
      }
    } else {
      // Par errado — flash vermelho
      setWrongPair(id);
      setWrongCount((w) => w + 1);
      setTimeout(() => {
        setWrongPair(null);
        setSelTerm(null);
      }, 600);
    }
  };

  // Estilos das colunas
  const termStyle = (id: string) => {
    if (matched.has(id))
      return "bg-emerald-600/20 border-emerald-400/50 text-emerald-300 opacity-60";
    if (selTerm === id)
      return "bg-purple-500/20 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/10";
    return "bg-white/5 border-white/10 text-gray-200 hover:border-purple-500/30 cursor-pointer";
  };

  const defStyle = (id: string) => {
    if (matched.has(id))
      return "bg-emerald-600/20 border-emerald-400/50 text-emerald-300 opacity-60";
    if (wrongPair === id) return "bg-red-600/20 border-red-400 text-red-200";
    if (selTerm)
      return "bg-white/5 border-white/10 text-gray-200 hover:border-cyan-500/30 cursor-pointer";
    return "bg-white/5 border-white/10 text-gray-400";
  };

  return (
    <PuzzleShell
      puzzleKey="term-matcher"
      titleKey="puzzle.termMatcher"
      hintKey="puzzle.termMatcherHint"
      theme={theme}
    >
      {/* Progresso */}
      <div className="text-center mb-4 text-sm text-gray-400">
        {t("puzzle.matched", { count: matched.size, total: termCol.length })}
      </div>

      {/* Duas colunas: termos | definicoes */}
      <div className="grid grid-cols-2 gap-4">
        {/* Coluna de termos */}
        <div className="space-y-2">
          <p className="text-xs text-purple-300 uppercase tracking-wider mb-2 font-semibold">
            {t("puzzle.termMatcherTerms")}
          </p>
          {termCol.map((item) => (
            <motion.button
              key={`t-${item.id}`}
              onClick={() => handleTermClick(item.id)}
              disabled={disabled || matched.has(item.id)}
              className={`w-full px-3 py-3 rounded-xl border text-left text-sm font-medium transition-all ${termStyle(item.id)}`}
              whileTap={!matched.has(item.id) ? { scale: 0.97 } : {}}
            >
              {item.term}
            </motion.button>
          ))}
        </div>

        {/* Coluna de definicoes */}
        <div className="space-y-2">
          <p className="text-xs text-cyan-300 uppercase tracking-wider mb-2 font-semibold">
            {t("puzzle.termMatcherDefs")}
          </p>
          {defCol.map((item) => (
            <motion.button
              key={`d-${item.id}`}
              onClick={() => handleDefClick(item.id)}
              disabled={disabled || matched.has(item.id) || !selTerm}
              className={`w-full px-3 py-3 rounded-xl border text-left text-xs leading-snug transition-all ${defStyle(item.id)}`}
              whileTap={selTerm && !matched.has(item.id) ? { scale: 0.97 } : {}}
            >
              {item.definition.slice(0, 100)}
              {item.definition.length > 100 ? "..." : ""}
            </motion.button>
          ))}
        </div>
      </div>
    </PuzzleShell>
  );
}
