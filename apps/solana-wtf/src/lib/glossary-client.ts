// Client-side glossary data — pre-loaded from server via props or API
// This file provides types and utilities for client components

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  related?: string[];
  aliases?: string[];
}

export const CATEGORY_LABELS: Record<string, string> = {
  "ai-ml": "AI & ML",
  "blockchain-general": "Blockchain",
  "core-protocol": "Core Protocol",
  defi: "DeFi",
  "dev-tools": "Dev Tools",
  infrastructure: "Infrastructure",
  network: "Network",
  "programming-fundamentals": "Programming",
  "programming-model": "Solana Programming",
  security: "Security",
  "solana-ecosystem": "Ecosystem",
  "token-ecosystem": "Tokens",
  web3: "Web3",
  "zk-compression": "ZK & Compression",
};
