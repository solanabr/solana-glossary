"use client";

import { useState, useEffect, useRef } from "react";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";
import DifficultySelector from "@/components/difficulty-selector";
import type { GlossaryTerm } from "@/lib/glossary-client";
import { CATEGORY_LABELS } from "@/lib/glossary-client";
import { useProgress } from "@/lib/progress-context";
import type { Difficulty } from "@/lib/difficulty";
import { BLITZ_CONFIG } from "@/lib/difficulty";
import GameResultsOverlay from "@/components/game-results-overlay";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const CATEGORY_COLORS: Record<string, string> = {
  "core-protocol": "#9945FF",
  defi: "#14F195",
  "solana-ecosystem": "#03E1FF",
  "blockchain-general": "#DC1FFF",
  security: "#FF4D4D",
  "dev-tools": "#00FFA3",
  network: "#FFB800",
  web3: "#ff6b9d",
  "token-ecosystem": "#9945FF",
  infrastructure: "#03E1FF",
  "programming-model": "#14F195",
  "programming-fundamentals": "#DC1FFF",
  "ai-ml": "#ff6b9d",
  "zk-compression": "#FFB800",
};

export default function CategoryBlitz() {
  const { recordGameResult, progress } = useProgress();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [queue, setQueue] = useState<GlossaryTerm[]>([]);
  const [current, setCurrent] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [flash, setFlash] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [previousBest, setPreviousBest] = useState<number | undefined>(undefined);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const config = BLITZ_CONFIG[difficulty];

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/games/terms?count=80`)
      .then((r) => r.json())
      .then(setTerms);
  }, []);

  const generateOptions = (q: GlossaryTerm[], idx: number, optCount: number) => {
    if (idx >= q.length) return;
    const correct = q[idx].category;
    const allCats = Object.keys(CATEGORY_LABELS);
    const others = shuffleArray(allCats.filter((c) => c !== correct)).slice(0, optCount - 1);
    setOptions(shuffleArray([correct, ...others]));
  };

  const startGame = () => {
    setPreviousBest(progress.bestScores["blitz"]);
    const shuffled = shuffleArray(terms);
    setQueue(shuffled);
    setCurrent(0);
    setScore(0);
    setMistakes(0);
    setTimeLeft(config.timer);
    setShowResults(false);
    setGameState("playing");
    generateOptions(shuffled, 0, config.optionCount);
  };

  useEffect(() => {
    if (gameState !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setGameState("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  const handleAnswer = (cat: string) => {
    if (gameState !== "playing") return;
    const correct = queue[current].category === cat;

    if (correct) {
      setScore((s) => s + 1);
      setFlash("green");
    } else {
      setMistakes((m) => m + 1);
      setFlash("red");
    }

    setTimeout(() => setFlash(null), 300);

    const next = current + 1;
    if (next >= queue.length) {
      setGameState("finished");
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setCurrent(next);
      generateOptions(queue, next, config.optionCount);
    }
  };

  useEffect(() => {
    if (gameState === "finished" && score > 0) {
      recordGameResult("blitz", score);
    }
    if (gameState === "finished") {
      const t = setTimeout(() => setShowResults(true), 300);
      return () => clearTimeout(t);
    }
  }, [gameState, score, recordGameResult]);

  const timerColor = timeLeft > config.timer * 0.44 ? "var(--sol-green)" : timeLeft > config.timer * 0.22 ? "#FFB800" : "#FF4D4D";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-0)" }}>
      <CyberNav backTo={{ href: "/games", label: "Games" }} />

      <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12 w-full">
        {gameState === "idle" && (
          <div className="text-center">
            <div className="text-6xl mb-6">&#127991;&#65039;</div>
            <h1 className="text-3xl font-bold mb-3">
              <span className="gradient-text">Category Blitz</span>
            </h1>
            <p className="text-text-secondary mb-2">
              A term appears. You pick the right category. {config.timer} seconds.
            </p>
            <p className="text-text-muted text-sm mb-6">Fast. Accurate. No mercy.</p>

            <DifficultySelector value={difficulty} onChange={setDifficulty} />

            <button onClick={startGame} className="neon-btn text-base py-3 px-10" disabled={terms.length < 4}>
              {terms.length < 4 ? "Loading..." : "Start"}
            </button>
          </div>
        )}

        {gameState === "playing" && queue[current] && (
          <div>
            {/* HUD */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-sol-green font-bold text-xl">{score}</span>
                <span className="text-text-muted text-sm ml-1">correct</span>
              </div>
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-title)", color: timerColor, fontSize: "20px" }}
              >
                {timeLeft}s
              </div>
              <div>
                <span className="text-text-muted text-sm mr-1">errors</span>
                <span className="font-bold text-xl" style={{ color: "#FF4D4D" }}>{mistakes}</span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="w-full h-1 rounded-full bg-surface-2 mb-8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / config.timer) * 100}%`, background: timerColor }}
              />
            </div>

            {/* Term card */}
            <div
              className="glow-card p-6 mb-8 text-center transition-all duration-200"
              style={{
                boxShadow: flash === "green"
                  ? "0 0 30px rgba(20,241,149,0.3)"
                  : flash === "red"
                    ? "0 0 30px rgba(255,77,77,0.3)"
                    : undefined,
              }}
            >
              <h2 className="text-xl font-bold text-text-primary mb-2">
                {queue[current].term}
              </h2>
              <p className="text-text-secondary text-xs leading-relaxed max-w-md mx-auto">
                {queue[current].definition.slice(0, config.defMaxChars)}
                {queue[current].definition.length > config.defMaxChars ? "..." : ""}
              </p>
            </div>

            {/* Category options */}
            <div className={`grid ${config.optionCount <= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"} gap-3`}>
              {options.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleAnswer(cat)}
                  className="p-4 text-sm font-medium transition-all duration-200 hover:translate-y-[-2px] text-center"
                  style={{
                    background: `${CATEGORY_COLORS[cat] || "#9945FF"}10`,
                    border: `1px solid ${CATEGORY_COLORS[cat] || "#9945FF"}30`,
                    color: CATEGORY_COLORS[cat] || "#9945FF",
                    clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
                  }}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <GameResultsOverlay
          gameId="blitz"
          score={score}
          previousBest={previousBest}
          isOpen={showResults}
          onPlayAgain={() => { setShowResults(false); setGameState("idle"); }}
          mistakes={mistakes}
          accuracy={score + mistakes > 0 ? Math.round((score / (score + mistakes)) * 100) : 0}
        />
      </div>

      <CyberFooter />
    </div>
  );
}
