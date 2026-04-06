"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { SkinUnlockDef } from "@/lib/unlocks";
import { PERSONALITIES } from "@/lib/personalities";

/* ─── Locale helpers (same pattern as hero-section) ────────── */

function subscribeLocale(cb: () => void) {
  window.addEventListener("locale-change", cb);
  return () => window.removeEventListener("locale-change", cb);
}

function getLocaleSnapshot() {
  const saved = localStorage.getItem("solana-wtf-locale");
  return saved && ["en", "pt", "es"].includes(saved) ? saved : "en";
}

function getLocaleServerSnapshot() {
  return "en";
}

/* ─── i18n ─────────────────────────────────────────────────── */

const REVEAL_I18N: Record<
  string,
  {
    title: string;
    desc: (name: string, skin: string) => string;
    tap: string;
  }
> = {
  en: {
    title: "NEW SKIN UNLOCKED",
    desc: (name, skin) => `${skin} skin for ${name}`,
    tap: "TAP TO CONTINUE",
  },
  pt: {
    title: "NOVA SKIN DESBLOQUEADA",
    desc: (name, skin) => `Skin ${skin} para ${name}`,
    tap: "TOQUE PARA CONTINUAR",
  },
  es: {
    title: "NUEVA SKIN DESBLOQUEADA",
    desc: (name, skin) => `Skin ${skin} para ${name}`,
    tap: "TOCA PARA CONTINUAR",
  },
};

/* ─── Constants ────────────────────────────────────────────── */

const CHAMFER_12 =
  "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

const AUTO_DISMISS_MS = 5000;
const FADE_OUT_MS = 400;

/* ─── Component ────────────────────────────────────────────── */

type Phase = "idle" | "in" | "visible" | "out";

