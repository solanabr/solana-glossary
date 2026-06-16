"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useProgress } from "@/lib/progress-context";
import { useAuth } from "@/lib/auth-context";
import { getUnlockProgress } from "@/lib/unlocks";
import { PERSONALITIES } from "@/lib/personalities";
import AuthModal from "@/components/auth-modal";

const CHAMFER_8 =
  "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)";
const CHAMFER_6 =
  "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)";
const CHAMFER_4 =
  "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)";

interface UnsolvedGroup {
  label: string;
  terms: string[];
}

interface GameResultsOverlayProps {
  gameId: string;
  score: number;
  previousBest?: number;
  isOpen: boolean;
  onPlayAgain: () => void;
  // Speedrun
  totalQuestions?: number;
  bestStreak?: number;
  // Blitz
  mistakes?: number;
  accuracy?: number;
  // Connections
  solvedGroups?: number;
  totalGroups?: number;
  unsolvedGroups?: UnsolvedGroup[];
  // Daily
  dailyAttempts?: number;
  dailyHints?: number;
  dailyTermName?: string;
  dailyTermId?: string;
}

function getScoreEmoji(gameId: string, score: number, totalGroups?: number): string {
  if (gameId === "daily") return "\u{1F389}";
  if (gameId === "connections") {
    return score === (totalGroups ?? 4) ? "\u{1F389}" : "\u{1F624}";
  }
  if (score >= 20) return "\u{1F3C6}";
  if (score >= 15) return "\u{1F525}";
  if (score >= 10) return "\u{1F525}";
  if (score >= 5) return "\u{1F44D}";
  return "\u{1F4AA}";
}

function getScoreLabel(gameId: string, score: number, props: GameResultsOverlayProps): string {
  if (gameId === "daily") return "Solved!";
  if (gameId === "connections") {
    if (score === (props.totalGroups ?? 4)) return "All groups found!";
    return `${score}/${props.totalGroups ?? 4} groups`;
  }
  return `${score} correct`;
}

