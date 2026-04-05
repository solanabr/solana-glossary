/**
 * @arquivo ChallengeModal.tsx
 * @descricao Modal de desafio quiz — pergunta com 4 opcoes
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { ChallengeQuestion } from "../engine/types";

interface Props {
  question: ChallengeQuestion;
  onAnswer: (correct: boolean) => void;
}

export default function ChallengeModal({ question, onAnswer }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === question.correctIndex;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setTimeout(() => onAnswer(idx === question.correctIndex), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900 border border-cyan-500/40 rounded-xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
      >
        <div className="text-center mb-4">
          <span className="text-3xl">🧩</span>
          <h3 className="text-sm font-bold text-cyan-300 mt-2">
            {t("vida.challengeTitle")}
          </h3>
        </div>
        <p className="text-sm text-gray-300 text-center mb-5 leading-relaxed max-h-32 overflow-y-auto">
          {question.definition}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {question.options.map((opt, idx) => {
            let style = "border-white/10 hover:border-white/30 text-gray-300";
            if (answered && idx === question.correctIndex)
              style = "border-green-500 bg-green-500/10 text-green-300";
            else if (answered && idx === selected)
              style = "border-red-500 bg-red-500/10 text-red-300";
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${style}`}
              >
                <span className="text-gray-500 mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center text-sm font-bold mt-4 ${isCorrect ? "text-green-400" : "text-red-400"}`}
          >
            {isCorrect ? t("vida.correct") : t("vida.wrong")}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
