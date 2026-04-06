"use client";

import { useState, useEffect, useCallback } from "react";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";
import DifficultySelector from "@/components/difficulty-selector";
import type { GlossaryTerm } from "@/lib/glossary-client";
import { useProgress } from "@/lib/progress-context";
import type { Difficulty } from "@/lib/difficulty";
import { CONNECTIONS_CONFIG } from "@/lib/difficulty";
import GameResultsOverlay from "@/components/game-results-overlay";

interface Group {
  category: string;
  label: string;
  color: string;
  terms: GlossaryTerm[];
}

const GROUP_COLORS = ["#9945FF", "#14F195", "#03E1FF", "#DC1FFF", "#FFB800"];
const GROUP_BORDERS = [
  "neon-border-purple",
  "neon-border-green",
  "neon-border-blue",
  "neon-border-magenta",
  "neon-border-yellow",
];

function buildGroups(terms: GlossaryTerm[], groupCount: number): Group[] {
  const byCat: Record<string, GlossaryTerm[]> = {};
  for (const t of terms) {
    if (!byCat[t.category]) byCat[t.category] = [];
    byCat[t.category].push(t);
  }

  const validCats = Object.entries(byCat)
    .filter(([, arr]) => arr.length >= 4)
    .sort(() => Math.random() - 0.5)
    .slice(0, groupCount);

  const categoryLabels: Record<string, string> = {
    "ai-ml": "AI & ML",
    "blockchain-general": "Blockchain",
    "core-protocol": "Core Protocol",
    defi: "DeFi",
    "dev-tools": "Dev Tools",
    infrastructure: "Infrastructure",
    network: "Network",
    "programming-fundamentals": "Programming",
    "programming-model": "Solana Programming",
    security: "Security",
    "solana-ecosystem": "Ecosystem",
    "token-ecosystem": "Tokens",
    web3: "Web3",
    "zk-compression": "ZK & Compression",
  };

  return validCats.map(([cat, arr], i) => ({
    category: cat,
    label: categoryLabels[cat] || cat,
    color: GROUP_COLORS[i],
    terms: arr.sort(() => Math.random() - 0.5).slice(0, 4),
  }));
}

type GameState = "idle" | "playing" | "finished";