export default function GameResultsOverlay({
  gameId,
  score,
  previousBest,
  isOpen,
  onPlayAgain,
  totalQuestions,
  bestStreak,
  mistakes,
  accuracy,
  solvedGroups,
  totalGroups,
  unsolvedGroups,
  dailyAttempts,
  dailyHints,
  dailyTermName,
  dailyTermId,
}: GameResultsOverlayProps) {
  const { progress } = useProgress();
  const { isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (!isOpen || typeof document === "undefined") return null;

  const isNewBest = previousBest !== undefined && score > previousBest;
  const unlockProgress = getUnlockProgress(progress);
  const lockedPersonalities = unlockProgress.filter((p) => !p.isUnlocked);
  const hasProgress =
    progress.gamesCompleted.length > 0 ||
    Object.keys(progress.bestScores).length > 0;
  const showSaveCTA = !isAuthenticated && hasProgress;
  const isDaily = gameId === "daily";

  const effectiveScore = gameId === "connections" ? (solvedGroups ?? score) : score;
  const emoji = getScoreEmoji(gameId, effectiveScore, totalGroups);
  const scoreLabel = getScoreLabel(gameId, effectiveScore, {
    gameId, score, isOpen, onPlayAgain, totalGroups, solvedGroups,
    previousBest, totalQuestions, bestStreak, mistakes, accuracy,
    unsolvedGroups, dailyAttempts, dailyHints, dailyTermName, dailyTermId,
  });

  const overlay = createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
      style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        animation: "overlay-fade-in 0.3s ease forwards",
      }}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border)",
          clipPath: CHAMFER_8,
          animation: "overlay-scale-in 0.3s ease forwards",
        }}
      >
        <div className="p-6 sm:p-8">
          {/* ─── A) Score Celebration ─── */}
          <div className="text-center mb-6">
            <div
              className="text-6xl mb-3"
              style={{ animation: "bounce-in 0.5s ease" }}
            >
              {emoji}
            </div>

            <h2
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-title)" }}
            >
              <span className="gradient-text">{scoreLabel}</span>
            </h2>

            {isNewBest && (
              <div
                className="inline-block px-3 py-1 mt-2 mb-1 text-xs font-bold uppercase tracking-wider"
                style={{
                  fontFamily: "var(--font-label)",
                  color: "#FFB800",
                  background: "rgba(255,184,0,0.1)",
                  border: "1px solid rgba(255,184,0,0.3)",
                  clipPath: CHAMFER_4,
                  animation: "pulse-glow 2s ease-in-out infinite",
                }}
              >
                NEW BEST
              </div>
            )}

            {/* Sub-stats */}
            <div
              className="flex items-center justify-center gap-4 mt-3 flex-wrap"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            >
              {/* Speedrun sub-stats */}
              {gameId === "speedrun" && totalQuestions !== undefined && (
                <span className="text-text-muted">
                  {totalQuestions} answered
                </span>
              )}
              {gameId === "speedrun" && bestStreak !== undefined && bestStreak > 1 && (
                <span style={{ color: "var(--sol-magenta)" }}>
                  {bestStreak}x best streak
                </span>
              )}

              {/* Blitz sub-stats */}
              {gameId === "blitz" && mistakes !== undefined && (
                <span className="text-text-muted">
                  {mistakes} mistake{mistakes !== 1 ? "s" : ""}
                </span>
              )}
              {gameId === "blitz" && accuracy !== undefined && (
                <span style={{ color: "var(--sol-green)" }}>
                  {accuracy}% accuracy
                </span>
              )}

              {/* Connections sub-stats */}
              {gameId === "connections" && mistakes !== undefined && (
                <span className="text-text-muted">
                  {mistakes} mistake{mistakes !== 1 ? "s" : ""}
                </span>
              )}

              {/* Daily sub-stats */}
              {isDaily && dailyAttempts !== undefined && (
                <span className="text-text-muted">
                  {dailyAttempts} attempt{dailyAttempts !== 1 ? "s" : ""}
                </span>
              )}
              {isDaily && dailyHints !== undefined && (
                <span className="text-text-muted">
                  {dailyHints > 0
                    ? `${dailyHints} hint${dailyHints !== 1 ? "s" : ""}`
                    : "No hints!"}
                </span>
              )}
            </div>

            {/* Daily: show term name */}
            {isDaily && dailyTermName && (
              <div
                className="mt-3 text-lg font-bold"
                style={{
                  fontFamily: "var(--font-title)",
                  color: "var(--sol-green)",
                }}
              >
                {dailyTermName}
              </div>
            )}
          </div>

          {/* ─── Connections: unsolved groups ─── */}
          {gameId === "connections" && unsolvedGroups && unsolvedGroups.length > 0 && (
            <div className="mb-6">
              {unsolvedGroups.map((g) => (
                <div
                  key={g.label}
                  className="p-3 mb-2 text-center"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    clipPath: CHAMFER_6,
                  }}
                >
                  <div className="font-bold text-xs mb-1 text-text-muted"
                    style={{ fontFamily: "var(--font-label)" }}>
                    {g.label}
                  </div>
                  <div className="text-text-muted text-xs"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    {g.terms.join(" \u00B7 ")}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── B) Unlock Progress ─── */}
          {lockedPersonalities.length > 0 && (
            <div
              className="mb-6 p-4"
              style={{
                background: "var(--surface-1)",
                clipPath: CHAMFER_6,
                border: "none",
                boxShadow: "inset 0 0 0 1px var(--border)",
              }}
            >
              <div
                className="text-text-muted uppercase tracking-wider mb-3"
                style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em" }}
              >
                UNLOCK_PROGRESS
              </div>

              {lockedPersonalities.map((info) => {
                const meta = PERSONALITIES.find((p) => p.id === info.id);
                if (!meta) return null;

                // Show the closest path (highest % completion)
                const bestPath = info.paths.reduce((best, p) => {
                  const pct = p.required > 0 ? p.current / p.required : 0;
                  const bestPct = best.required > 0 ? best.current / best.required : 0;
                  return pct > bestPct ? p : best;
                }, info.paths[0]);

                if (!bestPath) return null;

                const justUnlocked = info.isUnlocked;
                const pct = Math.min((bestPath.current / bestPath.required) * 100, 100);

                return (
                  <div key={info.id} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{meta.emoji}</span>
                      <span
                        className="text-xs font-bold"
                        style={{
                          fontFamily: "var(--font-label)",
                          color: meta.color,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {meta.name}
                      </span>
                      {justUnlocked && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
                          style={{
                            color: meta.color,
                            background: `${meta.color}15`,
                            border: `1px solid ${meta.color}40`,
                            clipPath: CHAMFER_4,
                          }}
                        >
                          UNLOCKED
                        </span>
                      )}
                      <span
                        className="text-text-muted text-[10px] ml-auto"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {bestPath.label}: {bestPath.current}/{bestPath.required}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="w-full h-1.5 overflow-hidden"
                      style={{
                        background: "var(--surface-3)",
                        clipPath: CHAMFER_4,
                      }}
                    >
                      <div
                        className="h-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: bestPath.met
                            ? meta.color
                            : `linear-gradient(90deg, ${meta.color}80, ${meta.color})`,
                          boxShadow: bestPath.met ? `0 0 8px ${meta.shadow}` : "none",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── C) Save CTA ─── */}
          {showSaveCTA && (
            <div
              className="flex items-center gap-3 px-4 py-3 mb-6"
              style={{
                background: "rgba(0,255,255,0.04)",
                border: "1px solid rgba(0,255,255,0.12)",
                clipPath: CHAMFER_6,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00FFFF"
                strokeWidth="2"
                className="flex-shrink-0"
              >
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
              <span
                className="text-xs flex-1"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
              >
                Save your progress across devices
              </span>
              <button
                onClick={() => setShowAuth(true)}
                className="text-xs px-3 py-1 font-semibold flex-shrink-0 transition-all duration-150"
                style={{
                  fontFamily: "var(--font-label)",
                  color: "#00FFFF",
                  border: "1px solid rgba(0,255,255,0.3)",
                  background: "rgba(0,255,255,0.08)",
                  letterSpacing: "0.5px",
                  clipPath: CHAMFER_4,
                }}
              >
                CONNECT
              </button>
            </div>
          )}

          {/* ─── D) Actions ─── */}
          <div className="flex gap-3 justify-center">
            {isDaily && dailyTermId ? (
              <>
                <Link
                  href={`/glossary/${dailyTermId}`}
                  className="neon-btn text-sm py-2.5 px-6"
                >
                  Learn more
                </Link>
                <Link
                  href="/games"
                  className="px-6 py-2.5 border border-border text-text-secondary text-sm hover:text-[var(--cyber-cyan)] hover:border-border-hover transition-all"
                  style={{ clipPath: CHAMFER_4 }}
                >
                  Other Games
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={onPlayAgain}
                  className="neon-btn text-sm py-2.5 px-8"
                >
                  Play Again
                </button>
                <Link
                  href="/games"
                  className="px-8 py-2.5 border border-border text-text-secondary text-sm hover:text-[var(--cyber-cyan)] hover:border-border-hover transition-all"
                  style={{ clipPath: CHAMFER_4 }}
                >
                  Other Games
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes overlay-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes overlay-scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 4px rgba(255,184,0,0.2); }
          50% { box-shadow: 0 0 12px rgba(255,184,0,0.5); }
        }
      `}</style>
    </div>,
    document.body
  );

  return (
    <>
      {overlay}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
