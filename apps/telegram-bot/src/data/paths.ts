export interface LearningPath {
  id: string;
  emoji: string;
  nameKey: string;
  descKey: string;
  termIds: string[];
}

export interface PathProgress {
  step: number;
  completed: boolean;
  total: number;
  started: boolean;
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "solana-basics",
    emoji: "⚡",
    nameKey: "path-name-solana-basics",
    descKey: "path-desc-solana-basics",
    termIds: [
      "proof-of-history",
      "slot",
      "block",
      "epoch",
      "leader-schedule",
      "validator",
      "tower-bft",
      "turbine",
    ],
  },
  {
    id: "defi-foundations",
    emoji: "💰",
    nameKey: "path-name-defi-foundations",
    descKey: "path-desc-defi-foundations",
    termIds: [
      "amm",
      "liquidity-pool",
      "swap",
      "slippage",
      "dex",
      "yield-farming",
      "impermanent-loss",
    ],
  },
  {
    id: "builders-path",
    emoji: "🔨",
    nameKey: "path-name-builders-path",
    descKey: "path-desc-builders-path",
    termIds: [
      "program",
      "account",
      "pda",
      "spl-token",
      "anchor",
      "cpi",
      "compute-units",
      "rent",
    ],
  },
];

const pathMap = new Map(LEARNING_PATHS.map((path) => [path.id, path]));

export function getLearningPath(pathId: string): LearningPath | undefined {
  return pathMap.get(pathId);
}
