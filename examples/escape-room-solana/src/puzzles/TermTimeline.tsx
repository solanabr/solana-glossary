/**
 * @arquivo TermTimeline.tsx
 * @descricao Puzzle linha do tempo — ordenar termos por dependencia conceitual (batch)
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

/** Limita a 6 termos para reordenacao gerenciavel */
const MAX_ITEMS = 6;

/**
 * Ordena termos por dependencia usando campo related.
 * Termos que sao referenciados por mais outros vem primeiro (fundamentais).
 */
function computeOrder(items: PuzzleTerm[]): PuzzleTerm[] {
  const ids = new Set(items.map((i) => i.id));
  const refCount = new Map<string, number>();
  items.forEach((i) => refCount.set(i.id, 0));
  // Conta quantas vezes cada termo e referenciado por outros
  items.forEach((i) => {
    i.related.forEach((rId) => {
      if (ids.has(rId)) refCount.set(rId, (refCount.get(rId) ?? 0) + 1);
    });
  });
  return [...items].sort(
    (a, b) => (refCount.get(b.id) ?? 0) - (refCount.get(a.id) ?? 0),
  );
}

/** Conta inversoes entre ordem do jogador e ordem correta */
function countInversions(player: string[], correct: string[]): number {
  const posMap = new Map<string, number>();
  correct.forEach((id, i) => posMap.set(id, i));
  let inv = 0;
  for (let i = 0; i < player.length; i++) {
    for (let j = i + 1; j < player.length; j++) {
      const pi = posMap.get(player[i]) ?? 0;
      const pj = posMap.get(player[j]) ?? 0;
      if (pi > pj) inv++;
    }
  }
  return inv;
}

export default function TermTimeline({
  terms,
  seed,
  disabled,
  theme,
  onResult,
}: BatchPuzzleProps) {
  const { t } = useTranslation();

  // Termos selecionados e ordem correta
  const { items, correctOrder } = useMemo(() => {
    const slice = terms.filter((t) => t.related.length > 0).slice(0, MAX_ITEMS);
    const ordered = computeOrder(slice);
    return {
      items: shuffle(slice, seed),
      correctOrder: ordered.map((o) => o.id),
    };
  }, [terms, seed]);

  const [order, setOrder] = useState<PuzzleTerm[]>(items);
  const [checked, setChecked] = useState(false);
  const [positions, setPositions] = useState<Record<string, boolean>>({});

  // Move item uma posicao para cima ou para baixo
  const moveItem = (idx: number, dir: -1 | 1) => {
    if (disabled || checked) return;
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
  };

  const handleCheck = () => {
    if (disabled || checked) return;
    setChecked(true);
    const playerOrder = order.map((o) => o.id);
    const inversions = countInversions(playerOrder, correctOrder);
    const correct = Math.max(0, order.length - inversions);
    const wrong = inversions;

    // Marca posicoes corretas
    const pos: Record<string, boolean> = {};
    order.forEach((o, i) => {
      pos[o.id] = o.id === correctOrder[i];
    });
    setPositions(pos);

    onResult({ correct, wrong, done: true });
    setTimeout(() => {
      setChecked(false);
      setOrder(items);
      setPositions({});
    }, 2000);
  };

  const itemStyle = (id: string) => {
    const base =
      "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all";
    if (!checked) return `${base} border-white/10 bg-white/5 text-gray-200`;
    return positions[id]
      ? `${base} border-emerald-400 bg-emerald-500/10 text-emerald-200`
      : `${base} border-red-400 bg-red-500/10 text-red-200`;
  };

  return (
    <PuzzleShell
      puzzleKey="term-timeline"
      titleKey="puzzle.termTimeline"
      hintKey="puzzle.termTimelineHint"
      theme={theme}
    >
      {/* Instrucao */}
      <div className="text-center mb-4 text-sm text-gray-400">
        {t("puzzle.termTimelineInstruction")}
      </div>

      {/* Lista reordenavel */}
      <div className="space-y-2 mb-6">
        {order.map((item, i) => (
          <motion.div
            key={item.id}
            layout
            transition={{ duration: 0.25 }}
            className={itemStyle(item.id)}
          >
            {/* Numero da posicao */}
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-sm font-bold shrink-0">
              {i + 1}
            </span>

            {/* Termo */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.term}</p>
              <p className="text-xs text-gray-400 truncate">
                {item.definition.slice(0, 60)}...
              </p>
            </div>

            {/* Botoes mover */}
            {!checked && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveItem(i, -1)}
                  disabled={disabled || i === 0}
                  className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all disabled:opacity-20"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={disabled || i === order.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all disabled:opacity-20"
                >
                  ▼
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Botao verificar */}
      {!checked && (
        <motion.button
          onClick={handleCheck}
          disabled={disabled}
          className="w-full py-4 rounded-xl bg-purple-600/40 border border-purple-500/40 text-purple-200 font-bold hover:bg-purple-600/60 transition-all disabled:opacity-30"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {t("puzzle.termTimelineSubmit")}
        </motion.button>
      )}
    </PuzzleShell>
  );
}
