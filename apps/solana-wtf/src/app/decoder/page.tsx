"use client";

import { useState, useCallback, useEffect, useRef, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProgress } from "@/lib/progress-context";
import { getUnlockRequirement } from "@/lib/unlocks";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MatchedTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  categoryLabel: string;
  related: Array<{ id: string; term: string }>;
  matchType: "exact" | "alias" | "partial";
  positions: Array<{ start: number; end: number }>;
}

interface DecodeResult {
  terms: MatchedTerm[];
  explanation: string;
  highlightedText: string;
}

/* ------------------------------------------------------------------ */
/*  Personality data                                                   */
/* ------------------------------------------------------------------ */

const PERSONALITIES = [
  {
    id: "maid",
    name: "Maid-chan",
    emoji: "\uD83C\uDF80",
    color: "#00FFFF",
    shadow: "rgba(0,255,255,0.4)",
    bg: "linear-gradient(135deg, #00FFFF, #0088AA)",
    shortDesc: "Kawaii",
    desc: "Cute anime-style explanations with uwu energy",
    image: "/personalities/maidchain-herodarkcyber.png",
    imagePosition: "top",
  },
  {
    id: "dm",
    name: "DnD Master",
    emoji: "\uD83D\uDC09",
    color: "#BD00FF",
    shadow: "rgba(189,0,255,0.4)",
    bg: "linear-gradient(135deg, #BD00FF, #7700AA)",
    shortDesc: "Epic",
    desc: "Fantasy RPG narrative like a dungeon master",
    image: "/personalities/dedmaster-herodarkcyber.png",
    imagePosition: "top",
  },
  {
    id: "degen",
    name: "Degen Sensei",
    emoji: "\uD83E\uDD8D",
    color: "#14F195",
    shadow: "rgba(20,241,149,0.4)",
    bg: "linear-gradient(135deg, #14F195, #0ea572)",
    shortDesc: "Based",
    desc: "Crypto degen slang and meme-heavy vibes",
    image: "/personalities/degensensei-herocyber.png",
    imagePosition: "center 20%",
  },
  {
    id: "glados",
    name: "GLaDOS",
    emoji: "\uD83E\uDD16",
    color: "#FF003F",
    shadow: "rgba(255,0,63,0.4)",
    bg: "linear-gradient(135deg, #FF003F, #AA0022)",
    shortDesc: "Savage",
    desc: "Cold, sarcastic AI with backhanded compliments",
    image: "/personalities/GLaDOS-herocyber.png",
    imagePosition: "center 25%",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Category color mapping                                             */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  "ai-ml": "#00FFFF",
  "blockchain-general": "#BD00FF",
  "core-protocol": "#14F195",
  defi: "#FF003F",
  "dev-tools": "#00FFFF",
  infrastructure: "#BD00FF",
  network: "#14F195",
  "programming-fundamentals": "#BD00FF",
  "programming-model": "#14F195",
  security: "#FF003F",
  "solana-ecosystem": "#BD00FF",
  "token-ecosystem": "#00FFFF",
  web3: "#14F195",
  "zk-compression": "#BD00FF",
};

/* ------------------------------------------------------------------ */
/*  Highlighted text renderer                                          */
/* ------------------------------------------------------------------ */

function renderHighlightedText(
  highlightedText: string,
  terms: MatchedTerm[]
): React.ReactNode[] {
  // Parse the marker format: [[termId::matched text]]
  const regex = /\[\[([^:]+)::([^\]]+)\]\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(highlightedText)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{highlightedText.slice(lastIndex, match.index)}</span>
      );
    }

    const termId = match[1];
    const matchedText = match[2];
    const term = terms.find((t) => t.id === termId);
    const color = term
      ? CATEGORY_COLORS[term.category] || "#BD00FF"
      : "#BD00FF";

    parts.push(
      <Link
        key={key++}
        href={`/glossary/${termId}`}
        className="relative inline-block font-semibold transition-all duration-150 hover:scale-105"
        style={{
          color,
          textDecoration: "underline",
          textDecorationColor: `${color}50`,
          textUnderlineOffset: "3px",
        }}
        title={term?.definition?.slice(0, 120) || ""}
      >
        {matchedText}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < highlightedText.length) {
    parts.push(
      <span key={key++}>{highlightedText.slice(lastIndex)}</span>
    );
  }

  return parts;
}