export default function SkinRevealOverlay() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [skin, setSkin] = useState<SkinUnlockDef | null>(null);
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getLocaleServerSnapshot
  );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const dismiss = useCallback(() => {
    if (phase !== "in" && phase !== "visible") return;
    setPhase("out");
  }, [phase]);

  // Listen for skin unlock events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SkinUnlockDef>).detail;
      setSkin(detail);
      setPhase("in");
    };
    window.addEventListener("solana-wtf-skin-unlock", handler);
    return () => window.removeEventListener("solana-wtf-skin-unlock", handler);
  }, []);

  // Transition "in" → "visible" after entrance animations
  useEffect(() => {
    if (phase !== "in") return;
    const t = setTimeout(() => setPhase("visible"), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  // Auto-dismiss after 5s from visible
  useEffect(() => {
    if (phase !== "visible") return;
    const t = setTimeout(dismiss, AUTO_DISMISS_MS - 1500);
    return () => clearTimeout(t);
  }, [phase, dismiss]);

  // Fade out → idle
  useEffect(() => {
    if (phase !== "out") return;
    const t = setTimeout(() => {
      setPhase("idle");
      setSkin(null);
    }, FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Pre-compute sparkle positions so we don't call Math.random during render
  const sparkles = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        left: 10 + Math.random() * 80,
        top: 10 + Math.random() * 80,
        dur: 1.5 + Math.random() * 2,
        delay: Math.random() * 2,
      })),
    // Regenerate when a new skin reveal starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skin?.skinId, skin?.personalityId]
  );

  if (!mounted || phase === "idle" || !skin) return null;

  const personality = PERSONALITIES.find((p) => p.id === skin.personalityId);
  const color = personality?.color ?? "#00FFFF";
  const name = personality?.name ?? skin.personalityId;
  const i18n = REVEAL_I18N[locale] ?? REVEAL_I18N.en;
  const isOut = phase === "out";

  return createPortal(
    <div
      onClick={dismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: "rgba(10,11,16,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: isOut ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS}ms ease`,
        animation: isOut ? undefined : "skinRevealBackdropIn 300ms ease forwards",
      }}
    >
      {/* Particle / sparkle background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {sparkles.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: color,
              opacity: 0,
              left: `${s.left}%`,
              top: `${s.top}%`,
              animation: `skinSparkle ${s.dur}s ${s.delay}s infinite ease-in-out`,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        ))}
      </div>

      {/* Title — "NEW SKIN UNLOCKED" */}
      <div
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "clamp(1.2rem, 4vw, 2.2rem)",
          fontWeight: 900,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color,
          textShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
          marginBottom: 32,
          opacity: 0,
          animation: "skinTitleGlitch 400ms 300ms ease forwards",
          position: "relative",
        }}
      >
        {i18n.title}
        {/* Scanline on title */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
          }}
        />
      </div>

      {/* Skin image with chamfered frame */}
      <div
        style={{
          position: "relative",
          width: "clamp(200px, 50vw, 340px)",
          aspectRatio: "3/4",
          opacity: 0,
          animation: "skinImageReveal 600ms 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* HUD corner marks */}
        <HudCorners color={color} />

        {/* Glow pulse behind image */}
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: 16,
            background: `radial-gradient(ellipse at center, ${color}33 0%, transparent 70%)`,
            animation: "skinGlowPulse 2s infinite ease-in-out",
            pointerEvents: "none",
          }}
        />

        {/* Image frame */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            clipPath: CHAMFER_12,
            overflow: "hidden",
            border: `2px solid ${color}44`,
          }}
        >
          <Image
            src={skin.src}
            alt={`${name} — ${skin.label}`}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          {/* Scanline overlay on image */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.015) 2px, rgba(0,255,255,0.015) 4px)",
              mixBlendMode: "overlay",
            }}
          />
        </div>
      </div>

      {/* Name + Skin label */}
      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          opacity: 0,
          animation: "skinTextFade 400ms 1200ms ease forwards",
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(1rem, 3vw, 1.5rem)",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.08em",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(0.75rem, 2vw, 1rem)",
            fontWeight: 500,
            color,
            letterSpacing: "0.12em",
            marginTop: 4,
          }}
        >
          {skin.label}
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          marginTop: 12,
          fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
          color: "rgba(255,255,255,0.6)",
          opacity: 0,
          animation: "skinTextFade 400ms 1500ms ease forwards",
        }}
      >
        {i18n.desc(name, skin.label)}
      </div>

      {/* TAP TO CONTINUE */}
      <div
        style={{
          marginTop: 40,
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.35)",
          opacity: 0,
          animation: "skinTapPulse 2s 1500ms ease-in-out infinite",
        }}
      >
        {i18n.tap}
      </div>

      {/* Keyframes injected as <style> */}
      <style>{`
        @keyframes skinRevealBackdropIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }

        @keyframes skinTitleGlitch {
          0%   { opacity: 0; transform: translateY(-10px) scaleX(1.3); filter: blur(6px) }
          30%  { opacity: 1; transform: translateY(2px) scaleX(0.97); filter: blur(0) }
          50%  { transform: translateX(-3px) scaleX(1.02) }
          70%  { transform: translateX(2px) scaleX(0.99) }
          100% { opacity: 1; transform: translateY(0) scaleX(1); filter: blur(0) }
        }

        @keyframes skinImageReveal {
          0%   { opacity: 0; transform: scale(0.3) }
          60%  { opacity: 1; transform: scale(1.05) }
          100% { opacity: 1; transform: scale(1) }
        }

        @keyframes skinGlowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1) }
          50%      { opacity: 1;   transform: scale(1.08) }
        }

        @keyframes skinTextFade {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }

        @keyframes skinTapPulse {
          0%   { opacity: 0 }
          20%  { opacity: 0.5 }
          50%  { opacity: 0.5 }
          80%  { opacity: 0.2 }
          100% { opacity: 0 }
        }

        @keyframes skinSparkle {
          0%, 100% { opacity: 0; transform: scale(0) }
          50%      { opacity: 0.8; transform: scale(1) }
        }
      `}</style>
    </div>,
    document.body
  );
}

/* ─── HUD Corner Marks ─────────────────────────────────────── */

function HudCorners({ color }: { color: string }) {
  const size = 16;
  const thickness = 2;
  const offset = -6;
  const style = { position: "absolute" as const, pointerEvents: "none" as const };

  return (
    <>
      {/* Top-left */}
      <div style={{ ...style, top: offset, left: offset }}>
        <div style={{ width: size, height: thickness, background: color }} />
        <div style={{ width: thickness, height: size, background: color }} />
      </div>
      {/* Top-right */}
      <div style={{ ...style, top: offset, right: offset }}>
        <div style={{ width: size, height: thickness, background: color, marginLeft: "auto" }} />
        <div style={{ width: thickness, height: size, background: color, marginLeft: "auto" }} />
      </div>
      {/* Bottom-left */}
      <div style={{ ...style, bottom: offset, left: offset, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ width: thickness, height: size, background: color }} />
        <div style={{ width: size, height: thickness, background: color }} />
      </div>
      {/* Bottom-right */}
      <div style={{ ...style, bottom: offset, right: offset, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end" }}>
        <div style={{ width: thickness, height: size, background: color, marginLeft: "auto" }} />
        <div style={{ width: size, height: thickness, background: color, marginLeft: "auto" }} />
      </div>
    </>
  );
}
