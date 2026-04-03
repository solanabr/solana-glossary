// Vite: import JSON files statically (bundled at build time)
import aiMl from "../node_modules/@stbr/solana-glossary/data/terms/ai-ml.json";
import blockchainGeneral from "../node_modules/@stbr/solana-glossary/data/terms/blockchain-general.json";
import coreProtocol from "../node_modules/@stbr/solana-glossary/data/terms/core-protocol.json";
import defi from "../node_modules/@stbr/solana-glossary/data/terms/defi.json";
import devTools from "../node_modules/@stbr/solana-glossary/data/terms/dev-tools.json";
import infrastructure from "../node_modules/@stbr/solana-glossary/data/terms/infrastructure.json";
import network from "../node_modules/@stbr/solana-glossary/data/terms/network.json";
import programmingFundamentals from "../node_modules/@stbr/solana-glossary/data/terms/programming-fundamentals.json";
import programmingModel from "../node_modules/@stbr/solana-glossary/data/terms/programming-model.json";
import security from "../node_modules/@stbr/solana-glossary/data/terms/security.json";
import solanaEcosystem from "../node_modules/@stbr/solana-glossary/data/terms/solana-ecosystem.json";
import tokenEcosystem from "../node_modules/@stbr/solana-glossary/data/terms/token-ecosystem.json";
import web3 from "../node_modules/@stbr/solana-glossary/data/terms/web3.json";
import zkCompression from "../node_modules/@stbr/solana-glossary/data/terms/zk-compression.json";

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

export const ALL_TERMS: GlossaryTerm[] = [
  ...(aiMl as GlossaryTerm[]),
  ...(blockchainGeneral as GlossaryTerm[]),
  ...(coreProtocol as GlossaryTerm[]),
  ...(defi as GlossaryTerm[]),
  ...(devTools as GlossaryTerm[]),
  ...(infrastructure as GlossaryTerm[]),
  ...(network as GlossaryTerm[]),
  ...(programmingFundamentals as GlossaryTerm[]),
  ...(programmingModel as GlossaryTerm[]),
  ...(security as GlossaryTerm[]),
  ...(solanaEcosystem as GlossaryTerm[]),
  ...(tokenEcosystem as GlossaryTerm[]),
  ...(web3 as GlossaryTerm[]),
  ...(zkCompression as GlossaryTerm[]),
];

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

export const CATEGORY_LABELS: Record<Category, string> = {
  "core-protocol":            "Core Protocol",
  "programming-model":        "Programming Model",
  "token-ecosystem":          "Token Ecosystem",
  defi:                       "DeFi",
  "zk-compression":           "ZK Compression",
  infrastructure:             "Infrastructure",
  security:                   "Security",
  "dev-tools":                "Dev Tools",
  network:                    "Network",
  "blockchain-general":       "Blockchain General",
  web3:                       "Web3",
  "programming-fundamentals": "Programming Fundamentals",
  "ai-ml":                    "AI / ML",
  "solana-ecosystem":         "Solana Ecosystem",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  "core-protocol":            "⛓️",
  "programming-model":        "🧩",
  "token-ecosystem":          "🪙",
  defi:                       "💱",
  "zk-compression":           "🔐",
  infrastructure:             "🏗️",
  security:                   "🛡️",
  "dev-tools":                "🛠️",
  network:                    "🌐",
  "blockchain-general":       "📦",
  web3:                       "🕸️",
  "programming-fundamentals": "📐",
  "ai-ml":                    "🤖",
  "solana-ecosystem":         "🌊",
};

export function getTermsByCategory(cat: Category): GlossaryTerm[] {
  return ALL_TERMS.filter((t) => t.category === cat);
}