/* ------------------------------------------------------------------ */
/*  Explanation renderer (basic markdown: **bold**)                     */
/* ------------------------------------------------------------------ */

function renderExplanation(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "") {
      result.push(<br key={`br-${i}`} />);
      continue;
    }

    // Parse **bold** segments
    const segments: React.ReactNode[] = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIdx = 0;
    let boldMatch: RegExpExecArray | null;
    let segKey = 0;

    while ((boldMatch = boldRegex.exec(line)) !== null) {
      if (boldMatch.index > lastIdx) {
        segments.push(
          <span key={`s-${i}-${segKey++}`}>
            {line.slice(lastIdx, boldMatch.index)}
          </span>
        );
      }
      segments.push(
        <strong
          key={`s-${i}-${segKey++}`}
          className="text-text-primary font-semibold"
        >
          {boldMatch[1]}
        </strong>
      );
      lastIdx = boldMatch.index + boldMatch[0].length;
    }

    if (lastIdx < line.length) {
      segments.push(
        <span key={`s-${i}-${segKey++}`}>{line.slice(lastIdx)}</span>
      );
    }

    result.push(
      <span key={`line-${i}`}>
        {segments}
        {i < lines.length - 1 && lines[i + 1] !== "" ? "\n" : ""}
      </span>
    );
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Loading dots component                                             */
/* ------------------------------------------------------------------ */

