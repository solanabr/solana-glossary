/**
 * @arquivo FillBlank.tsx
 * @descricao Puzzle preencher lacuna — definicao com termo omitido, digitar resposta
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PerTermPuzzleProps } from "../engine/puzzleTypes";
import { maskTermInDefinition, fuzzyMatch } from "./shared/textUtils";
import PuzzleShell from "./shared/PuzzleShell";

export default function FillBlank({
  terms,
  disabled,
  theme,
  currentIndex,
  onResult,
}: PerTermPuzzleProps) {
  const { t } = useTranslation();
  const cur = terms[currentIndex];
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Definicao com o termo mascarado
  const masked = useMemo(
    () => maskTermInDefinition(cur.definition, cur.term),
    [cur],
  );

  // Foca no input ao trocar de termo
  useEffect(() => {
    setValue("");
    setAnswered(false);
    inputRef.current?.focus();
  }, [currentIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || answered || value.trim().length === 0) return;
    const correct = fuzzyMatch(value, cur.term);
    setIsCorrect(correct);
    setAnswered(true);
    onResult({ correct: correct ? 1 : 0, wrong: correct ? 0 : 1, done: true });
    setTimeout(() => {
      setAnswered(false);
      setValue("");
    }, 1200);
  };

  // Cor da borda do input baseada no feedback
  const inputBorder = answered
    ? isCorrect
      ? "border-emerald-400 shadow-emerald-500/20"
      : "border-red-400 shadow-red-500/20"
    : "border-white/20 focus:border-purple-400";

  return (
    <PuzzleShell
      puzzleKey={currentIndex}
      titleKey="puzzle.fillBlank"
      hintKey="puzzle.fillBlankHint"
      theme={theme}
    >
      {/* Definicao mascarada */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
        <p className="text-xs text-purple-300 uppercase tracking-wider mb-2">
          {t("escape.station", {
            current: currentIndex + 1,
            total: terms.length,
          })}
        </p>
        <p className="text-lg text-gray-100 leading-relaxed">{masked}</p>
      </div>

      {/* Input de resposta */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled || answered}
            placeholder={t("puzzle.fillBlankPlaceholder")}
            className={`w-full px-5 py-4 bg-white/5 backdrop-blur-md rounded-xl border-2 text-lg text-gray-100 placeholder-gray-500 outline-none transition-all shadow-lg ${inputBorder}`}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Feedback apos resposta */}
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-3 rounded-lg text-sm font-medium ${
              isCorrect
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {isCorrect
              ? t("puzzle.fillBlankCorrect")
              : t("puzzle.fillBlankWrong", { term: cur.term })}
          </motion.div>
        )}

        {!answered && (
          <motion.button
            type="submit"
            disabled={disabled || value.trim().length === 0}
            className="w-full py-4 rounded-xl bg-purple-600/40 border border-purple-500/40 text-purple-200 font-bold text-lg hover:bg-purple-600/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {t("puzzle.fillBlankSubmit")}
          </motion.button>
        )}
      </form>
    </PuzzleShell>
  );
}
