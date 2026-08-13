// Shared config — safe to import in client AND server components (no fs/path)

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

export type Locale = "en" | "pt" | "es";

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

export const CATEGORY_LABELS: Record<Category, Record<Locale, string>> = {
  "core-protocol":            { en: "Core Protocol",              pt: "Protocolo Central",          es: "Protocolo Central" },
  "programming-model":        { en: "Programming Model",          pt: "Modelo de Programação",      es: "Modelo de Programación" },
  "token-ecosystem":          { en: "Token Ecosystem",            pt: "Ecossistema de Tokens",      es: "Ecosistema de Tokens" },
  defi:                       { en: "DeFi",                       pt: "DeFi",                       es: "DeFi" },
  "zk-compression":           { en: "ZK Compression",             pt: "ZK Compression",             es: "ZK Compression" },
  infrastructure:             { en: "Infrastructure",             pt: "Infraestrutura",             es: "Infraestructura" },
  security:                   { en: "Security",                   pt: "Segurança",                  es: "Seguridad" },
  "dev-tools":                { en: "Dev Tools",                  pt: "Ferramentas de Dev",         es: "Herramientas Dev" },
  network:                    { en: "Network",                    pt: "Rede",                       es: "Red" },
  "blockchain-general":       { en: "Blockchain General",         pt: "Blockchain Geral",           es: "Blockchain General" },
  web3:                       { en: "Web3",                       pt: "Web3",                       es: "Web3" },
  "programming-fundamentals": { en: "Programming Fundamentals",   pt: "Fundamentos de Programação", es: "Fundamentos de Programación" },
  "ai-ml":                    { en: "AI / ML",                    pt: "IA / ML",                    es: "IA / ML" },
  "solana-ecosystem":         { en: "Solana Ecosystem",           pt: "Ecossistema Solana",         es: "Ecosistema Solana" },
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
