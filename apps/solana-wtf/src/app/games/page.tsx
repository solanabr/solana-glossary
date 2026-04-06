"use client";

import Link from "next/link";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";
import { useProgress } from "@/lib/progress-context";

const GAMES = [
  {
    id: "daily",
    name: "WTF Daily",
    icon: "\u2753",
    color: "#BD00FF",
    desc: "Guess the term from a censored definition. New challenge every day.",
  },
  {
    id: "speedrun",
    name: "Speed Run",
    icon: "\u26A1",
    color: "#14F195",
    desc: "60 seconds on the clock. Select the correct term from 4 options. How many can you nail?",
  },
  {
    id: "connections",
    name: "Connections",
    icon: "\uD83D\uDD17",
    color: "#00FFFF",
    desc: "Find which terms are related. Group 16 terms into 4 groups of 4. Inspired by NYT Connections.",
  },
  {
    id: "blitz",
    name: "Category Blitz",
    icon: "\uD83C\uDFF7\uFE0F",
    color: "#00FFFF",
    desc: "A term appears. You pick the right category. Fast, accurate, no mercy.",
  },
];

function formatBestScore(gameId: string, score: number): string {
  if (gameId === "daily") return "Solved!";
  if (gameId === "connections") return `${score}/4 groups`;
  return `Best: ${score}`;
}

export default function GamesHub() {
  const { progress } = useProgress();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-0)" }}>
      <CyberNav active="games" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3"
            style={{ fontFamily: "var(--font-title)" }}>
            <span className="gradient-text">Learn by playing</span>
          </h1>
          <p className="text-text-secondary text-sm"
            style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
            4 games to master Solana terminology. No boring flashcards. Just vibes and knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GAMES.map((g) => {
            const bestScore = progress.bestScores[g.id];
            return (
              <Link href={`/games/${g.id}`} key={g.id}>
                <div
                  className="relative p-6 cursor-pointer transition-all duration-150 hover:translate-y-[-4px] h-full border group"
                  style={{
                    background: "var(--surface-1)",
                    borderColor: `${g.color}20`,
                    clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)",
                  }}
                >
                  {/* Top gradient line on hover */}
                  <div
                    className="absolute top-0 left-[12px] right-[12px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ background: `linear-gradient(90deg, transparent, ${g.color}, transparent)` }}
                  />
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 flex items-center justify-center text-3xl flex-shrink-0"
                      style={{
                        background: `${g.color}15`,
                        clipPath: "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)",
                      }}
                    >
                      {g.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2
                          className="font-bold"
                          style={{
                            color: g.color,
                            fontFamily: "var(--font-title)",
                            fontSize: "10px",
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                          }}
                        >
                          {g.name}
                        </h2>
                        {bestScore !== undefined && (
                          <span
                            className="pixel-badge"
                            style={{
                              borderColor: g.color,
                              color: g.color,
                            }}
                          >
                            {formatBestScore(g.id, bestScore)}
                          </span>
                        )}
                      </div>
                      <p className="text-text-muted text-sm leading-relaxed"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                        {g.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
