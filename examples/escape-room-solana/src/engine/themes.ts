/**
 * @arquivo themes.ts
 * @descricao Configuracao dos temas, niveis e mapeamento de categorias do SDK
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import type { Category } from "@stbr/solana-glossary";

/** Identificadores dos temas */
export type ThemeId = "genesis" | "defi" | "lab";

/** Identificadores dos niveis (metafora "profundidade no bloco") */
export type LevelId = "surface" | "confirmation" | "finality" | "consensus";

/** Configuracao de um nivel de dificuldade */
export interface LevelConfig {
  id: LevelId;
  label: string;
  timeSeconds: number;
  maxHints: number;
  hintPenalty: number;
  scoreMultiplier: number;
  termCount: number;
}

/** Configuracao de um tema */
export interface ThemeConfig {
  id: ThemeId;
  labelKey: string;
  categories: Category[];
  levels: LevelConfig[];
}

/** Niveis padrao — Surface e facil, Consensus e brutal */
const DEFAULT_LEVELS: LevelConfig[] = [
  {
    id: "surface",
    label: "Surface",
    timeSeconds: 300,
    maxHints: 3,
    hintPenalty: 50,
    scoreMultiplier: 1,
    termCount: 8,
  },
  {
    id: "confirmation",
    label: "Confirmation",
    timeSeconds: 240,
    maxHints: 2,
    hintPenalty: 75,
    scoreMultiplier: 1.5,
    termCount: 10,
  },
  {
    id: "finality",
    label: "Finality",
    timeSeconds: 180,
    maxHints: 1,
    hintPenalty: 100,
    scoreMultiplier: 2,
    termCount: 12,
  },
  {
    id: "consensus",
    label: "Consensus",
    timeSeconds: 120,
    maxHints: 0,
    hintPenalty: 0,
    scoreMultiplier: 3,
    termCount: 15,
  },
];

/** Os 3 temas do Escape Room com suas categorias do SDK */
export const THEMES: ThemeConfig[] = [
  {
    id: "genesis",
    labelKey: "escape.themes.genesis",
    categories: [
      "core-protocol",
      "blockchain-general",
      "network",
      "infrastructure",
    ],
    levels: DEFAULT_LEVELS,
  },
  {
    id: "defi",
    labelKey: "escape.themes.defi",
    categories: ["token-ecosystem", "defi", "web3", "solana-ecosystem"],
    levels: DEFAULT_LEVELS,
  },
  {
    id: "lab",
    labelKey: "escape.themes.lab",
    categories: [
      "programming-model",
      "dev-tools",
      "programming-fundamentals",
      "security",
      "zk-compression",
      "ai-ml",
    ],
    levels: DEFAULT_LEVELS,
  },
];

/** Busca configuracao de um tema pelo id */
export function getThemeConfig(themeId: ThemeId): ThemeConfig {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) throw new Error(`Tema desconhecido: ${themeId}`);
  return theme;
}

/** Busca configuracao de um nivel pelo id */
export function getLevelConfig(
  themeId: ThemeId,
  levelId: LevelId,
): LevelConfig {
  const theme = getThemeConfig(themeId);
  const level = theme.levels.find((l) => l.id === levelId);
  if (!level) throw new Error(`Nivel desconhecido: ${levelId}`);
  return level;
}
