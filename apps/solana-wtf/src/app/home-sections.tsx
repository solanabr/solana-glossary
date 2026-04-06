"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  i18n                                                                */
/* ------------------------------------------------------------------ */

const T: Record<string, Record<string, string>> = {
  en: {
    browseByCategory: "Browse by category",
    learnByPlaying: "Learn by playing",
    games: "GAMES",
    dailyName: "WTF Daily",
    dailyDesc: "Guess the term from a censored definition",
    speedrunName: "Speed Run",
    speedrunDesc: "60s. Select the right term. Go.",
    connectionsName: "Connections",
    connectionsDesc: "Group terms by their relationships",
    blitzName: "Category Blitz",
    blitzDesc: "Sort terms into categories. Fast.",
  },
  pt: {
    browseByCategory: "Navegar por categoria",
    learnByPlaying: "Aprenda jogando",
    games: "JOGOS",
    dailyName: "WTF Diário",
    dailyDesc: "Adivinhe o termo pela definição censurada",
    speedrunName: "Speed Run",
    speedrunDesc: "60s. Selecione o termo correto. Vai.",
    connectionsName: "Conexões",
    connectionsDesc: "Agrupe termos por suas relações",
    blitzName: "Blitz de Categorias",
    blitzDesc: "Classifique termos em categorias. Rápido.",
  },
  es: {
    browseByCategory: "Explorar por categoría",
    learnByPlaying: "Aprende jugando",
    games: "JUEGOS",
    dailyName: "WTF Diario",
    dailyDesc: "Adivina el término por la definición censurada",
    speedrunName: "Speed Run",
    speedrunDesc: "60s. Selecciona el término correcto. Ya.",
    connectionsName: "Conexiones",
    connectionsDesc: "Agrupa términos por sus relaciones",
    blitzName: "Blitz de Categorías",
    blitzDesc: "Clasifica términos en categorías. Rápido.",
  },
};

const GAMES = [
  { id: "daily", nameKey: "dailyName", descKey: "dailyDesc", icon: "❓", color: "#BD00FF" },
  { id: "speedrun", nameKey: "speedrunName", descKey: "speedrunDesc", icon: "⚡", color: "#14F195" },
  { id: "connections", nameKey: "connectionsName", descKey: "connectionsDesc", icon: "🔗", color: "#00FFFF" },
  { id: "blitz", nameKey: "blitzName", descKey: "blitzDesc", icon: "🏷️", color: "#00FFA3" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

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

interface HomeSectionsProps {
  categories: string[];
  categoryLabels: Record<string, string>;
}

export default function HomeSections({ categories, categoryLabels }: HomeSectionsProps) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleServerSnapshot);

  const t = T[locale] || T.en;

  return (
    <>
      {/* ============================================ */}
      {/* CATEGORIES                                   */}
      {/* ============================================ */}
      <section className="relative z-10 px-4 sm:px-8 pb-10 sm:pb-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <h2
            className="font-[family-name:var(--font-label)] text-base font-semibold text-text-secondary uppercase"
            style={{ letterSpacing: "3px" }}
          >
            {t.browseByCategory}
          </h2>
          <span
            className="font-[family-name:var(--font-title)] text-[10px] px-2 py-1 font-bold"
            style={{
              color: "#00FFFF",
              border: "1px solid #00FFFF",
              textShadow: "0 0 6px rgba(0,255,255,0.4)",
              boxShadow: "0 0 8px rgba(0,255,255,0.15)",
              clipPath:
                "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
            }}
          >
            {categories.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {categories.map((cat) => (
            <Link href={`/glossary?category=${cat}`} key={cat}>
              <span className="category-pill">
                {categoryLabels[cat] || cat}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* GAMES                                        */}
      {/* ============================================ */}
      <section className="relative z-10 px-4 sm:px-8 pb-12 sm:pb-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <h2
            className="font-[family-name:var(--font-label)] text-base font-semibold text-text-secondary uppercase"
            style={{ letterSpacing: "3px" }}
          >
            {t.learnByPlaying}
          </h2>
          <span
            className="font-[family-name:var(--font-title)] text-[10px] px-2 py-1 font-bold"
            style={{
              color: "#14F195",
              border: "1px solid #14F195",
              textShadow: "0 0 6px rgba(20,241,149,0.4)",
              boxShadow: "0 0 8px rgba(20,241,149,0.15)",
              clipPath:
                "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
            }}
          >
            {`4 ${t.games}`}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GAMES.map((g) => (
            <Link href={`/games/${g.id}`} key={g.id}>
              <div
                className="game-card"
                style={{
                  "--card-accent": g.color,
                  "--card-glow": `${g.color}25`,
                } as React.CSSProperties}
              >
                {/* Icon area */}
                <div
                  className="game-icon-area h-16 flex items-center justify-center mb-3.5"
                  style={{
                    background: "var(--surface-2)",
                    clipPath:
                      "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{g.icon}</span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: g.color,
                    marginBottom: 6,
                  }}
                >
                  {t[g.nameKey]}
                </h3>
                <p
                  style={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: 10,
                    color: "#4A5070",
                    lineHeight: 1.6,
                  }}
                >
                  {t[g.descKey]}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
