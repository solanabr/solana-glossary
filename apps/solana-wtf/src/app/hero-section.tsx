"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useProgress } from "@/lib/progress-context";
import { getUnlockRequirement, getUnlockProgress } from "@/lib/unlocks";
import { PERSONALITIES as PERSONALITY_META } from "@/lib/personalities";

/* ─── i18n ────────────────────────────────────────────────────── */

const HERO_I18N: Record<string, Record<string, string>> = {
  en: {
    subtitle1: "Paste any Solana ",
    error: "error",
    mid: ", transaction, or ",
    code: "code",
    subtitle2: "Get it decoded. Instantly.",
    terms: "terms",
    categories: "categories",
    languages: "languages",
    aiGuides: "AI guides",
  },
  pt: {
    subtitle1: "Cole qualquer ",
    error: "erro",
    mid: ", transação ou ",
    code: "código",
    subtitle2: "Solana. Decodificado. Instantaneamente.",
    terms: "termos",
    categories: "categorias",
    languages: "idiomas",
    aiGuides: "guias IA",
  },
  es: {
    subtitle1: "Pega cualquier ",
    error: "error",
    mid: ", transacción o ",
    code: "código",
    subtitle2: "Solana. Decodificado. Al instante.",
    terms: "términos",
    categories: "categorías",
    languages: "idiomas",
    aiGuides: "guías IA",
  },
};

/* ─── Personality + Skin Data ───────────────────────────────── */

interface Skin {
  id: string;
  src: string;
  label: string;
  unlockAt?: number; // decode count required, undefined = always available
}

interface Personality {
  id: string;
  name: string;
  emoji: string;
  color: string;
  shadow: string;
  shortDesc: string;
  desc: string;
  skins: Skin[];
}

const PERSONALITIES: Personality[] = [
  {
    id: "maid",
    name: "Maid-chan",
    emoji: "\u{1F380}",
    color: "#00FFFF",
    shadow: "rgba(0,255,255,0.4)",
    shortDesc: "Kawaii",
    desc: "Cute anime-style explanations with uwu energy",
    skins: [
      { id: "darkcyber", src: "/personalities/maidchain-herodarkcyber.png", label: "Dark Cyber" },
      { id: "cyber", src: "/personalities/maidchain-herocyber.png", label: "Neon Cyber", unlockAt: 5 },
      { id: "mecha", src: "/personalities/maidchain-herorobot.png", label: "Mecha", unlockAt: 10 },
      { id: "manga", src: "/personalities/maidchain-herocartoon.png", label: "Manga", unlockAt: 15 },
    ],
  },
  {
    id: "dm",
    name: "DnD Master",
    emoji: "\u{1F409}",
    color: "#BD00FF",
    shadow: "rgba(189,0,255,0.4)",
    shortDesc: "Epic",
    desc: "Fantasy RPG narrative like a dungeon master",
    skins: [
      { id: "darkcyber", src: "/personalities/dedmaster-herodarkcyber.png", label: "Dark Cyber" },
      { id: "cyber", src: "/personalities/dedmaster-herocyber.png", label: "Neon Cyber", unlockAt: 5 },
      { id: "classic", src: "/personalities/dedmaster-hero.png", label: "Classic", unlockAt: 15 },
    ],
  },
  {
    id: "degen",
    name: "Degen Sensei",
    emoji: "\u{1F98D}",
    color: "#14F195",
    shadow: "rgba(20,241,149,0.4)",
    shortDesc: "Based",
    desc: "Crypto degen slang and meme-heavy vibes",
    skins: [
      { id: "cyber", src: "/personalities/degensensei-herocyber.png", label: "Neon Cyber" },
    ],
  },
  {
    id: "glados",
    name: "GLaDOS",
    emoji: "\u{1F916}",
    color: "#FF003F",
    shadow: "rgba(255,0,63,0.4)",
    shortDesc: "Savage",
    desc: "Cold, sarcastic AI with backhanded compliments",
    skins: [
      { id: "cyber", src: "/personalities/GLaDOS-herocyber.png", label: "Neon Cyber" },
    ],
  },
];

/* ─── Clip-path helpers ─────────────────────────────────────── */

