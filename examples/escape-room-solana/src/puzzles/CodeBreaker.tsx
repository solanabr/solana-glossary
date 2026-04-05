/**
 * @arquivo CodeBreaker.tsx
 * @descricao Puzzle quebra-codigo — definicao cifrada, digitar o termo
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PerTermPuzzleProps } from "../engine/puzzleTypes";
import { cipherDefinition, fuzzyMatch } from "./shared/textUtils";
import PuzzleShell from "./shared/PuzzleShell";

export default function CodeBreaker({
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

  // Definicao cifrada — so primeira letra de cada frase visivel
  const ciphered = useMemo(() => cipherDefinition(cur.definition), [cur]);

  // Foca no input ao trocar de termo
  useEffect(() => {
    setValue("");
    setAnswered(false);
    inputRef.current?.focus();
  }, [currentIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || answered || value.trim().length === 0) return;
    const correct = fuzzyMatch(value, cur.term, 3);
    setIsCorrect(correct);
    setAnswered(true);
    onResult({ correct: correct ? 1 : 0, wrong: correct ? 0 : 1, done: true });
    setTimeout(() => {
      setAnswered(false);
      setValue("");
    }, 1200);
  };

  const inputBorder = answered
    ? isCorrect
      ? "border-emerald-400 shadow-emerald-500/20"
      : "border-red-400 shadow-red-500/20"
    : "border-white/20 focus:border-cyan-400";

  return (
    <PuzzleShell
      puzzleKey={currentIndex}
      titleKey="puzzle.codeBreaker"
      hintKey="puzzle.codeBreakerHint"
      theme={theme}
    >
      {/* Definicao cifrada com estetica "terminal" */}
      <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-6 mb-6 font-mono">
        <p className="text-xs text-cyan-400 uppercase tracking-wider mb-3">
          {t("escape.station", {
            current: currentIndex + 1,
            total: terms.length,
          })}
          {" — "}
          {t("puzzle.codeBreakerLabel")}
        </p>
        <p className="text-base text-cyan-100/80 leading-relaxed tracking-wide break-words">
          {ciphered}
        </p>
      </div>

      {/* Dica visual: quantidade de palavras e caracteres */}
      <div className="flex gap-4 mb-4 text-sm text-gray-400">
        <span className="bg-white/5 px-3 py-1 rounded-lg">
          {cur.term.split(/\s+/).length} {t("puzzle.codeBreakerWords")}
        </span>
        <span className="bg-white/5 px-3 py-1 rounded-lg">
          {cur.term.length} {t("puzzle.codeBreakerChars")}
        </span>
      </div>

      {/* Input de decodificacao */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled || answered}
          placeholder={t("puzzle.codeBreakerPlaceholder")}
          className={`w-full px-5 py-4 bg-black/40 backdrop-blur-md rounded-xl border-2 text-lg text-cyan-100 font-mono placeholder-gray-600 outline-none transition-all shadow-lg ${inputBorder}`}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Feedback */}
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-3 rounded-lg text-sm font-medium font-mono ${
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
            className="w-full py-4 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 font-bold font-mono hover:bg-cyan-600/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {t("puzzle.codeBreakerDecode")}
          </motion.button>
        )}
      </form>
    </PuzzleShell>
  );
}
