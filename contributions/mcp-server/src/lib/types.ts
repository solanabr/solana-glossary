export type Category =
  | "core-protocol"
  | "programming-model"
  | "token-ecosystem"
  | "defi"
  | "zk-compression"
  | "infrastructure"
  | "security"
  | "dev-tools"
  | "network"
  | "blockchain-general"
  | "web3"
  | "programming-fundamentals"
  | "ai-ml"
  | "solana-ecosystem";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: Category;
  related?: string[];
  aliases?: string[];
}

export const CATEGORIES: Category[] = [
  "core-protocol",
  "programming-model",
  "token-ecosystem",
  "defi",
  "zk-compression",
  "infrastructure",
  "security",
  "dev-tools",
  "network",
  "blockchain-general",
  "web3",
  "programming-fundamentals",
  "ai-ml",
  "solana-ecosystem",
];
