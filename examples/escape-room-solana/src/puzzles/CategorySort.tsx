/**
 * @arquivo CategorySort.tsx
 * @descricao Puzzle classificar categorias — arrastar termos para buckets (batch)
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { BatchPuzzleProps } from "../engine/puzzleTypes";
import type { PuzzleTerm } from "../lib/glossary";
import { shuffle } from "../lib/glossary";
import PuzzleShell from "./shared/PuzzleShell";

/** Limita a 8 termos e 3 categorias */
const MAX_TERMS = 8;
const MAX_CATS = 3;

export default function CategorySort({
  terms,
  seed,
  disabled,
  theme,
  onResult,
}: BatchPuzzleProps) {
  const { t } = useTranslation();

  // Seleciona categorias e termos do pool
  const { categories, items } = useMemo(() => {
    const catMap = new Map<string, PuzzleTerm[]>();
    terms.forEach((term) => {
      const list = catMap.get(term.category) ?? [];
      list.push(term);
      catMap.set(term.category, list);
    });
    // Pega as 3 categorias com mais termos
    const sorted = [...catMap.entries()].sort(
      (a, b) => b[1].length - a[1].length,
    );
    const topCats = sorted.slice(0, MAX_CATS).map(([cat]) => cat);
    const filtered = terms
      .filter((t) => topCats.includes(t.category))
      .slice(0, MAX_TERMS);
    return { categories: topCats, items: shuffle(filtered, seed) };
  }, [terms, seed]);

  // Estado: mapa de termId → categoria atribuida pelo jogador
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const handleAssign = (termId: string, category: string) => {
    if (disabled || checked) return;
    setAssignments((prev) => ({ ...prev, [termId]: category }));
  };

  const handleCheck = () => {
    if (disabled || checked) return;
    const res: Record<string, boolean> = {};
    let correct = 0,
      wrong = 0;
    items.forEach((item) => {
      const assigned = assignments[item.id];
      if (assigned === item.category) {
        correct++;
        res[item.id] = true;
      } else {
        wrong++;
        res[item.id] = false;
      }
    });
    setResults(res);
    setChecked(true);
    onResult({ correct, wrong, done: true });
    setTimeout(() => {
      setAssignments({});
      setChecked(false);
      setResults({});
    }, 1500);
  };

  const allAssigned = Object.keys(assignments).length === items.length;

  // Estilo do chip de termo
  const chipStyle = (id: string) => {
    const base =
      "px-3 py-2 rounded-lg border text-sm font-medium transition-all";
    if (!checked) {
      return assignments[id]
        ? `${base} bg-purple-500/20 border-purple-400/50 text-purple-200`
        : `${base} bg-white/5 border-white/10 text-gray-300`;
    }
    return results[id]
      ? `${base} bg-emerald-500/20 border-emerald-400 text-emerald-200`
      : `${base} bg-red-500/20 border-red-400 text-red-200`;
  };

  return (
    <PuzzleShell
      puzzleKey="category-sort"
      titleKey="puzzle.categorySort"
      hintKey="puzzle.categorySortHint"
      theme={theme}
    >
      {/* Buckets de categoria */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {categories.map((cat) => (
          <div
            key={cat}
            className="bg-white/5 border border-white/10 rounded-xl p-3 min-h-[100px]"
          >
            <p className="text-xs text-cyan-300 uppercase tracking-wider font-semibold mb-2 text-center">
              {cat.replace(/-/g, " ")}
            </p>
            <div className="space-y-1">
              {items
                .filter((item) => assignments[item.id] === cat)
                .map((item) => (
                  <div key={item.id} className={chipStyle(item.id)}>
                    <span className="text-xs">{item.term}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Termos nao atribuidos */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
          {t("puzzle.categorySortItems")}
        </p>
        <div className="flex flex-wrap gap-2">
          {items
            .filter((item) => !assignments[item.id])
            .map((item) => (
              <div key={item.id} className="relative group">
                <span className={chipStyle(item.id)}>{item.term}</span>
                {/* Dropdown de categorias ao clicar */}
                {!checked && (
                  <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col z-20 bg-gray-900 border border-white/20 rounded-lg overflow-hidden shadow-xl">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleAssign(item.id, cat)}
                        className="px-3 py-2 text-xs text-left text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 whitespace-nowrap transition-colors"
                      >
                        {cat.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Botao verificar */}
      {!checked && (
        <motion.button
          onClick={handleCheck}
          disabled={disabled || !allAssigned}
          className="w-full py-4 rounded-xl bg-purple-600/40 border border-purple-500/40 text-purple-200 font-bold hover:bg-purple-600/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {t("puzzle.categorySortCheck")} ({Object.keys(assignments).length}/
          {items.length})
        </motion.button>
      )}
    </PuzzleShell>
  );
}
