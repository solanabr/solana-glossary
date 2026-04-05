/**
 * @arquivo ConnectionWeb.tsx
 * @descricao Puzzle rede de conexoes — conectar termos relacionados (batch)
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

/** Limita a 6 nodes para layout gerenciavel */
const MAX_NODES = 6;
/** Maximo de conexoes que o jogador pode tentar */
const MAX_CONNECTIONS = 8;

interface Connection {
  from: string;
  to: string;
  correct: boolean;
}

export default function ConnectionWeb({
  terms,
  seed,
  disabled,
  theme,
  onResult,
}: BatchPuzzleProps) {
  const { t } = useTranslation();

  // Seleciona termos que tem related entre si
  const nodes = useMemo(() => {
    const pool = terms.filter((t) => t.related.length > 0);
    return shuffle(pool, seed).slice(0, MAX_NODES);
  }, [terms, seed]);

  // Mapa de related validos dentro dos nodes selecionados
  const validPairs = useMemo(() => {
    const nodeIds = new Set(nodes.map((n) => n.id));
    const pairs = new Set<string>();
    nodes.forEach((n) => {
      n.related.forEach((rId) => {
        if (nodeIds.has(rId)) {
          const key = [n.id, rId].sort().join(":");
          pairs.add(key);
        }
      });
    });
    return pairs;
  }, [nodes]);

  const [selNode, setSelNode] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [done, setDone] = useState(false);

  const handleNodeClick = (id: string) => {
    if (disabled || done) return;
    if (!selNode) {
      setSelNode(id);
      return;
    }
    if (selNode === id) {
      setSelNode(null);
      return;
    }

    // Verifica se ja existe essa conexao
    const key = [selNode, id].sort().join(":");
    if (connections.some((c) => [c.from, c.to].sort().join(":") === key)) {
      setSelNode(null);
      return;
    }

    const isCorrect = validPairs.has(key);
    const newConn = { from: selNode, to: id, correct: isCorrect };
    const next = [...connections, newConn];
    setConnections(next);
    setSelNode(null);

    // Verifica se atingiu limite de conexoes
    if (
      next.length >= MAX_CONNECTIONS ||
      next.filter((c) => c.correct).length >= validPairs.size
    ) {
      setDone(true);
      const correct = next.filter((c) => c.correct).length;
      const wrong = next.filter((c) => !c.correct).length;
      onResult({ correct, wrong, done: true });
    }
  };

  const handleSubmit = () => {
    if (disabled || done) return;
    setDone(true);
    const correct = connections.filter((c) => c.correct).length;
    const wrong = connections.filter((c) => !c.correct).length;
    onResult({ correct, wrong, done: true });
  };

  // Verifica se um node esta conectado
  const isConnected = (id: string) =>
    connections.some((c) => (c.from === id || c.to === id) && c.correct);

  const nodeStyle = (node: PuzzleTerm) => {
    const base =
      "px-4 py-3 rounded-xl border-2 text-center transition-all cursor-pointer";
    if (selNode === node.id)
      return `${base} border-purple-400 bg-purple-500/20 text-purple-200 shadow-lg shadow-purple-500/20`;
    if (done && isConnected(node.id))
      return `${base} border-emerald-400 bg-emerald-500/10 text-emerald-200`;
    return `${base} border-white/10 bg-white/5 text-gray-200 hover:border-purple-500/30`;
  };

  return (
    <PuzzleShell
      puzzleKey="connection-web"
      titleKey="puzzle.connectionWeb"
      hintKey="puzzle.connectionWebHint"
      theme={theme}
    >
      {/* Contador de conexoes */}
      <div className="text-center mb-4 text-sm text-gray-400">
        {t("puzzle.connected", {
          count: connections.filter((c) => c.correct).length,
        })}
        {" — "}
        {connections.length}/{MAX_CONNECTIONS}{" "}
        {t("puzzle.connectionWebAttempts")}
      </div>

      {/* Grid de nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {nodes.map((node) => (
          <motion.button
            key={node.id}
            onClick={() => handleNodeClick(node.id)}
            disabled={disabled || done}
            className={nodeStyle(node)}
            whileHover={!done ? { scale: 1.03 } : {}}
            whileTap={!done ? { scale: 0.97 } : {}}
          >
            <p className="font-bold text-sm">{node.term}</p>
          </motion.button>
        ))}
      </div>

      {/* Log de conexoes feitas */}
      {connections.length > 0 && (
        <div className="space-y-1 mb-4 max-h-32 overflow-y-auto">
          {connections.map((c, i) => {
            const fromTerm = nodes.find((n) => n.id === c.from)?.term ?? c.from;
            const toTerm = nodes.find((n) => n.id === c.to)?.term ?? c.to;
            return (
              <div
                key={i}
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                  c.correct
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-red-500/10 text-red-300"
                }`}
              >
                <span>{c.correct ? "✓" : "✗"}</span>
                <span>
                  {fromTerm} ↔ {toTerm}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Botao submeter */}
      {!done && (
        <motion.button
          onClick={handleSubmit}
          disabled={disabled || connections.length === 0}
          className="w-full py-4 rounded-xl bg-purple-600/40 border border-purple-500/40 text-purple-200 font-bold hover:bg-purple-600/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {t("puzzle.connectionWebSubmit")}
        </motion.button>
      )}
    </PuzzleShell>
  );
}