const CHAMFER_20 =
  "polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)";

const CHAMFER_12 =
  "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

const CHAMFER_8 =
  "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)";

const CHAMFER_6 =
  "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)";

const CHAMFER_4 =
  "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)";

/* ─── FloatingOrb sub-component ────────────────────────────── */

function FloatingOrb({
  p,
  i,
  isLocked,
  isActive,
  orbPosition,
  onSwitch,
  onLockModal,
}: {
  p: Personality;
  i: number;
  isLocked: boolean;
  isActive: boolean;
  orbPosition: React.CSSProperties;
  onSwitch: () => void;
  onLockModal: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute"
      style={{ ...orbPosition, animation: `float 4s ease-in-out ${i * 0.6}s infinite` } as React.CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => (isLocked ? onLockModal() : onSwitch())}
        className="flex items-center justify-center text-xl"
        style={{
          width: 50,
          height: 50,
          clipPath: CHAMFER_8,
          background:
            isActive
              ? `${p.color}20`
              : hovered && !isLocked
              ? `${p.color}15`
              : "var(--surface-2)",
          boxShadow:
            isActive && !isLocked
              ? `0 0 18px ${p.shadow}, inset 0 0 0 1.5px ${p.color}`
              : hovered && !isLocked
              ? `0 0 14px ${p.shadow}, inset 0 0 0 1.5px ${p.color}80`
              : hovered && isLocked
              ? `0 0 10px rgba(255,0,63,0.4), inset 0 0 0 1.5px rgba(255,0,63,0.5)`
              : `inset 0 0 0 1px var(--border)`,
          opacity: isLocked ? (hovered ? 0.6 : 0.45) : 1,
          cursor: "pointer",
          transition: "background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
          filter: isLocked ? "grayscale(0.5)" : "none",
        }}
        title={isLocked ? `${p.name} -- Locked` : p.name}
      >
        {p.emoji}
      </button>
      {/* Rich tooltip — outside button so clip-path doesn't hide it */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-20"
        style={{
          background: "var(--surface-3)",
          border: `1px solid ${isLocked ? "rgba(255,0,63,0.3)" : `${p.color}30`}`,
          padding: "8px 12px",
          minWidth: 160,
          clipPath: CHAMFER_6,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      >
        <div style={{
          fontFamily: "var(--font-orbitron)",
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
          fontFamily: "var(--font-fira-code)",
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
}

/* ─── HUD Corner Mark ───────────────────────────────────────── */

function HudCorner({ position, color = "#00FFFF" }: { position: "tl" | "tr" | "bl" | "br"; color?: string }) {
  const size = 18;
  const thick = 2;
  const base: React.CSSProperties = { position: "absolute", pointerEvents: "none" };

  const borderH: React.CSSProperties = { width: size, height: thick, background: color };
  const borderV: React.CSSProperties = { width: thick, height: size, background: color };

  if (position === "tl")
    return (
      <div style={{ ...base, top: 8, left: 8 }}>
        <div style={borderH} />
        <div style={borderV} />
      </div>
    );
  if (position === "tr")
    return (
      <div style={{ ...base, top: 8, right: 8 }}>
        <div style={{ ...borderH, marginLeft: "auto" }} />
        <div style={{ ...borderV, marginLeft: "auto" }} />
      </div>
    );
  if (position === "bl")
    return (
      <div style={{ ...base, bottom: 8, left: 8, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={borderV} />
        <div style={borderH} />
      </div>
    );
  return (
    <div style={{ ...base, bottom: 8, right: 8, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end" }}>
      <div style={borderV} />
      <div style={{ ...borderH, marginLeft: "auto" }} />
    </div>
  );
}

/* ─── Helpers for useSyncExternalStore ──────────────────────── */

function subscribeLocale(callback: () => void) {
  window.addEventListener("locale-change", callback);
  return () => window.removeEventListener("locale-change", callback);
}

function getLocaleSnapshot() {
  const saved = localStorage.getItem("solana-wtf-locale");
  return saved && ["en", "pt", "es"].includes(saved) ? saved : "en";
}

function getLocaleServerSnapshot() {
  return "en";
}

/* ─── Main Component ────────────────────────────────────────── */

interface HeroSectionProps {
  totalTerms?: number;
  totalCategories?: number;
}

export default function HeroSection({ totalTerms = 0, totalCategories = 0 }: HeroSectionProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const { progress } = useProgress();
  const unlockedIds = progress.unlockedPersonalities;
  const [personality, setPersonality] = useState("maid");
  const [skinIdx, setSkinIdx] = useState(0);
  const [lockedModal, setLockedModal] = useState<Personality | null>(null);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [decodeHovered, setDecodeHovered] = useState(false);
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleServerSnapshot);

  const handleDecode = () => {
    if (!text.trim()) return;
    const params = new URLSearchParams({ term: text.trim(), personality });
    router.push(`/decoder?${params.toString()}`);
  };

  const active = PERSONALITIES.find((p) => p.id === personality)!;
  const isPersonalityLocked = !unlockedIds.includes(active.id);
  const activeSkin = active.skins[skinIdx] ?? null;
  const decodeCount = progress.decodeCounts[active.id] || 0;
  const isSkinLocked = activeSkin?.unlockAt ? decodeCount < activeSkin.unlockAt : false;
  const heroSrc = activeSkin?.src ?? null;

  const ht = HERO_I18N[locale] || HERO_I18N.en;

  const switchPersonality = (id: string) => {
    setPersonality(id);
    setSkinIdx(0);
  };

  /* ─── Floating orb positions (desktop only) ──────────────── */

  const orbPositions: React.CSSProperties[] = [
    { top: "2%", left: "-10%" },
    { top: "12%", right: "-10%" },
    { bottom: "22%", left: "-7%" },
    { bottom: "5%", right: "-7%" },
  ];

  /* ─── Hero Image Block (shared between mobile + desktop) ─── */

  const heroImageBlock = (
    <div className="relative" style={{ width: "100%", maxWidth: 440 }}>
      {/* Hero Image Frame */}
      <div
        className="relative w-full"
        style={{ aspectRatio: "1 / 1" }}
      >
        {/* Outer frame */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: CHAMFER_12,
            background: "var(--surface-1)",
          }}
        >
          {/* Cyan border via inset shadow */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              clipPath: CHAMFER_12,
              boxShadow: `inset 0 0 0 1.5px #00FFFF40, inset 0 0 20px rgba(0,255,255,0.06)`,
            }}
          />

          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.015) 2px, rgba(0,255,255,0.015) 4px)",
              mixBlendMode: "overlay",
            }}
          />

          {/* Image or empty state */}
          {heroSrc && mounted && !isPersonalityLocked ? (
            <Image
              key={`${personality}-${skinIdx}`}
              src={heroSrc}
              alt={`${active.name} - ${activeSkin?.label ?? ""}`}
              fill
              className="object-cover object-center transition-all duration-300"
              style={{
                filter: isSkinLocked ? "brightness(0.3) blur(2px)" : "none",
              }}
              priority
            />
          ) : !isPersonalityLocked && !heroSrc ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl lg:text-7xl" style={{ filter: "grayscale(1) brightness(0.3)" }}>
                {active.emoji}
              </span>
            </div>
          ) : null}

          {/* ─── Lock Overlay (personality locked OR skin locked) ─── */}
          {(isPersonalityLocked || isSkinLocked) && mounted && (
            <div
              className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6"
              style={{
                background: "rgba(10,11,16,0.65)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div
                className="flex items-center justify-center mb-4"
                style={{
                  width: 48,
                  height: 48,
                  clipPath: CHAMFER_8,
                  background: "var(--surface-2)",
                  boxShadow: "0 0 16px rgba(255,0,63,0.3), inset 0 0 0 1.5px rgba(255,0,63,0.5)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF003F" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-orbitron)",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#FF003F",
                  letterSpacing: "0.12em",
                  textShadow: "0 0 12px rgba(255,0,63,0.6)",
                  animation: "pulse-text 2s ease-in-out infinite",
                  marginBottom: 6,
                }}
              >
                UNLOCK NOW
              </div>

              <p
                className="text-text-secondary text-xs mb-4 max-w-[220px]"
                style={{ fontFamily: "var(--font-fira-code)", lineHeight: 1.5 }}
              >
                {isPersonalityLocked
                  ? getUnlockRequirement(active.id)
                  : `Decode ${activeSkin?.unlockAt} terms with ${active.name} (${decodeCount}/${activeSkin?.unlockAt})`}
              </p>

              <Link
                href={isPersonalityLocked ? "/games" : "/decoder"}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold transition-all duration-150"
                style={{
                  fontFamily: "var(--font-orbitron)",
                  color: "#FF003F",
                  border: "1.5px solid #FF003F",
                  borderRadius: 3,
                  background: "transparent",
                  letterSpacing: "0.1em",
                  boxShadow: "0 0 12px rgba(255,0,63,0.25), inset 0 0 8px rgba(255,0,63,0.06)",
                }}
              >
                {isPersonalityLocked ? "PLAY GAMES" : "GO DECODE"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* HUD Corner Marks */}
          <HudCorner position="tl" color="#00FFFF" />
          <HudCorner position="tr" color="#00FFFF" />
          <HudCorner position="bl" color="#00FFFF" />
          <HudCorner position="br" color="#00FFFF" />
        </div>
      </div>

      {/* ─── Skin Picker Strip ─── */}
      {!isPersonalityLocked && active.skins.length > 0 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          {active.skins.map((skin, i) => {
            const isActiveSkin = i === skinIdx;
            const skinLocked = skin.unlockAt ? decodeCount < skin.unlockAt : false;
            return (
              <button
                key={skin.id}
                onClick={() => setSkinIdx(i)}
                className="relative overflow-hidden transition-all duration-150"
                style={{
                  width: 48,
                  height: 48,
                  clipPath: CHAMFER_6,
                  cursor: "pointer",
                  boxShadow: isActiveSkin
                    ? `0 0 10px ${active.shadow}, inset 0 0 0 1.5px ${active.color}`
                    : "inset 0 0 0 1px var(--border)",
                  opacity: isActiveSkin ? 1 : 0.65,
                }}
              >
                <Image
                  src={skin.src}
                  alt={skin.label}
                  fill
                  className="object-cover"
                  style={{
                    filter: skinLocked ? "brightness(0.25) blur(1px)" : "none",
                  }}
                />
                {skinLocked && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-10"
                    style={{ background: "rgba(10,11,16,0.4)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF003F" strokeWidth="2.5" opacity={0.8}>
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                )}
                <div
                  className="absolute bottom-0 left-0 right-0 text-center py-0.5 opacity-0 hover:opacity-100 transition-opacity duration-150"
                  style={{
                    background: "rgba(10,11,16,0.75)",
                    fontFamily: "var(--font-fira-code)",
                    fontSize: 7,
                    color: skinLocked ? "#FF003F" : active.color,
                    letterSpacing: "0.05em",
                  }}
                >
                  {skin.label}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ═══ MOBILE: Hero image on top ═══ */}
      <div className="flex flex-col items-center mb-6 lg:hidden">
        <div style={{ width: "100%", maxWidth: 280 }}>
          {heroImageBlock}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16">
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="flex-1 w-full lg:max-w-2xl pt-0 lg:pt-4">
          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-widest leading-[1] mb-3 lg:mb-4 uppercase"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            <span
              className="relative inline-block"
              style={{
                color: "#00FFFF",
                textShadow: "0 0 20px rgba(0,255,255,0.6), 0 0 40px rgba(0,255,255,0.3)",
                animation: "glitch-flicker 4s infinite",
              }}
            >
              WTF
            </span>{" "}
            <span className="text-text-primary">is that</span>
            <span
              style={{
                color: "#FF003F",
                textShadow: "0 0 20px rgba(255,0,63,0.5)",
              }}
            >
              ?
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-text-secondary text-xs sm:text-sm mb-6 lg:mb-8 max-w-md leading-relaxed"
            style={{ fontFamily: "var(--font-fira-code)" }}
          >
            {ht.subtitle1}
            <span style={{ color: "#00FFFF" }}>{ht.error}</span>
            {ht.mid}
            <span style={{ color: "#00FFFF" }}>{ht.code}</span>.
            <br />
            {ht.subtitle2}
          </p>

          {/* ─── Decode Bar ─── */}
          <div>
            <div
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: 0,
                transition: "border-color 150ms, box-shadow 150ms",
              }}
              className="group/bar focus-within:!border-[rgba(0,255,255,0.35)] focus-within:shadow-[0_0_30px_rgba(0,255,255,0.1)]"
            >
              {/* Header line */}
              <div
                className="flex items-center gap-2 px-3 sm:px-4 pt-3 pb-1"
                style={{ fontFamily: "var(--font-fira-code)", fontSize: 10, color: "var(--text-muted)" }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: "#00FFFF",
                    boxShadow: "0 0 6px rgba(0,255,255,0.8)",
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                <span className="truncate" style={{ letterSpacing: "0.08em" }}>
                  INPUT_STREAM &gt; DECODER_v4.2
                </span>
              </div>

              {/* Textarea */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleDecode();
                  }
                }}
                placeholder={`Paste your error, code, or question...\n\ne.g. "wtf is rent-exempt?"\ne.g. "difference between PDA and keypair"`}
                className="w-full bg-transparent text-text-primary text-sm px-4 sm:px-5 pt-3 pb-3 resize-none outline-none placeholder:text-text-muted/50 min-h-[100px] sm:min-h-[130px]"
                style={{
                  fontFamily: "var(--font-fira-code)",
                  caretColor: "#00FFFF",
                }}
              />

              {/* Bottom bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-3 pb-3 pt-1">
                {/* Guide picker */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-text-muted mr-1 hidden sm:inline"
                    style={{ fontFamily: "var(--font-fira-code)", fontSize: 10, letterSpacing: "0.05em" }}
                  >
                    GUIDE:
                  </span>
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
                              switchPersonality(p.id);
                            }
                          }}
                          className="flex items-center justify-center transition-all duration-150"
                          style={{
                            width: 34,
                            height: 34,
                            clipPath: CHAMFER_6,
                            background: isLocked
                              ? "var(--surface-2)"
                              : isActive
                              ? `${p.color}18`
                              : "var(--surface-2)",
                            border: "none",
                            outline: "none",
                            boxShadow: isActive && !isLocked
                              ? `0 0 12px ${p.shadow}, inset 0 0 8px ${p.shadow}`
                              : "none",
                            opacity: isLocked ? 0.4 : isActive ? 1 : 0.55,
                            cursor: "pointer",
                            filter: isLocked ? "grayscale(0.85)" : "none",
                            position: "relative",
                          }}
                          title={isLocked ? `${p.name} -- Locked` : `${p.name} -- ${p.shortDesc}`}
                        >
                          {isActive && !isLocked && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                clipPath: CHAMFER_6,
                                border: `1.5px solid ${p.color}`,
                                boxShadow: `0 0 8px ${p.shadow}`,
                              }}
                            />
                          )}
                          <span className="text-base sm:text-lg relative z-10">{p.emoji}</span>

                          {isLocked && (
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                              style={{
                                clipPath: CHAMFER_6,
                                boxShadow: "0 0 12px rgba(255,0,63,0.5), inset 0 0 6px rgba(255,0,63,0.3)",
                              }}
                            />
                          )}
                        </button>
                        {/* Rich tooltip — outside button so clip-path doesn't hide it */}
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-20"
                          style={{
                            background: "var(--surface-3)",
                            border: `1px solid ${isLocked ? "rgba(255,0,63,0.3)" : `${p.color}30`}`,
                            padding: "8px 12px",
                            minWidth: 160,
                            clipPath: CHAMFER_6,
                          }}
                        >
                          <div style={{
                            fontFamily: "var(--font-orbitron)",
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
                            fontFamily: "var(--font-fira-code)",
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
                  disabled={!text.trim()}
                  onMouseEnter={() => setDecodeHovered(true)}
                  onMouseLeave={() => setDecodeHovered(false)}
                  className="w-full sm:w-auto"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 24px",
                    background: decodeHovered && text.trim()
                      ? "linear-gradient(135deg, #00FFFF, rgba(0,255,255,0.3))"
                      : "transparent",
                    color: decodeHovered && text.trim() ? "#0A0B10" : "#00FFFF",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#00FFFF",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    cursor: text.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.15s ease",
                    boxShadow: decodeHovered && text.trim()
                      ? "0 0 30px rgba(0,255,255,0.35), 0 0 60px rgba(0,255,255,0.15), inset 0 0 20px rgba(0,255,255,0.15)"
                      : text.trim()
                      ? "0 0 12px rgba(0,255,255,0.15), inset 0 0 12px rgba(0,255,255,0.15)"
                      : "none",
                    opacity: text.trim() ? 1 : 0.3,
                    clipPath: CHAMFER_8,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Decode
                </button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5 mt-5 lg:mt-7"
            style={{
              fontFamily: "'Fira Code', monospace",
              fontSize: 11,
              color: "#4A5070",
            }}
          >
            <span>
              <span style={{ fontWeight: 600, fontFamily: "'Orbitron', monospace", fontSize: 12, color: "#00FFFF", textShadow: "0 0 6px rgba(0,255,255,0.15)" }}>
                {totalTerms}
              </span>{" "}
              {ht.terms}
            </span>
            <div className="hidden sm:block" style={{ width: 1, height: 14, background: "rgba(0,255,255,0.08)" }} />
            <span>
              <span style={{ fontWeight: 600, fontFamily: "'Orbitron', monospace", fontSize: 12, color: "#BD00FF", textShadow: "0 0 6px rgba(189,0,255,0.15)" }}>
                {totalCategories}
              </span>{" "}
              {ht.categories}
            </span>
            <div className="hidden sm:block" style={{ width: 1, height: 14, background: "rgba(0,255,255,0.08)" }} />
            <span>
              <span style={{ fontWeight: 600, fontFamily: "'Orbitron', monospace", fontSize: 12, color: "#14F195", textShadow: "0 0 6px rgba(20,241,149,0.15)" }}>
                3
              </span>{" "}
              {ht.languages}
            </span>
            <div className="hidden sm:block" style={{ width: 1, height: 14, background: "rgba(0,255,255,0.08)" }} />
            <span>
              <span style={{ fontWeight: 600, fontFamily: "'Orbitron', monospace", fontSize: 12, color: "#FF003F", textShadow: "0 0 6px rgba(255,0,63,0.15)" }}>
                4
              </span>{" "}
              {ht.aiGuides}
            </span>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN — Desktop only (with floating orbs) ═══ */}
        <div className="hidden lg:flex flex-col items-center flex-shrink-0 relative" style={{ width: 440 }}>
          {heroImageBlock}

          {/* ─── Floating Personality Orbs ─── */}
          {PERSONALITIES.map((p, i) => (
            <FloatingOrb
              key={p.id}
              p={p}
              i={i}
              isLocked={!unlockedIds.includes(p.id)}
              isActive={p.id === personality}
              orbPosition={orbPositions[i]}
              onSwitch={() => switchPersonality(p.id)}
              onLockModal={() => setLockedModal(p)}
            />
          ))}
        </div>
      </div>

      {/* ═══ PORTAL MODAL — Locked Personality ═══ */}
      {lockedModal &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
            onClick={() => setLockedModal(null)}
          >
            <div
              className="relative p-6 sm:p-8 max-w-sm w-full text-center"
              style={{
                background: "var(--bg-1)",
                border: "1px solid var(--border)",
                clipPath: CHAMFER_20,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Silhouette */}
              <div
                className="mx-auto mb-5 flex items-center justify-center relative"
                style={{
                  width: 80,
                  height: 80,
                  clipPath: CHAMFER_8,
                  background: "var(--surface-2)",
                  boxShadow: `0 0 30px ${lockedModal.color}20`,
                }}
              >
                <span className="text-4xl" style={{ filter: "grayscale(1) brightness(0.3)" }}>
                  {lockedModal.emoji}
                </span>
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center text-xs"
                  style={{
                    background: "var(--surface-3)",
                    clipPath: CHAMFER_4,
                    boxShadow: "inset 0 0 0 1px var(--border)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF003F" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-orbitron)",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  color: "#FF003F",
                  textShadow: "0 0 10px rgba(255,0,63,0.5)",
                  marginBottom: 4,
                }}
              >
                UNLOCK NOW
              </div>
              <h3
                className="text-xl font-bold text-text-primary mb-4"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                {lockedModal.name}
              </h3>

              <div
                className="p-4 mb-6"
                style={{
                  background: "var(--surface-1)",
                  clipPath: CHAMFER_8,
                  border: "none",
                  boxShadow: "inset 0 0 0 1px var(--border)",
                }}
              >
                <div
                  className="text-text-muted uppercase tracking-wider mb-3"
                  style={{ fontFamily: "var(--font-fira-code)", fontSize: 9, letterSpacing: "0.1em" }}
                >
                  HOW_TO_UNLOCK
                </div>
                {(() => {
                  const unlockInfo = getUnlockProgress(progress).find((p) => p.id === lockedModal.id);
                  const meta = PERSONALITY_META.find((p) => p.id === lockedModal.id);
                  if (!unlockInfo || !meta) {
                    return (
                      <p className="text-text-secondary text-sm" style={{ fontFamily: "var(--font-fira-code)" }}>
                        {getUnlockRequirement(lockedModal.id)}
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {unlockInfo.paths.map((path) => {
                        const pct = Math.min((path.current / path.required) * 100, 100);
                        return (
                          <div key={path.gameId}>
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className="text-text-secondary text-xs"
                                style={{ fontFamily: "var(--font-fira-code)" }}
                              >
                                {path.label}
                              </span>
                              <span
                                className="text-xs"
                                style={{
                                  fontFamily: "var(--font-fira-code)",
                                  color: path.met ? meta.color : "var(--text-muted)",
                                }}
                              >
                                {path.current}/{path.required}
                              </span>
                            </div>
                            <div
                              className="w-full h-1.5 overflow-hidden"
                              style={{
                                background: "var(--surface-3)",
                                clipPath: CHAMFER_4,
                              }}
                            >
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: path.met
                                    ? meta.color
                                    : `linear-gradient(90deg, ${meta.color}80, ${meta.color})`,
                                  boxShadow: path.met ? `0 0 8px ${meta.shadow}` : "none",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <p
                        className="text-text-muted text-[10px] text-center pt-1"
                        style={{ fontFamily: "var(--font-fira-code)" }}
                      >
                        Complete ANY path to unlock
                      </p>
                    </div>
                  );
                })()}
              </div>

              <Link
                href="/games"
                className="inline-flex items-center gap-2 text-sm py-2.5 px-8 font-semibold transition-all duration-150"
                style={{
                  fontFamily: "var(--font-orbitron)",
                  color: "#00FFFF",
                  border: "1.5px solid #00FFFF",
                  borderRadius: 3,
                  background: "transparent",
                  letterSpacing: "0.08em",
                  boxShadow: "0 0 14px rgba(0,255,255,0.25), inset 0 0 8px rgba(0,255,255,0.06)",
                }}
                onClick={() => setLockedModal(null)}
              >
                PLAY GAMES
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <button
                onClick={() => setLockedModal(null)}
                className="absolute top-5 right-5 text-text-muted hover:text-text-primary transition-colors duration-150"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ═══ Keyframe Animations (injected once) ═══ */}
      <style jsx global>{`
        @keyframes glitch-flicker {
          0%, 92%, 100% { opacity: 1; text-shadow: 0 0 20px rgba(0,255,255,0.6), 0 0 40px rgba(0,255,255,0.3); }
          93% { opacity: 0.8; text-shadow: -2px 0 #FF003F, 2px 0 #00FFFF; }
          94% { opacity: 1; text-shadow: 0 0 20px rgba(0,255,255,0.6); }
          95% { opacity: 0.9; text-shadow: 2px 0 #FF003F, -1px 0 #00FFFF; }
          96% { opacity: 1; }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 4px rgba(0,255,255,0.4); }
          50% { opacity: 1; box-shadow: 0 0 8px rgba(0,255,255,0.9); }
        }

        @keyframes pulse-text {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; text-shadow: 0 0 16px rgba(255,0,63,0.7); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
