"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";
import DifficultySelector from "@/components/difficulty-selector";
import type { GlossaryTerm } from "@/lib/glossary-client";
import { CATEGORY_LABELS } from "@/lib/glossary-client";
import { useProgress } from "@/lib/progress-context";
import type { Difficulty } from "@/lib/difficulty";
import { SPEEDRUN_CONFIG } from "@/lib/difficulty";
import GameResultsOverlay from "@/components/game-results-overlay";

type GameState = "idle" | "playing" | "finished";

interface Question {
  term: GlossaryTerm;
  options: string[];
  correctIndex: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateQuestions(terms: GlossaryTerm[], count: number, distractorCount: number): Question[] {
  const shuffled = shuffleArray(terms);
  const questions: Question[] = [];

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const correct = shuffled[i];
    const others = shuffleArray(
      terms.filter((t) => t.id !== correct.id)
    ).slice(0, distractorCount);

    const options = shuffleArray([correct, ...others].map((t) => t.term));
    const correctIndex = options.indexOf(correct.term);

    questions.push({ term: correct, options, correctIndex });
  }

  return questions;
}

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

export default function SpeedRunGame() {
  const { recordGameResult, progress } = useProgress();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [results, setResults] = useState<
    { term: string; correct: boolean; answer: string }[]
  >([]);
  const [previousBest, setPreviousBest] = useState<number | undefined>(undefined);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const config = SPEEDRUN_CONFIG[difficulty];

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/games/terms?count=60`)
      .then((r) => r.json())
      .then(setTerms);
  }, []);

  const startGame = useCallback(() => {
    if (terms.length < config.optionCount) return;
    setPreviousBest(progress.bestScores["speedrun"]);
    const qs = generateQuestions(terms, 50, config.optionCount - 1);
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setTimeLeft(config.timer);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    setShowResults(false);
    setGameState("playing");
  }, [terms, config, progress.bestScores]);

  // Timer
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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;

    const correct = index === questions[currentQ].correctIndex;
    setSelectedAnswer(index);
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    setResults((r) => [
      ...r,
      {
        term: questions[currentQ].term.term,
        correct,
        answer: questions[currentQ].options[index],
      },
    ]);

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        setGameState("finished");
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setCurrentQ((q) => q + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
    }, 600);
  };

  useEffect(() => {
    if (gameState === "finished" && score > 0) {
      recordGameResult("speedrun", score);
    }
    if (gameState === "finished") {
      const t = setTimeout(() => setShowResults(true), 300);
      return () => clearTimeout(t);
    }
  }, [gameState, score, recordGameResult]);

  const timerColor =
    timeLeft > config.timer * 0.5
      ? "var(--sol-green)"
      : timeLeft > config.timer * 0.17
        ? "#FFB800"
        : "#FF4D4D";

  const getDefinition = (term: GlossaryTerm) => {
    if (config.defMaxChars === null) return term.definition;
    if (term.definition.length <= config.defMaxChars) return term.definition;
    return term.definition.slice(0, config.defMaxChars) + "...";
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-0)" }}>
      <CyberNav backTo={{ href: "/games", label: "Games" }} />

      <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12 w-full">
        {/* IDLE */}
        {gameState === "idle" && (
          <div className="text-center">
            <div className="text-6xl mb-6">&#9889;</div>
            <h1 className="text-3xl font-bold mb-3">
              <span className="gradient-text">Speed Run</span>
            </h1>
            <p className="text-text-secondary mb-2">
              {config.timer} seconds. A definition appears. Select the correct term from {config.optionCount} options.
            </p>
            <p className="text-text-muted text-sm mb-6">How many can you get?</p>

            <DifficultySelector value={difficulty} onChange={setDifficulty} />

            <button
              onClick={startGame}
              className="neon-btn text-base py-3 px-10"
              disabled={terms.length < config.optionCount}
            >
              {terms.length < config.optionCount ? "Loading terms..." : "Start"}
            </button>
          </div>
        )}

        {/* PLAYING */}
        {gameState === "playing" && questions[currentQ] && (
          <div>
            {/* HUD */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Score</div>
                  <div className="text-2xl font-bold text-sol-green stat-glow">{score}</div>
                </div>
                {streak > 1 && (
                  <div className="pixel-badge border-sol-magenta text-sol-magenta animate-pulse-glow">
                    {streak}x STREAK
                  </div>
                )}
              </div>

              {/* Timer */}
              <div className="text-center">
                <div
                  className="text-4xl font-bold stat-glow"
                  style={{
                    fontFamily: "var(--font-title)",
                    color: timerColor,
                    fontSize: "28px",
                  }}
                >
                  {timeLeft}
                </div>
                <div className="text-text-muted text-xs">seconds</div>
              </div>

              <div>
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Question</div>
                <div className="text-text-secondary text-lg font-semibold">{currentQ + 1}</div>
              </div>
            </div>

            {/* Timer bar */}
            <div className="w-full h-1 rounded-full bg-surface-2 mb-8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${(timeLeft / config.timer) * 100}%`,
                  background: timerColor,
                  boxShadow: `0 0 10px ${timerColor}`,
                }}
              />
            </div>

            {/* Definition */}
            <div className="glow-card p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="category-pill text-[10px]"
                  style={{
                    borderColor: "var(--sol-purple)",
                    color: "var(--sol-purple)",
                  }}
                >
                  {CATEGORY_LABELS[questions[currentQ].term.category] ||
                    questions[currentQ].term.category}
                </span>
                <span className="text-text-muted text-xs">What term is this?</span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed">
                {getDefinition(questions[currentQ].term)}
              </p>
            </div>

            {/* Options */}
            <div className={`grid ${config.optionCount <= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"} gap-3`}>
              {questions[currentQ].options.map((option, i) => {
                let borderColor = "var(--border)";
                let bgColor = "transparent";

                if (selectedAnswer !== null) {
                  if (i === questions[currentQ].correctIndex) {
                    borderColor = "var(--sol-green)";
                    bgColor = "rgba(20,241,149,0.1)";
                  } else if (i === selectedAnswer && !isCorrect) {
                    borderColor = "#FF4D4D";
                    bgColor = "rgba(255,77,77,0.1)";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={selectedAnswer !== null}
                    className="p-4 text-left text-sm font-medium transition-all duration-200 hover:translate-y-[-2px] disabled:hover:translate-y-0"
                    style={{
                      background: bgColor || "var(--surface-1)",
                      border: `1px solid ${borderColor}`,
                      color:
                        selectedAnswer !== null &&
                        i === questions[currentQ].correctIndex
                          ? "var(--sol-green)"
                          : "var(--text-primary)",
                      clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
                    }}
                  >
                    <span className="text-text-muted mr-2" style={{ fontFamily: "var(--font-title)", fontSize: "8px" }}>
                      {OPTION_LABELS[i]}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FINISHED — overlay handles the results screen */}
        <GameResultsOverlay
          gameId="speedrun"
          score={score}
          previousBest={previousBest}
          isOpen={showResults}
          onPlayAgain={() => { setShowResults(false); setGameState("idle"); }}
          totalQuestions={results.length}
          bestStreak={bestStreak}
        />
      </div>

      <CyberFooter />
    </div>
  );
}
