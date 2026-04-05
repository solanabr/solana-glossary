/**
 * @arquivo RelatedTerms.tsx
 * @descricao Puzzle termos relacionados — selecionar quais termos sao related
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PerTermPuzzleProps } from "../engine/puzzleTypes";
import { shuffle } from "../lib/glossary";
import PuzzleShell from "./shared/PuzzleShell";

export default function RelatedTerms({
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [answered, setAnswered] = useState(false);

  // Monta 5 candidatos: 2-3 related reais + 2-3 nao related
  const { candidates, correctIds } = useMemo(() => {
    const relIds = new Set(cur.related);
    const realRelated = pool.filter((p) => relIds.has(p.id)).slice(0, 3);
    const fakes = pool.filter((p) => !relIds.has(p.id) && p.id !== cur.id);
    const needed = 5 - realRelated.length;
    const fakePicked = shuffle(fakes, seed + currentIndex * 59).slice(
      0,
      needed,
    );
    return {
      candidates: shuffle(
        [...realRelated, ...fakePicked],
        seed + currentIndex * 83,
      ),
      correctIds: new Set(realRelated.map((r) => r.id)),
    };
  }, [cur, pool, seed, currentIndex]);

  const toggleSelect = (id: string) => {
    if (disabled || answered) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (disabled || answered || selected.size === 0) return;
    setAnswered(true);
    // Conta acertos e erros
    let correct = 0,
      wrong = 0;
    selected.forEach((id) => {
      if (correctIds.has(id)) correct++;
      else wrong++;
    });
    // Penaliza termos corretos nao selecionados
    correctIds.forEach((id) => {
      if (!selected.has(id)) wrong++;
    });
    onResult({ correct, wrong, done: true });
    setTimeout(() => {
      setAnswered(false);
      setSelected(new Set());
    }, 1200);
  };

  // Estilo do candidato
  const cardStyle = (id: string) => {
    const isSel = selected.has(id);
    const base =
      "px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-left";
    if (!answered) {
      return isSel
        ? `${base} border-purple-400 bg-purple-500/20 text-purple-200`
        : `${base} border-white/10 bg-white/5 text-gray-300 hover:border-purple-500/30`;
    }
    const isCorrectTerm = correctIds.has(id);
    if (isCorrectTerm && isSel)
      return `${base} border-emerald-400 bg-emerald-600/20 text-emerald-200`;
    if (isCorrectTerm && !isSel)
      return `${base} border-emerald-400/50 bg-emerald-500/10 text-emerald-300`;
    if (!isCorrectTerm && isSel)
      return `${base} border-red-400 bg-red-600/20 text-red-200`;
    return `${base} border-white/10 bg-white/5 text-gray-500 opacity-50`;
  };

  return (
    <PuzzleShell
      puzzleKey={currentIndex}
      titleKey="puzzle.relatedTerms"
      hintKey="puzzle.relatedTermsHint"
      theme={theme}
    >
      {/* Termo central */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6 text-center">
        <p className="text-xs text-purple-300 uppercase tracking-wider mb-2">
          {t("escape.station", {
            current: currentIndex + 1,
            total: terms.length,
          })}
        </p>
        <h3 className="text-2xl font-bold text-cyan-300">{cur.term}</h3>
        <p className="text-sm text-gray-400 mt-2">
          {t("puzzle.relatedTermsSelect")}
        </p>
      </div>

      {/* Candidatos (multi-select) */}
      <div className="space-y-3 mb-4">
        {candidates.map((c) => (
          <motion.button
            key={c.id}
            onClick={() => toggleSelect(c.id)}
            disabled={disabled || answered}
            className={cardStyle(c.id)}
            whileHover={!answered ? { scale: 1.01 } : {}}
            whileTap={!answered ? { scale: 0.98 } : {}}
          >
            <p className="font-medium text-sm">{c.term}</p>
          </motion.button>
        ))}
      </div>

      {/* Botao confirmar */}
      {!answered && (
        <motion.button
          onClick={handleConfirm}
          disabled={disabled || selected.size === 0}
          className="w-full py-4 rounded-xl bg-purple-600/40 border border-purple-500/40 text-purple-200 font-bold hover:bg-purple-600/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {t("puzzle.relatedTermsConfirm")} ({selected.size})
        </motion.button>
      )}
    </PuzzleShell>
  );
}
