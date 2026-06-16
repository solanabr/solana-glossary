"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";

const HERO_IMAGES: Record<string, string> = {
  maid: "/personalities/maidchain-herodarkcyber.png",
  dm: "/personalities/dedmaster-herodarkcyber.png",
  degen: "/personalities/degensensei-herocyber.png",
  glados: "/personalities/GLaDOS-herocyber.png",
};

const PERSONALITIES = [
  { id: "maid", emoji: "🎀", color: "#ff6b9d", shadow: "rgba(255,107,157,0.4)", bg: "linear-gradient(135deg, #ff6b9d, #c850c0)" },
  { id: "degen", emoji: "🦍", color: "#14F195", shadow: "rgba(20,241,149,0.4)", bg: "linear-gradient(135deg, #14F195, #0ea572)" },
  { id: "glados", emoji: "🤖", color: "#03E1FF", shadow: "rgba(3,225,255,0.4)", bg: "linear-gradient(135deg, #03E1FF, #0066ff)" },
  { id: "dm", emoji: "🐉", color: "#DC1FFF", shadow: "rgba(220,31,255,0.4)", bg: "linear-gradient(135deg, #DC1FFF, #9945ff)" },
];

export default function HeroImage() {
  const [activeId, setActiveId] = useState("maid");
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false);

  const heroSrc = HERO_IMAGES[activeId];

  return (
    <div className="hidden lg:flex flex-shrink-0 w-[440px] h-[440px] relative">
      {/* Main image container */}
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden animate-float"
        style={{
          background: "linear-gradient(135deg, rgba(153,69,255,0.08), rgba(20,241,149,0.05))",
          border: "1px solid rgba(153,69,255,0.15)",
        }}
      >
        {heroSrc && loaded ? (
          <Image
            src={heroSrc}
            alt={activeId === "maid" ? "Maid-chan" : "DnD Master"}
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl">🖥️</span>
          </div>
        )}
      </div>

      {/* Personality selector floating circles */}
      {PERSONALITIES.map((p, i) => {
        const positions = [
          { top: "5%", left: "-8%" },
          { top: "15%", right: "-8%" },
          { bottom: "25%", left: "-5%" },
          { bottom: "10%", right: "-5%" },
        ];
        const hasImage = !!HERO_IMAGES[p.id];
        const isActive = p.id === activeId;

        return (
          <button
            key={p.id}
            onClick={() => hasImage && setActiveId(p.id)}
            className="absolute w-12 h-12 rounded-full flex items-center justify-center text-xl animate-float transition-all duration-300"
            style={{
              ...positions[i],
              background: p.bg,
              boxShadow: isActive
                ? `0 0 24px ${p.shadow}, 0 0 40px ${p.shadow}`
                : `0 0 12px ${p.shadow}`,
              animationDelay: `${i * 0.6}s`,
              outline: isActive ? `2px solid ${p.color}` : "2px solid transparent",
              outlineOffset: "2px",
              cursor: hasImage ? "pointer" : "default",
              opacity: hasImage ? 1 : 0.5,
            } as React.CSSProperties}
          >
            {p.emoji}
          </button>
        );
      })}
    </div>
  );
}
