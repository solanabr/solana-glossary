/**
 * @arquivo DefinitionBuilder.tsx
 * @descricao Puzzle montar definicao — trechos removidos, tocar chips na ordem
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PerTermPuzzleProps } from "../engine/puzzleTypes";
import { extractKeyPhrases } from "./shared/textUtils";
import { shuffle } from "../lib/glossary";
import PuzzleShell from "./shared/PuzzleShell";

/** Marcador para lacunas na definicao */
const BLANK = "___BLANK___";

export default function DefinitionBuilder({
  terms,
  seed,
  disabled,
  theme,
  currentIndex,
  onResult,
}: PerTermPuzzleProps) {
  const { t } = useTranslation();
  const cur = terms[currentIndex];

  // Extrai trechos-chave e cria definicao com lacunas
  const { gapped, chips, correctOrder } = useMemo(() => {
    const phrases = extractKeyPhrases(cur.definition, 3);
    let def = cur.definition;
    const order: string[] = [];
    phrases.forEach((p) => {
      if (def.includes(p)) {
        def = def.replace(p, BLANK);
        order.push(p);
      }
    });
    return {
      gapped: def,
      chips: shuffle([...order], seed + currentIndex * 67),
      correctOrder: order,
    };
  }, [cur, seed, currentIndex]);

  const [placed, setPlaced] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  // Chips disponiveis (nao colocados ainda)
  const available = chips.filter((c) => !placed.includes(c));

  // Renderiza definicao com lacunas preenchidas ou vazias
  const parts = gapped.split(BLANK);

  const handleChipClick = (chip: string) => {
    if (disabled || answered) return;
    const next = [...placed, chip];
    setPlaced(next);

    // Se preencheu todas as lacunas, verifica
    if (next.length === correctOrder.length) {
      const res = next.map((c, i) => c === correctOrder[i]);
      setResults(res);
      setAnswered(true);
      const correct = res.filter(Boolean).length;
      const wrong = res.length - correct;
      onResult({ correct, wrong, done: true });
      setTimeout(() => {
        setPlaced([]);
        setAnswered(false);
        setResults([]);
      }, 1500);
    }
  };

  // Remove o ultimo chip colocado
  const handleUndo = () => {
    if (disabled || answered || placed.length === 0) return;
    setPlaced((prev) => prev.slice(0, -1));
  };

  return (
    <PuzzleShell
      puzzleKey={currentIndex}
      titleKey="puzzle.definitionBuilder"
      hintKey="puzzle.definitionBuilderHint"
      theme={theme}
    >
      {/* Termo sendo definido */}
      <div className="text-center mb-4">
        <p className="text-xs text-purple-300 uppercase tracking-wider">
          {t("escape.station", {
            current: currentIndex + 1,
            total: terms.length,
          })}
        </p>
        <h3 className="text-xl font-bold text-cyan-300 mt-1">{cur.term}</h3>
      </div>

      {/* Definicao com lacunas */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-5">
        <p className="text-base text-gray-100 leading-relaxed">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <span
                  className={`inline-block min-w-[80px] px-2 py-1 mx-1 rounded-lg border-2 border-dashed text-sm font-medium text-center ${
                    placed[i]
                      ? answered
                        ? results[i]
                          ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                          : "border-red-400 bg-red-500/20 text-red-200"
                        : "border-purple-400 bg-purple-500/20 text-purple-200"
                      : "border-white/20 bg-white/5 text-gray-500"
                  }`}
                >
                  {placed[i] ?? `[${i + 1}]`}
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Chips disponiveis */}
      <div className="flex flex-wrap gap-2 mb-4">
        {available.map((chip) => (
          <motion.button
            key={chip}
            onClick={() => handleChipClick(chip)}
            disabled={disabled || answered}
            className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 text-sm font-medium hover:bg-purple-500/30 transition-all disabled:opacity-30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {chip}
          </motion.button>
        ))}
      </div>

      {/* Botao desfazer */}
      {placed.length > 0 && !answered && (
        <button
          onClick={handleUndo}
          disabled={disabled}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          ← {t("puzzle.definitionBuilderUndo")}
        </button>
      )}
    </PuzzleShell>
  );
}