function LoadingDots({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 animate-bounce"
          style={{
            background: color,
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.6s",
            clipPath: "polygon(2px 0%, calc(100% - 2px) 0%, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0% calc(100% - 2px), 0% 2px)",
          }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main decoder page component                                        */
/* ------------------------------------------------------------------ */

export default function DecoderPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = use(searchParams);

  const initialTerm =
    typeof params.term === "string" ? params.term : "";
  const initialPersonality =
    typeof params.personality === "string"
      ? params.personality
      : "maid";

  const { progress, isPersonalityUnlocked, recordDecode } = useProgress();
  const unlockedIds = progress.unlockedPersonalities;

  const [inputText, setInputText] = useState(initialTerm);
  const [selectedPersonality, setSelectedPersonality] = useState("maid");
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedModal, setLockedModal] = useState<typeof PERSONALITIES[number] | null>(null);
  const [unlockLoaded, setUnlockLoaded] = useState(false);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    // Only use the URL personality if it's actually unlocked
    const requestedPersonality = PERSONALITIES.find((p) => p.id === initialPersonality)
      ? initialPersonality
      : "maid";
    setSelectedPersonality(
      isPersonalityUnlocked(requestedPersonality) ? requestedPersonality : "maid"
    );
    setUnlockLoaded(true);
  }, [initialPersonality, isPersonalityUnlocked]);

  const activePersonality = PERSONALITIES.find(
    (p) => p.id === selectedPersonality
  )!;

  // Auto-decode if URL params include a term — only after unlock state is loaded
  useEffect(() => {
    if (initialTerm && unlockLoaded) {
      handleDecode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockLoaded]);

  const handleDecode = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/decode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          personality: selectedPersonality,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error || `Request failed (${res.status})`
        );
      }

      const data: DecodeResult = await res.json();
      setResult(data);
      recordDecode(selectedPersonality);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedPersonality, recordDecode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleDecode();
      }
    },
    [handleDecode]
  );

  // Collect all related terms from results (deduplicated, excluding already-found terms)
  const relatedTerms =
    result?.terms
      .flatMap((t) => t.related)
      .filter(
        (rt, idx, arr) =>
          // Deduplicate
          arr.findIndex((x) => x.id === rt.id) === idx &&
          // Exclude terms already in results
          !result.terms.some((t) => t.id === rt.id)
      )
      .slice(0, 8) || [];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--bg-0)" }}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="orb animate-pulse-glow"
          style={{
            width: 600,
            height: 600,
            background: activePersonality.color,
            top: -200,
            left: "20%",
          }}
        />
        <div
          className="orb animate-pulse-glow"
          style={{
            width: 500,
            height: 500,
            background: "var(--cyber-cyan)",
            top: -100,
            right: "10%",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="orb animate-pulse-glow"
          style={{
            width: 350,
            height: 350,
            background: "var(--cyber-magenta)",
            bottom: "20%",
            left: "5%",
            animationDelay: "2.5s",
          }}
        />
      </div>

      {/* Nav */}
      <CyberNav active="decoder" />

      {/* ============================================ */}
      {/* MAIN CONTENT                                  */}
      {/* ============================================ */}
      <main className="relative z-10 px-4 sm:px-8 pt-6 pb-16 sm:pb-20 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-3"
            style={{ fontFamily: "var(--font-title)" }}>
            <span className="gradient-text">Decoder</span>
          </h1>
          <p className="text-text-secondary text-base max-w-lg"
            style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
            Paste any Solana error, code, transaction, or question. Get it
            decoded with every term explained.
          </p>
        </div>

        {/* ============================================ */}
        {/* INPUT AREA                                    */}
        {/* ============================================ */}
        <div className="mb-8">
          <div className="search-glow p-2" style={{ clipPath: "none", borderRadius: 8 }}>
            {/* Textarea */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Paste your error, code, or just type a question...\n\ne.g. "Error: Account not initialized. Expected PDA derived from seeds..."\ne.g. "wtf is rent-exempt?"\ne.g. "difference between PDA and keypair"`}
                className="w-full bg-transparent text-text-primary text-sm px-5 pt-4 pb-3 resize-none outline-none placeholder:text-text-muted/60 min-h-[160px]"
                style={{ fontFamily: "var(--font-mono)" }}
                maxLength={5000}
              />
              {/* Character count */}
              {inputText.length > 0 && (
                <div
                  className="absolute bottom-2 right-4 text-text-muted"
                  style={{
                    fontFamily: "var(--font-title)",
                    fontSize: "9px",
                    letterSpacing: "1px",
                  }}
                >
                  {inputText.length}/5000
                </div>
              )}
            </div>

            {/* Bottom bar: personality picker + decode button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-3 pb-2 pt-1">
              {/* Personality picker */}
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-xs mr-1" style={{ fontFamily: "var(--font-label)", letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px" }}>Guide:</span>
                {PERSONALITIES.map((p) => {
                  const isActive = p.id === selectedPersonality;
                  const isLocked = !unlockedIds.includes(p.id);
                  return (
                    <div key={p.id} className="group relative">
                      <button
                        onClick={() => {
                          if (isLocked) {
                            setLockedModal(p);
                          } else {
                            setSelectedPersonality(p.id);
                          }
                        }}
                        className="flex items-center justify-center w-9 h-9 transition-all duration-150 hover:scale-110"
                        style={{
                          background: isLocked ? "var(--surface-2)" : `${p.color}20`,
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
                          clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
                        }}
                        title={isLocked ? `${p.name} — Locked` : `${p.name} \u2014 ${p.shortDesc}`}
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
                          fontFamily: "var(--font-title)",
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
                          fontFamily: "var(--font-mono)",
                          fontSize: 9,
                          color: "var(--text-secondary)",
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

              {/* Decode button */}
              <button
                onClick={handleDecode}
                disabled={isLoading || !inputText.trim()}
                className="neon-btn text-sm py-2.5 px-8 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    Decoding <LoadingDots color="var(--cyber-cyan)" />
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    Decode
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="mt-2 text-text-muted text-xs flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
            <kbd
              className="px-1.5 py-0.5 text-[10px] border"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
              suppressHydrationWarning
            >
              {typeof navigator !== "undefined" &&
              /Mac/i.test(navigator.userAgent || "")
                ? "\u2318"
                : "Ctrl"}
            </kbd>
            <span>+</span>
            <kbd
              className="px-1.5 py-0.5 text-[10px] border"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              Enter
            </kbd>
            <span className="ml-1">to decode</span>
          </div>
        </div>

        {/* ============================================ */}
        {/* ERROR STATE                                   */}
        {/* ============================================ */}
        {error && (
          <div
            className="p-5 mb-8 border"
            style={{
              background: "rgba(255,0,63,0.05)",
              borderColor: "rgba(255,0,63,0.3)",
              clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)",
            }}
          >
            <div className="flex items-center gap-2 text-sm font-medium mb-1" style={{ color: "var(--cyber-magenta)" }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span style={{ fontFamily: "var(--font-label)", letterSpacing: "1px", textTransform: "uppercase" }}>Decode failed</span>
            </div>
            <p className="text-text-secondary text-sm" style={{ fontFamily: "var(--font-mono)" }}>{error}</p>
          </div>
        )}

        {/* ============================================ */}
        {/* LOADING STATE                                 */}
        {/* ============================================ */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div
              className="w-16 h-16 flex items-center justify-center text-3xl animate-float"
              style={{
                background: `${activePersonality.color}25`,
                boxShadow: `0 0 30px ${activePersonality.shadow}`,
                clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)",
              }}
            >
              {activePersonality.emoji}
            </div>
            <div className="flex items-center gap-2 text-text-secondary text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              <span>{activePersonality.name} is thinking</span>
              <LoadingDots color={activePersonality.color} />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* RESULTS                                       */}
        {/* ============================================ */}
        {result && !isLoading && (
          <div className="space-y-8">
            {/* Decoded text with highlights */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="pixel-badge"
                  style={{
                    borderColor: activePersonality.color,
                    color: activePersonality.color,
                  }}
                >
                  DECODED
                </span>
                <span className="text-text-muted text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                  {result.terms.length} term
                  {result.terms.length !== 1 ? "s" : ""} found
                </span>
              </div>

              <div
                className="glow-card p-6 hover:transform-none"
                style={{
                  cursor: "default",
                }}
              >
                <div
                  className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {renderHighlightedText(result.highlightedText, result.terms)}
                </div>
              </div>
            </section>

            {/* AI Explanation */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 flex items-center justify-center text-base overflow-hidden"
                  style={{
                    background: `${activePersonality.color}25`,
                    boxShadow: `0 0 16px ${activePersonality.shadow}`,
                    clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
                  }}
                >
                  <Image
                    src={activePersonality.image}
                    alt={activePersonality.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div
                    className="text-xs font-semibold"
                    style={{ color: activePersonality.color, fontFamily: "var(--font-title)", letterSpacing: "1px" }}
                  >
                    {activePersonality.name}
                  </div>
                  <div className="text-text-muted text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
                    {activePersonality.shortDesc} mode
                  </div>
                </div>
              </div>

              <div
                className="overflow-hidden border"
                style={{
                  background: `linear-gradient(135deg, ${activePersonality.color}08, ${activePersonality.color}03)`,
                  borderColor: `${activePersonality.color}30`,
                  clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)",
                }}
              >
                {/* Character image banner */}
                {activePersonality.image && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={activePersonality.image}
                      alt={activePersonality.name}
                      fill
                      className="object-cover"
                      style={{ objectPosition: activePersonality.imagePosition }}
                    />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${activePersonality.color}15 100%)` }} />
                  </div>
                )}
                <div className="p-6">
                  <div className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap" style={{ fontFamily: "var(--font-mono)" }}>
                    {renderExplanation(result.explanation)}
                  </div>
                </div>
              </div>
            </section>

            {/* Terms found */}
            {result.terms.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-semibold text-text-secondary"
                    style={{ fontFamily: "var(--font-label)", letterSpacing: "1px", textTransform: "uppercase" }}>
                    Terms found
                  </h2>
                  <span className="pixel-badge" style={{ borderColor: "var(--cyber-cyan)", color: "var(--cyber-cyan)" }}>
                    {result.terms.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.terms.map((t) => {
                    const catColor =
                      CATEGORY_COLORS[t.category] || "#BD00FF";
                    return (
                      <Link href={`/glossary/${t.id}`} key={t.id}>
                        <div
                          className="glow-card p-4 group"
                          style={{ cursor: "pointer" }}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3
                              className="font-semibold text-sm text-text-primary group-hover:text-[var(--cyber-cyan)] transition-colors duration-150"
                              style={{ fontFamily: "var(--font-label)" }}
                            >
                              {t.term}
                            </h3>
                            <span
                              className="shrink-0 text-[10px] px-2 py-0.5 border"
                              style={{
                                color: catColor,
                                borderColor: `${catColor}40`,
                                background: `${catColor}10`,
                                fontFamily: "var(--font-label)",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                clipPath: "polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0% calc(100% - 3px), 0% 3px)",
                              }}
                            >
                              {t.categoryLabel}
                            </span>
                          </div>

                          {/* Definition preview */}
                          <p className="text-text-muted text-xs leading-relaxed line-clamp-2" style={{ fontFamily: "var(--font-mono)" }}>
                            {t.definition}
                          </p>

                          {/* Match type badge */}
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className="text-text-muted"
                              style={{
                                fontFamily: "var(--font-title)",
                                fontSize: "8px",
                                letterSpacing: "1px",
                              }}
                            >
                              {t.matchType === "exact"
                                ? "EXACT MATCH"
                                : t.matchType === "alias"
                                  ? "ALIAS MATCH"
                                  : "PARTIAL MATCH"}
                            </span>
                            {t.positions.length > 1 && (
                              <span
                                className="text-text-muted"
                                style={{
                                  fontFamily: "var(--font-title)",
                                  fontSize: "8px",
                                  letterSpacing: "1px",
                                }}
                              >
                                x{t.positions.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Related terms suggestions */}
            {relatedTerms.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-semibold text-text-secondary"
                    style={{ fontFamily: "var(--font-label)", letterSpacing: "1px", textTransform: "uppercase" }}>
                    Related terms
                  </h2>
                  <span className="pixel-badge" style={{ borderColor: "var(--cyber-cyan)", color: "var(--cyber-cyan)" }}>
                    EXPLORE
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {relatedTerms.map((rt) => (
                    <Link href={`/glossary/${rt.id}`} key={rt.id}>
                      <span className="category-pill text-xs">{rt.term}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Decode again prompt */}
            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setResult(null);
                  setInputText("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-text-muted text-xs hover:text-text-secondary transition-colors duration-150"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Decode something else
              </button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* EMPTY STATE — shown before first decode       */}
        {/* ============================================ */}
        {!result && !isLoading && !error && (
          <div className="pt-8">
            {/* Example queries */}
            <div className="mb-6">
              <span className="text-text-muted text-xs mb-3 block"
                style={{ fontFamily: "var(--font-label)", letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px" }}>
                Try one of these:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Error: Account not initialized. Expected PDA derived from seeds',
                  'wtf is rent-exempt?',
                  'Transaction simulation failed: Blockhash not found',
                  'Program failed to complete: BPF program panicked',
                  'difference between PDA and keypair account',
                  'what is Proof of History and how does it relate to Tower BFT?',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setInputText(example)}
                    className="text-xs px-3 py-1.5 border text-text-muted hover:text-text-secondary hover:border-[var(--cyber-cyan)] transition-all duration-150"
                    style={{
                      background: "var(--surface-1)",
                      borderColor: "var(--border)",
                      fontFamily: "var(--font-mono)",
                      clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
                    }}
                  >
                    {example.length > 50
                      ? example.slice(0, 50) + "..."
                      : example}
                  </button>
                ))}
              </div>
            </div>

            {/* Personality preview cards */}
            <div>
              <span className="text-text-muted text-xs mb-3 block"
                style={{ fontFamily: "var(--font-label)", letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px" }}>
                Choose your guide:
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PERSONALITIES.map((p) => {
                  const isActive = p.id === selectedPersonality;
                  const isLocked = !unlockedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (isLocked) {
                          setLockedModal(p);
                        } else {
                          setSelectedPersonality(p.id);
                        }
                      }}
                      className="p-4 text-left transition-all duration-150 hover:translate-y-[-4px] group relative overflow-hidden"
                      style={{
                        background: isLocked
                          ? "var(--surface-1)"
                          : isActive
                            ? `linear-gradient(135deg, ${p.color}15, ${p.color}05)`
                            : `linear-gradient(135deg, ${p.color}08, ${p.color}03)`,
                        border: isLocked
                          ? "1px solid var(--border)"
                          : isActive
                            ? `1px solid ${p.color}50`
                            : `1px solid ${p.color}15`,
                        boxShadow: isActive && !isLocked
                          ? `0 0 20px ${p.shadow}`
                          : "none",
                        cursor: "pointer",
                        clipPath: "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)",
                      }}
                    >
                      <div className="relative w-full h-20 overflow-hidden mb-2"
                        style={{ clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)" }}>
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover"
                          style={{
                            objectPosition: p.imagePosition,
                            ...(isLocked ? { filter: "grayscale(1) brightness(0.3)" } : {}),
                          }}
                        />
                      </div>
                      {isLocked && (
                        <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-xs"
                          style={{ background: "var(--surface-3)", border: "1px solid var(--border)", clipPath: "polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0% calc(100% - 3px), 0% 3px)" }}>
                          🔒
                        </div>
                      )}
                      <div
                        className="text-xs font-semibold mb-0.5"
                        style={{ color: isLocked ? "var(--text-muted)" : p.color, fontFamily: "var(--font-title)", fontSize: "11px", letterSpacing: "1px" }}
                      >
                        {p.name}
                      </div>
                      <div className="text-text-muted text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
                        {isLocked ? "Locked" : p.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <CyberFooter />

      {/* Unlock modal */}
      {lockedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setLockedModal(null)}
        >
          <div
            className="relative p-8 max-w-sm w-full text-center"
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--border)",
              clipPath: "polygon(16px 0%, calc(100% - 16px) 0%, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0% calc(100% - 16px), 0% 16px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Silhouette */}
            <div
              className="w-24 h-24 mx-auto mb-5 flex items-center justify-center relative"
              style={{
                background: "var(--surface-2)",
                border: `2px solid ${lockedModal.color}30`,
                boxShadow: `0 0 40px ${lockedModal.color}15`,
                clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)",
              }}
            >
              <span className="text-4xl" style={{ filter: "grayscale(1) brightness(0.3)" }}>
                {lockedModal.emoji}
              </span>
              <div
                className="absolute -bottom-1 -right-1 w-8 h-8 flex items-center justify-center text-sm"
                style={{ background: "var(--surface-3)", border: "2px solid var(--border)", clipPath: "polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0% calc(100% - 3px), 0% 3px)" }}
              >
                🔒
              </div>
            </div>

            {/* Title */}
            <div
              className="text-xs font-bold tracking-widest mb-1"
              style={{ fontFamily: "var(--font-title)", fontSize: "10px", color: "var(--cyber-magenta)", letterSpacing: "3px" }}
            >
              UNLOCK NOW
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-4" style={{ fontFamily: "var(--font-title)" }}>
              {lockedModal.name}
            </h3>

            {/* Requirement */}
            <div
              className="p-4 mb-6"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                clipPath: "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)",
              }}
            >
              <div className="text-text-muted text-[10px] uppercase tracking-wider mb-2"
                style={{ fontFamily: "var(--font-title)", fontSize: "9px", letterSpacing: "2px" }}>
                How to unlock
              </div>
              <p className="text-text-secondary text-sm" style={{ fontFamily: "var(--font-mono)" }}>
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
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors duration-150"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