export default function ConnectionsGame() {
  const { recordGameResult, progress } = useProgress();
  const [groups, setGroups] = useState<Group[]>([]);
  const [board, setBoard] = useState<GlossaryTerm[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [solvedGroups, setSolvedGroups] = useState<Group[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [shakeWrong, setShakeWrong] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [previousBest, setPreviousBest] = useState<number | undefined>(undefined);
  const [showResults, setShowResults] = useState(false);

  const config = CONNECTIONS_CONFIG[difficulty];

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/games/terms?count=80`)
      .then((r) => r.json())
      .then(setTerms);
  }, []);

  const startGame = () => {
    if (terms.length < config.groupCount * 4) return;
    setPreviousBest(progress.bestScores["connections"]);
    const g = buildGroups(terms, config.groupCount);
    setGroups(g);
    setBoard(g.flatMap((gr) => gr.terms).sort(() => Math.random() - 0.5));
    setSelected(new Set());
    setSolvedGroups([]);
    setMistakes(0);
    setShowResults(false);
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState === "finished") {
      recordGameResult("connections", solvedGroups.length);
      const t = setTimeout(() => setShowResults(true), 300);
      return () => clearTimeout(t);
    }
  }, [gameState, solvedGroups.length, recordGameResult]);

  const toggleSelect = (termId: string) => {
    if (gameState !== "playing") return;
    const next = new Set(selected);
    if (next.has(termId)) {
      next.delete(termId);
    } else if (next.size < 4) {
      next.add(termId);
    }
    setSelected(next);
  };

  const checkSolved = useCallback(
    (newSolved: Group[]) => {
      if (newSolved.length === config.groupCount) {
        setGameState("finished");
      } else if (mistakes >= config.maxMistakes) {
        setGameState("finished");
      }
    },
    [mistakes, config]
  );

  const submitGuess = () => {
    if (selected.size !== 4) return;

    const selectedIds = Array.from(selected);

    const matchingGroup = groups.find((g) => {
      const groupIds = g.terms.map((t) => t.id);
      return selectedIds.every((id) => groupIds.includes(id));
    });

    if (matchingGroup && !solvedGroups.find((g) => g.category === matchingGroup.category)) {
      const newSolved = [...solvedGroups, matchingGroup];
      setSolvedGroups(newSolved);
      setBoard((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
      setSelected(new Set());
      checkSolved(newSolved);
    } else {
      setMistakes((m) => {
        const newM = m + 1;
        if (newM >= config.maxMistakes) setGameState("finished");
        return newM;
      });
      setShakeWrong(true);
      setTimeout(() => {
        setShakeWrong(false);
        setSelected(new Set());
      }, 600);
    }
  };

  const newGame = () => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/games/terms?count=80`)
      .then((r) => r.json())
      .then((freshTerms: GlossaryTerm[]) => {
        setTerms(freshTerms);
        setGameState("idle");
      });
  };

  const totalTerms = config.groupCount * 4;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-0)" }}>
      <CyberNav backTo={{ href: "/games", label: "Games" }} />

      <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12 w-full">
        {/* IDLE */}
        {gameState === "idle" && (
          <div className="text-center">
            <div className="text-5xl mb-4">&#128279;</div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Connections</span>
            </h1>
            <p className="text-text-muted text-sm mb-6">
              Group {totalTerms} terms into {config.groupCount} groups of 4 by category.
            </p>

            <DifficultySelector value={difficulty} onChange={setDifficulty} />

            <button
              onClick={startGame}
              className="neon-btn text-base py-3 px-10"
              disabled={terms.length < config.groupCount * 4}
            >
              {terms.length < config.groupCount * 4 ? "Loading terms..." : "Start"}
            </button>
          </div>
        )}

        {/* PLAYING */}
        {gameState === "playing" && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">&#128279;</div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="gradient-text">Connections</span>
              </h1>
              <p className="text-text-muted text-sm">
                Group {totalTerms} terms into {config.groupCount} groups of 4 by category.
              </p>
            </div>

            {/* Mistakes */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-text-muted text-xs">Mistakes:</span>
              {Array.from({ length: config.maxMistakes }).map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3"
                  style={{
                    background: i < mistakes ? "#FF4D4D" : "var(--surface-3)",
                    boxShadow: i < mistakes ? "0 0 8px rgba(255,77,77,0.4)" : "none",
                    clipPath: "polygon(2px 0%, calc(100% - 2px) 0%, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0% calc(100% - 2px), 0% 2px)",
                  }}
                />
              ))}
            </div>

            {/* Solved groups */}
            {solvedGroups.map((g) => {
              const gi = groups.indexOf(g);
              return (
                <div
                  key={g.category}
                  className={`${GROUP_BORDERS[gi]} p-4 mb-3 text-center`}
                  style={{ background: `${g.color}10`, clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)" }}
                >
                  <div className="font-bold text-sm mb-1" style={{ color: g.color }}>
                    {g.label}
                  </div>
                  <div className="text-text-secondary text-xs">
                    {g.terms.map((t) => t.term).join(" \u00B7 ")}
                  </div>
                </div>
              );
            })}

            {/* Board */}
            {board.length > 0 && (
              <>
                <div
                  className={`grid grid-cols-4 gap-2 mb-6 ${shakeWrong ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
                >
                  {board.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleSelect(t.id)}
                      className="p-3 text-center text-xs font-medium transition-all duration-200"
                      style={{
                        background: selected.has(t.id)
                          ? "rgba(153,69,255,0.2)"
                          : "var(--surface-1)",
                        border: `1px solid ${selected.has(t.id) ? "var(--sol-purple)" : "var(--border)"}`,
                        color: selected.has(t.id)
                          ? "var(--sol-purple)"
                          : "var(--text-primary)",
                        transform: selected.has(t.id) ? "scale(0.96)" : "scale(1)",
                        clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
                      }}
                    >
                      {t.term.length > 20
                        ? t.term.slice(0, 18) + "\u2026"
                        : t.term}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setSelected(new Set())}
                    className="px-6 py-2 border border-border text-text-secondary text-sm hover:text-text-primary transition-colors"
                    style={{
                      clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
                    }}
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={submitGuess}
                    disabled={selected.size !== 4}
                    className="neon-btn text-sm py-2 px-8 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Submit ({selected.size}/4)
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <GameResultsOverlay
          gameId="connections"
          score={solvedGroups.length}
          previousBest={previousBest}
          isOpen={showResults}
          onPlayAgain={() => { setShowResults(false); newGame(); }}
          solvedGroups={solvedGroups.length}
          totalGroups={config.groupCount}
          mistakes={mistakes}
          unsolvedGroups={groups
            .filter((g) => !solvedGroups.find((s) => s.category === g.category))
            .map((g) => ({ label: g.label, terms: g.terms.map((t) => t.term) }))}
        />
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-8px);
          }
          75% {
            transform: translateX(8px);
          }
        }
      `}</style>

      <CyberFooter />
    </div>
  );
}
