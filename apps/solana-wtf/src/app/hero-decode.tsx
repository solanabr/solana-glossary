"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProgress } from "@/lib/progress-context";
import { getUnlockRequirement } from "@/lib/unlocks";

const PERSONALITIES = [
  {
    id: "maid",
    name: "Maid-chan",
    emoji: "🎀",
    color: "#ff6b9d",
    shadow: "rgba(255,107,157,0.4)",
    bg: "linear-gradient(135deg, #ff6b9d, #c850c0)",
    shortDesc: "Kawaii",
    desc: "Cute anime-style explanations with uwu energy",
  },
  {
    id: "degen",
    name: "Degen Sensei",
    emoji: "🦍",
    color: "#14F195",
    shadow: "rgba(20,241,149,0.4)",
    bg: "linear-gradient(135deg, #14F195, #0ea572)",
    shortDesc: "Based",
    desc: "Crypto degen slang and meme-heavy vibes",
  },
  {
    id: "glados",
    name: "GLaDOS",
    emoji: "🤖",
    color: "#03E1FF",
    shadow: "rgba(3,225,255,0.4)",
    bg: "linear-gradient(135deg, #03E1FF, #0066ff)",
    shortDesc: "Savage",
    desc: "Cold, sarcastic AI with backhanded compliments",
  },
  {
    id: "dm",
    name: "DnD Master",
    emoji: "🐉",
    color: "#DC1FFF",
    shadow: "rgba(220,31,255,0.4)",
    bg: "linear-gradient(135deg, #DC1FFF, #9945ff)",
    shortDesc: "Epic",
    desc: "Fantasy RPG narrative like a dungeon master",
  },
];

export default function HeroDecode() {
  const router = useRouter();
  const { progress } = useProgress();
  const unlockedIds = progress.unlockedPersonalities;
  const [text, setText] = useState("");
  const [personality, setPersonality] = useState("maid");
  const [lockedModal, setLockedModal] = useState<typeof PERSONALITIES[number] | null>(null);

  const handleDecode = () => {
    if (!text.trim()) return;
    const params = new URLSearchParams({
      term: text.trim(),
      personality,
    });
    router.push(`/decoder?${params.toString()}`);
  };

  return (
    <>
      <div className="mb-6">
        <div className="search-glow rounded-2xl p-2" style={{ clipPath: "none" }}>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleDecode();
                }
              }}
              placeholder={`Paste your error, code, or just type a question...\n\ne.g. "Error: Account not initialized. Expected PDA derived from seeds..."\ne.g. "wtf is rent-exempt?"\ne.g. "difference between PDA and keypair"`}
              className="w-full bg-transparent text-text-primary text-sm px-5 pt-4 pb-3 rounded-xl resize-none outline-none placeholder:text-text-muted/60 min-h-[140px]"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>

          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs mr-1">Guide:</span>
              {PERSONALITIES.map((p) => {
                const isActive = p.id === personality;
                const isLocked = !unlockedIds.includes(p.id);
                return (
                  <div key={p.id} className="group relative">
                    <button
                      onClick={() => {
                        if (isLocked) {
                          setLockedModal(p);
                        } else {
                          setPersonality(p.id);
                        }
                      }}
                      className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-110"
                      style={{
                        background: isLocked ? "var(--surface-2)" : p.bg,
                        boxShadow: isActive && !isLocked
                          ? `0 0 20px ${p.shadow}, 0 0 40px ${p.shadow}`
                          : "none",
                        outline: isActive && !isLocked
                          ? `2px solid ${p.color}`
                          : "2px solid transparent",
                        outlineOffset: "2px",
                        opacity: isLocked ? 0.45 : isActive ? 1 : 0.6,
                        cursor: "pointer",
                        filter: isLocked ? "grayscale(0.8)" : "none",
                      }}
                      title={isLocked ? `${p.name} — Locked` : `${p.name} — ${p.shortDesc}`}
                    >
                      <span className="text-lg">{p.emoji}</span>
                    </button>
                    {/* Rich tooltip — outside button so clip-path doesn't hide it */}
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-20"
                      style={{
                        background: "var(--surface-3)",
                        border: `1px solid ${isLocked ? "rgba(255,0,63,0.3)" : `${p.color}30`}`,
                        padding: "8px 12px",
                        minWidth: 160,
                        clipPath: "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)",
                      }}
                    >
                      <div style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: isLocked ? "#FF003F" : p.color,
                        marginBottom: 3,
                        textTransform: "uppercase",
                      }}>
                        {isLocked ? `LOCKED // ${p.name}` : p.name}
                      </div>
                      <div style={{
                        fontFamily: "'Fira Code', monospace",
                        fontSize: 9,
                        color: "#8A8FA8",
                        lineHeight: 1.4,
                        whiteSpace: "normal",
                      }}>
                        {isLocked ? "Unlock by playing games" : p.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleDecode}
              disabled={!text.trim()}
              className="neon-btn text-sm py-2.5 px-8 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Decode
            </button>
          </div>
        </div>
      </div>

      {/* Unlock modal */}
      {lockedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setLockedModal(null)}
        >
          <div
            className="relative rounded-3xl p-8 max-w-sm w-full text-center"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Silhouette */}
            <div
              className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center relative"
              style={{
                background: "var(--surface-2)",
                border: `2px solid ${lockedModal.color}30`,
                boxShadow: `0 0 40px ${lockedModal.color}15`,
              }}
            >
              <span className="text-4xl" style={{ filter: "grayscale(1) brightness(0.3)" }}>
                {lockedModal.emoji}
              </span>
              <div
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: "var(--surface-3)", border: "2px solid var(--border)" }}
              >
                🔒
              </div>
            </div>

            {/* Title */}
            <div
              className="text-xs font-bold tracking-widest mb-1"
              style={{ fontFamily: "var(--font-pixel)", fontSize: "10px", color: lockedModal.color }}
            >
              UNLOCK NOW
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {lockedModal.name}
            </h3>

            {/* Requirement */}
            <div
              className="rounded-xl p-4 mb-6"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
            >
              <div className="text-text-muted text-[10px] uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-pixel)", fontSize: "7px" }}>
                How to unlock
              </div>
              <p className="text-text-secondary text-sm">
                {getUnlockRequirement(lockedModal.id)}
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/games"
              className="neon-btn text-sm py-2.5 px-8 inline-flex items-center gap-2"
              onClick={() => setLockedModal(null)}
            >
              Play Games
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Close */}
            <button
              onClick={() => setLockedModal(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
