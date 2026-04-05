/**
 * @arquivo themes.ts
 * @descricao Configuracao dos 3 tabuleiros + estilos visuais por tema
 * @projeto Solana Glossary — Jogo da Vida Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import type { BoardConfig, BoardThemeId, SpaceType } from "./types";

interface SpaceStyle {
  border: string;
  bg: string;
  glow: string;
}

export interface ThemeVisual {
  pageBg: string;
  spaceRadius: string;
  fontClass: string;
  hudAccent: string;
  hudBorder: string;
  timerColors: [string, string, string];
  spaceStyles: Record<SpaceType, SpaceStyle>;
}

const ss = (border: string, bg: string, glow: string): SpaceStyle => ({
  border,
  bg,
  glow,
});

const neon = (c: string) => `shadow-[0_0_12px_${c}]`;

export const THEME_VISUALS: Record<BoardThemeId, ThemeVisual> = {
  normie: {
    pageBg: "bg-[#0a0018]",
    spaceRadius: "rounded-xl",
    fontClass: "font-mono",
    hudAccent: "text-cyan-400",
    hudBorder: "border-cyan-400/30",
    timerColors: ["bg-cyan-400", "bg-yellow-400", "bg-red-400"],
    spaceStyles: {
      start: ss(
        "border-green-400",
        "bg-green-400/10",
        neon("rgba(74,222,128,0.5)"),
      ),
      finish: ss(
        "border-yellow-400",
        "bg-yellow-400/10",
        neon("rgba(250,204,21,0.5)"),
      ),
      normal: ss("border-gray-600/40", "bg-slate-900/30", "shadow-none"),
      event: ss(
        "border-purple-400",
        "bg-purple-400/10",
        neon("rgba(192,132,252,0.6)"),
      ),
      challenge: ss(
        "border-cyan-400",
        "bg-cyan-400/10",
        neon("rgba(34,211,238,0.6)"),
      ),
      bonus: ss(
        "border-yellow-400",
        "bg-yellow-400/10",
        neon("rgba(250,204,21,0.4)"),
      ),
      trap: ss(
        "border-red-400",
        "bg-red-400/10",
        neon("rgba(248,113,113,0.5)"),
      ),
    },
  },
  startup: {
    pageBg: "bg-[#000a00]",
    spaceRadius: "rounded-none",
    fontClass: "font-mono text-green-400",
    hudAccent: "text-emerald-400",
    hudBorder: "border-emerald-500/30",
    timerColors: ["bg-emerald-400", "bg-green-300", "bg-green-700"],
    spaceStyles: {
      start: ss("border-green-300", "bg-green-300/10", "shadow-none"),
      finish: ss("border-lime-400", "bg-lime-400/10", "shadow-none"),
      normal: ss("border-green-900/60", "bg-green-950/40", "shadow-none"),
      event: ss("border-green-500", "bg-green-500/10", "shadow-none"),
      challenge: ss("border-green-400", "bg-green-400/10", "shadow-none"),
      bonus: ss("border-lime-400", "bg-lime-400/10", "shadow-none"),
      trap: ss("border-green-700", "bg-green-900/30", "shadow-none"),
    },
  },
  timeline: {
    pageBg: "bg-[#120810]",
    spaceRadius: "rounded-sm",
    fontClass: "font-['Press_Start_2P']",
    hudAccent: "text-orange-400",
    hudBorder: "border-orange-400/30",
    timerColors: ["bg-orange-400", "bg-amber-400", "bg-red-500"],
    spaceStyles: {
      start: ss("border-2 border-green-500", "bg-green-500/20", "shadow-none"),
      finish: ss(
        "border-2 border-yellow-500",
        "bg-yellow-500/20",
        "shadow-none",
      ),
      normal: ss("border-2 border-gray-600", "bg-gray-900/40", "shadow-none"),
      event: ss("border-2 border-pink-400", "bg-pink-400/20", "shadow-none"),
      challenge: ss(
        "border-2 border-amber-400",
        "bg-amber-400/20",
        "shadow-none",
      ),
      bonus: ss(
        "border-2 border-yellow-400",
        "bg-yellow-400/20",
        "shadow-none",
      ),
      trap: ss("border-2 border-red-500", "bg-red-500/20", "shadow-none"),
    },
  },
};

const BOARD_CONFIGS: Record<BoardThemeId, BoardConfig> = {
  normie: {
    id: "normie",
    totalSpaces: 50,
    eventFrequency: 4,
    challengeFrequency: 6,
    categories: [
      "blockchain-general",
      "core-protocol",
      "network",
      "infrastructure",
    ],
  },
  startup: {
    id: "startup",
    totalSpaces: 50,
    eventFrequency: 4,
    challengeFrequency: 6,
    categories: ["token-ecosystem", "defi", "web3", "solana-ecosystem"],
  },
  timeline: {
    id: "timeline",
    totalSpaces: 50,
    eventFrequency: 4,
    challengeFrequency: 6,
    categories: [
      "programming-model",
      "dev-tools",
      "programming-fundamentals",
      "security",
    ],
  },
};

export const BOARD_THEMES = Object.values(BOARD_CONFIGS);

export function getBoardConfig(theme: BoardThemeId): BoardConfig {
  return BOARD_CONFIGS[theme];
}
