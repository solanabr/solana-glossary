/**
 * @arquivo TrueFalse.tsx
 * @descricao Puzzle verdadeiro/falso — termo + definicao, jogador valida
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PerTermPuzzleProps } from "../engine/puzzleTypes";
import PuzzleShell from "./shared/PuzzleShell";

export default function TrueFalse({
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
  const [answered, setAnswered] = useState(false);
  const [playerSaidTrue, setPlayerSaidTrue] = useState<boolean | null>(null);

  // 50% chance de trocar a definicao por uma de outro termo
  const isSwapped = useMemo(() => {
    const s = (seed + currentIndex * 31) % 100;
    return s < 50;
  }, [seed, currentIndex]);

  // Definicao exibida (real ou trocada)
  const displayDef = useMemo(() => {
    if (!isSwapped) return cur.definition;
    const others = pool.filter(
      (p) => p.id !== cur.id && p.definition.length > 0,
    );
    const pickSeed = (seed + currentIndex * 71) % others.length;
    return others[Math.abs(pickSeed)]?.definition ?? cur.definition;
  }, [cur, pool, seed, currentIndex, isSwapped]);

  // A resposta correta e "verdadeiro" se NAO esta trocada
  const correctAnswer = !isSwapped;

  const handleAnswer = (saidTrue: boolean) => {
    if (disabled || answered) return;
    setAnswered(true);
    setPlayerSaidTrue(saidTrue);
    const isCorrect = saidTrue === correctAnswer;
    onResult({
      correct: isCorrect ? 1 : 0,
      wrong: isCorrect ? 0 : 1,
      done: true,
    });
    setTimeout(() => {
      setAnswered(false);
      setPlayerSaidTrue(null);
    }, 900);
  };

  // Classe do botao com feedback visual
  const btnStyle = (isTrue: boolean) => {
    const base =
      "flex-1 py-5 rounded-xl border-2 font-bold text-lg transition-all";
    if (!answered) {
      return isTrue
        ? `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20`
        : `${base} border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20`;
    }
    const wasClicked = playerSaidTrue === isTrue;
    const isRight = isTrue === correctAnswer;
    if (wasClicked && isRight)
      return `${base} border-emerald-400 bg-emerald-600/30 text-emerald-200 shadow-lg shadow-emerald-500/20`;
    if (wasClicked && !isRight)
      return `${base} border-red-400 bg-red-600/30 text-red-200 shadow-lg shadow-red-500/20`;
    if (!wasClicked && isRight)
      return `${base} border-emerald-400/50 bg-emerald-500/10 text-emerald-300`;
    return `${base} border-white/10 bg-white/5 text-gray-500 opacity-50`;
  };

  return (
    <PuzzleShell
      puzzleKey={currentIndex}
      titleKey="puzzle.trueFalse"
      hintKey="puzzle.trueFalseHint"
      theme={theme}
    >
      {/* Card com termo + definicao */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
        <p className="text-xs text-purple-300 uppercase tracking-wider mb-2">
          {t("escape.station", {
            current: currentIndex + 1,
            total: terms.length,
          })}
        </p>
        <h3 className="text-xl font-bold text-cyan-300 mb-3">{cur.term}</h3>
        <p className="text-lg text-gray-100 leading-relaxed">{displayDef}</p>
      </div>

      {/* Botoes Verdadeiro / Falso */}
      <div className="flex gap-4">
        <motion.button
          onClick={() => handleAnswer(true)}
          disabled={disabled || answered}
          className={btnStyle(true)}
          whileHover={!answered ? { scale: 1.02 } : {}}
          whileTap={!answered ? { scale: 0.98 } : {}}
        >
          {t("puzzle.trueFalseTrue")}
        </motion.button>
        <motion.button
          onClick={() => handleAnswer(false)}
          disabled={disabled || answered}
          className={btnStyle(false)}
          whileHover={!answered ? { scale: 1.02 } : {}}
          whileTap={!answered ? { scale: 0.98 } : {}}
        >
          {t("puzzle.trueFalseFalse")}
        </motion.button>
      </div>
    </PuzzleShell>
  );
}
