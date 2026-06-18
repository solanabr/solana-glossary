export const CATEGORY_COLORS: Record<string, string> = {
  "core-protocol": "#9945FF",
  "programming-model": "#14F195",
  "token-ecosystem": "#F5A623",
  defi: "#00C2FF",
  "zk-compression": "#FF6B6B",
  infrastructure: "#4ECDC4",
  security: "#FF4757",
  "dev-tools": "#FFA502",
  network: "#2ED573",
  "blockchain-general": "#A29BFE",
  web3: "#74B9FF",
  "programming-fundamentals": "#55EFC4",
  "ai-ml": "#FD79A8",
  "solana-ecosystem": "#FDCB6E",
};

export const DEFAULT_COLOR = "#888888";

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}
