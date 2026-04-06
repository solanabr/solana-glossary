"use client";

import { useState, useEffect } from "react";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";
import DifficultySelector from "@/components/difficulty-selector";
import type { GlossaryTerm } from "@/lib/glossary-client";
import { CATEGORY_LABELS } from "@/lib/glossary-client";
import { useProgress } from "@/lib/progress-context";
import type { Difficulty } from "@/lib/difficulty";
import { DAILY_CONFIG } from "@/lib/difficulty";
import GameResultsOverlay from "@/components/game-results-overlay";

type CensorMode = "light" | "normal" | "aggressive";

function censorDefinition(definition: string, term: GlossaryTerm, mode: CensorMode): string {
  let censored = definition;

  if (mode === "light") {
    // Only censor the exact term name
    const regex = new RegExp(`\\b${term.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    censored = censored.replace(regex, (m) => "\u2588".repeat(m.length));
    return censored;
  }

  // Normal: censor individual words from the term name
  const termWords = term.term.split(/[\s\-()]+/).filter((w) => w.length > 2);
  for (const word of termWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    censored = censored.replace(regex, "\u2588".repeat(word.length));
  }

  if (mode === "aggressive" && term.aliases) {
    // Also censor alias words
    for (const alias of term.aliases) {
      const aliasWords = alias.split(/[\s\-()]+/).filter((w) => w.length > 2);
      for (const word of aliasWords) {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        censored = censored.replace(regex, "\u2588".repeat(word.length));
      }
    }
  }

  return censored;
}

function getDailyIndex(totalTerms: number): number {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return seed % totalTerms;
}

export default function WTFDaily() {
  const { recordGameResult } = useProgress();
  const [allTerms, setAllTerms] = useState<GlossaryTerm[]>([]);
  const [dailyTerm, setDailyTerm] = useState<GlossaryTerm | null>(null);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [suggestions, setSuggestions] = useState<GlossaryTerm[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [gameState, setGameState] = useState<"idle" | "playing">("idle");
  const [showResults, setShowResults] = useState(false);

  const config = DAILY_CONFIG[difficulty];

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/games/terms?count=100`)
      .then((r) => r.json())
      .then((terms: GlossaryTerm[]) => {
        setAllTerms(terms);
        const idx = getDailyIndex(terms.length);
        setDailyTerm(terms[idx]);
      });
  }, []);

  useEffect(() => {
    if (solved) {
      const today = new Date();
      const dailyDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      recordGameResult("daily", 1, dailyDate);
      const t = setTimeout(() => setShowResults(true), 300);
      return () => clearTimeout(t);
    }
  }, [solved, recordGameResult]);

  const startGame = () => {
    setGameState("playing");
    setGuess("");
    setAttempts([]);
    setSolved(false);
    setHintLevel(0);
    setSuggestions([]);
  };

  const handleGuess = () => {
    if (!guess.trim() || !dailyTerm || solved) return;

    const normalized = guess.trim().toLowerCase();
    const termNormalized = dailyTerm.term.toLowerCase();
    const idNormalized = dailyTerm.id.toLowerCase();
    const aliasMatch = dailyTerm.aliases?.some(
      (a) => a.toLowerCase() === normalized
    );

    setAttempts((prev) => [...prev, guess.trim()]);

    if (
      normalized === termNormalized ||
      normalized === idNormalized ||
      aliasMatch
    ) {
      setSolved(true);
    }

    setGuess("");
    setSuggestions([]);
  };

  const handleInputChange = (value: string) => {
    setGuess(value);
    if (value.length >= config.autocompleteMinChars) {
      const matches = allTerms
        .filter(
          (t) =>
            t.term.toLowerCase().includes(value.toLowerCase()) ||
            t.id.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const revealHint = () => {
    setHintLevel((h) => Math.min(h + 1, config.maxHints));
  };

  const getHints = () => {
    if (!dailyTerm) return [];
    const hints: string[] = [];
    if (hintLevel >= 1)
      hints.push(`Category: ${CATEGORY_LABELS[dailyTerm.category] || dailyTerm.category}`);
    if (hintLevel >= 2)
      hints.push(`Starts with: ${dailyTerm.term.charAt(0).toUpperCase()}`);
    if (hintLevel >= 3 && dailyTerm.related)
      hints.push(`Related to: ${dailyTerm.related.slice(0, 2).join(", ")}`);
    if (hintLevel >= 4)
      hints.push(`First letters: ${dailyTerm.term.slice(0, 3).toUpperCase()}...`);
    return hints;
  };

  if (!dailyTerm) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-0)" }}>
        <div className="text-text-muted">Loading today&apos;s challenge...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-0)" }}>
      <CyberNav backTo={{ href: "/games", label: "Games" }} />

      <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12 w-full">
        {/* IDLE */}
        {gameState === "idle" && (
          <div className="text-center">
            <div className="text-5xl mb-4">&#10067;</div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">WTF Daily</span>
            </h1>
            <p className="text-text-muted text-sm mb-6">
              Read the censored definition. Guess the term.
            </p>

            <DifficultySelector value={difficulty} onChange={setDifficulty} />

            <button
              onClick={startGame}
              className="neon-btn text-base py-3 px-10"
            >
              Start
            </button>
          </div>
        )}

        {/* PLAYING */}
        {gameState === "playing" && (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">&#10067;</div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="gradient-text">WTF Daily</span>
              </h1>
              <p className="text-text-muted text-sm">
                Read the censored definition. Guess the term.
              </p>
            </div>

            {/* Censored definition */}
            <div className="glow-card p-6 mb-6">
              <div className="text-text-muted text-xs uppercase tracking-wider mb-3">
                Today&apos;s definition
              </div>
              <p className="text-text-primary text-sm leading-relaxed" style={{ fontFamily: "var(--font-mono)" }}>
                {censorDefinition(dailyTerm.definition, dailyTerm, config.censorMode)}
              </p>
            </div>

            {/* Hints */}
            {getHints().length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {getHints().map((hint, i) => (
                  <span key={i} className="pixel-badge border-sol-blue text-sol-blue">
                    {hint}
                  </span>
                ))}
              </div>
            )}

            {!solved ? (
              <>
                {/* Guess input */}
                <div className="relative mb-4">
                  <div className="search-glow flex items-center px-4 py-3 gap-3">
                    <input
                      type="text"
                      value={guess}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                      placeholder="Type your guess..."
                      className="bg-transparent text-text-primary text-sm outline-none flex-1"
                    />
                    <button onClick={handleGuess} className="neon-btn text-xs py-2 px-6">
                      Guess
                    </button>
                  </div>

                  {/* Autocomplete suggestions */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 overflow-hidden z-20" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)" }}>
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setGuess(s.term);
                            setSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
                        >
                          {s.term}
                          <span className="text-text-muted text-xs ml-2">
                            {CATEGORY_LABELS[s.category] || s.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={revealHint}
                    disabled={hintLevel >= config.maxHints}
                    className="text-text-muted text-xs hover:text-sol-blue transition-colors disabled:opacity-30"
                  >
                    &#128161; Reveal hint ({config.maxHints - hintLevel} left)
                  </button>
                  <span className="text-text-muted text-xs">
                    {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Previous attempts */}
                {attempts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attempts.map((a, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1"
                        style={{
                          background: "rgba(255,77,77,0.1)",
                          border: "1px solid rgba(255,77,77,0.2)",
                          color: "#FF4D4D",
                          clipPath: "polygon(2px 0%, calc(100% - 2px) 0%, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0% calc(100% - 2px), 0% 2px)",
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* SOLVED — overlay handles the celebration */
              <GameResultsOverlay
                gameId="daily"
                score={1}
                isOpen={showResults}
                onPlayAgain={() => {}}
                dailyAttempts={attempts.length}
                dailyHints={hintLevel}
                dailyTermName={dailyTerm.term}
                dailyTermId={dailyTerm.id}
              />
            )}
          </>
        )}
      </div>

      <CyberFooter />
    </div>
  );
}
