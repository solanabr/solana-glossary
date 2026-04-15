/**
 * Curated learning paths that guide developers through glossary terms
 * in a structured, progressive order.
 */

export interface LearningPath {
  slug: string;
  title: string;
  titlePt: string;
  titleEs: string;
  description: string;
  descriptionPt: string;
  descriptionEs: string;
  icon: string;
  color: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  termIds: string[];
}

export const learningPaths: LearningPath[] = [
  {
    slug: "zero-to-solana",
    title: "Zero to Solana Developer",
    titlePt: "Do Zero ao Desenvolvedor Solana",
    titleEs: "De Cero a Desarrollador Solana",
    description:
      "Start from blockchain basics and progress to building on Solana. Perfect for developers new to web3.",
    descriptionPt:
      "Comece dos fundamentos de blockchain e progrida para construir na Solana. Perfeito para desenvolvedores novos no web3.",
    descriptionEs:
      "Comienza desde los fundamentos de blockchain y progresa hasta construir en Solana. Perfecto para desarrolladores nuevos en web3.",
    icon: "rocket",
    color: "#14F195",
    difficulty: "beginner",
    estimatedHours: 8,
    termIds: [
      // Block 1: Blockchain Foundations
      "blockchain",
      "distributed-ledger",
      "consensus-mechanism",
      "node",
      "block",
      "transaction",
      "hash",
      "cryptographic-hash-function",
      "public-key",
      "private-key",
      // Block 2: Solana Core
      "solana",
      "proof-of-history",
      "tower-bft",
      "slot",
      "epoch",
      "validator",
      "leader",
      "cluster",
      "lamport",
      "sol",
      // Block 3: Account Model
      "account",
      "account-model",
      "program",
      "instruction",
      "system-program",
      "rent",
      "rent-exemption",
      "owner",
      "signer",
      "program-derived-address",
      // Block 4: Dev Tools
      "solana-cli",
      "anchor-framework",
      "solana-playground",
      "explorer",
      "devnet",
      "testnet",
      "mainnet-beta",
      "airdrop",
      "rpc",
      "json-rpc",
    ],
  },
  {
    slug: "defi-deep-dive",
    title: "DeFi Deep Dive",
    titlePt: "Mergulho em DeFi",
    titleEs: "Inmersion en DeFi",
    description:
      "Understand decentralized finance from AMMs to yield farming. Build the knowledge to create or integrate DeFi protocols.",
    descriptionPt:
      "Entenda finanças descentralizadas de AMMs a yield farming. Construa o conhecimento para criar ou integrar protocolos DeFi.",
    descriptionEs:
      "Comprende las finanzas descentralizadas desde AMMs hasta yield farming. Construye el conocimiento para crear o integrar protocolos DeFi.",
    icon: "chart",
    color: "#9945FF",
    difficulty: "intermediate",
    estimatedHours: 6,
    termIds: [
      // Block 1: DeFi Basics
      "decentralized-finance",
      "total-value-locked",
      "liquidity",
      "liquidity-pool",
      "liquidity-provider",
      "automated-market-maker",
      "constant-product-formula",
      "slippage",
      "price-impact",
      "impermanent-loss",
      // Block 2: Trading
      "decentralized-exchange",
      "swap",
      "order-book",
      "limit-order",
      "market-order",
      "arbitrage",
      "mev",
      "front-running",
      "sandwich-attack",
      "jito",
      // Block 3: Lending & Yield
      "lending-protocol",
      "borrowing",
      "collateral",
      "liquidation",
      "loan-to-value",
      "yield-farming",
      "staking",
      "liquid-staking",
      "apr",
      "apy",
      // Block 4: Solana DeFi
      "jupiter",
      "raydium",
      "orca",
      "marinade-finance",
      "drift-protocol",
      "marginfi",
      "kamino-finance",
      "meteora",
      "phoenix",
      "openbook",
    ],
  },
  {
    slug: "security-auditor",
    title: "Security Auditor Path",
    titlePt: "Caminho do Auditor de Seguranca",
    titleEs: "Camino del Auditor de Seguridad",
    description:
      "Learn to identify and prevent common Solana vulnerabilities. Essential knowledge for building secure programs.",
    descriptionPt:
      "Aprenda a identificar e prevenir vulnerabilidades comuns na Solana. Conhecimento essencial para construir programas seguros.",
    descriptionEs:
      "Aprende a identificar y prevenir vulnerabilidades comunes de Solana. Conocimiento esencial para construir programas seguros.",
    icon: "shield",
    color: "#FF6B6B",
    difficulty: "advanced",
    estimatedHours: 5,
    termIds: [
      // Block 1: Fundamentals
      "smart-contract-security",
      "audit",
      "formal-verification",
      "bug-bounty",
      "exploit",
      "vulnerability",
      "attack-vector",
      "threat-model",
      // Block 2: Solana-Specific Vulns
      "missing-signer-check",
      "missing-owner-check",
      "account-confusion",
      "pda-substitution",
      "type-cosplay",
      "integer-overflow",
      "arithmetic-overflow",
      "closing-accounts",
      // Block 3: Advanced Attacks
      "reentrancy",
      "cross-program-invocation",
      "cpi-guard",
      "privilege-escalation",
      "oracle-manipulation",
      "flash-loan-attack",
      "sandwich-attack",
      "front-running",
      // Block 4: Defense
      "access-control",
      "input-validation",
      "program-derived-address",
      "bump-seed-canonicalization",
      "account-validation",
      "constraint",
      "anchor-framework",
      "sealevel-attack",
    ],
  },
  {
    slug: "token-master",
    title: "Token & NFT Mastery",
    titlePt: "Dominio de Tokens e NFTs",
    titleEs: "Dominio de Tokens y NFTs",
    description:
      "Master SPL tokens, Token-2022, NFTs, and the full Solana token ecosystem. From minting to complex extensions.",
    descriptionPt:
      "Domine tokens SPL, Token-2022, NFTs e todo o ecossistema de tokens Solana. De minting a extensoes complexas.",
    descriptionEs:
      "Domina tokens SPL, Token-2022, NFTs y todo el ecosistema de tokens Solana. Desde minting hasta extensiones complejas.",
    icon: "gem",
    color: "#FFD93D",
    difficulty: "intermediate",
    estimatedHours: 5,
    termIds: [
      // Block 1: Token Basics
      "token",
      "spl-token",
      "spl-token-program",
      "mint",
      "mint-authority",
      "token-account",
      "associated-token-account",
      "token-balance",
      "decimals",
      "supply",
      // Block 2: Token-2022
      "token-2022",
      "token-extensions",
      "transfer-fee",
      "transfer-hook",
      "confidential-transfers",
      "permanent-delegate",
      "non-transferable",
      "interest-bearing",
      "metadata-extension",
      "group-pointer",
      // Block 3: NFTs
      "non-fungible-token",
      "metaplex",
      "metadata",
      "collection",
      "compressed-nft",
      "programmable-nft",
      "token-standard",
      "royalties",
      "creator",
      "merkle-tree",
      // Block 4: Advanced
      "token-swap",
      "wrapped-token",
      "bridge",
      "wormhole",
      "token-gating",
      "soulbound-token",
      "token-burning",
      "freeze-authority",
      "close-authority",
      "token-metadata-program",
    ],
  },
  {
    slug: "ai-solana",
    title: "AI x Solana",
    titlePt: "IA x Solana",
    titleEs: "IA x Solana",
    description:
      "Explore the intersection of AI and Solana. From AI agents to on-chain inference and the agentic economy.",
    descriptionPt:
      "Explore a intersecao entre IA e Solana. De agentes de IA a inferencia on-chain e a economia agentica.",
    descriptionEs:
      "Explora la interseccion entre IA y Solana. Desde agentes de IA hasta inferencia on-chain y la economia agentica.",
    icon: "brain",
    color: "#00D4FF",
    difficulty: "intermediate",
    estimatedHours: 4,
    termIds: [
      // Block 1: AI Foundations
      "artificial-intelligence",
      "machine-learning",
      "large-language-model",
      "neural-network",
      "transformer",
      "inference",
      "training",
      "fine-tuning",
      "embedding",
      "vector-database",
      // Block 2: AI Agents
      "ai-agent",
      "autonomous-agent",
      "agent-framework",
      "tool-use",
      "function-calling",
      "chain-of-thought",
      "retrieval-augmented-generation",
      "prompt-engineering",
      "context-window",
      "token-limit",
      // Block 3: AI x Crypto
      "depin",
      "compute-network",
      "gpu-marketplace",
      "on-chain-inference",
      "ai-oracle",
      "model-marketplace",
      "data-dao",
      "federated-learning",
      "zero-knowledge-machine-learning",
      "verifiable-compute",
      // Block 4: Solana AI Ecosystem
      "solana-agent-kit",
      "eliza-framework",
      "sendai",
      "mcp-server",
      "ai-wallet",
      "ai-trading-bot",
      "sentiment-analysis",
      "on-chain-analytics",
      "prediction-market",
      "polymarket",
    ],
  },
];

/** Get a learning path by slug */
export function getLearningPath(slug: string): LearningPath | undefined {
  return learningPaths.find((p) => p.slug === slug);
}

/** Get all learning paths */
export function getAllLearningPaths(): LearningPath[] {
  return learningPaths;
}

/** Get localized title for a path */
export function getPathTitle(path: LearningPath, locale: string): string {
  switch (locale) {
    case "pt":
      return path.titlePt;
    case "es":
      return path.titleEs;
    default:
      return path.title;
  }
}

/** Get localized description for a path */
export function getPathDescription(path: LearningPath, locale: string): string {
  switch (locale) {
    case "pt":
      return path.descriptionPt;
    case "es":
      return path.descriptionEs;
    default:
      return path.description;
  }
}

/** Path progress stored in localStorage */
const PATH_PROGRESS_KEY = "solana-glossary-path-progress";

export interface PathProgress {
  slug: string;
  completedTerms: string[];
  startedAt: number;
  lastStudiedAt: number;
}

export function getPathProgress(slug: string): PathProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PATH_PROGRESS_KEY);
    if (!raw) return null;
    const all: Record<string, PathProgress> = JSON.parse(raw);
    return all[slug] ?? null;
  } catch {
    return null;
  }
}

export function markTermCompleteInPath(
  slug: string,
  termId: string,
): PathProgress {
  if (typeof window === "undefined")
    return { slug, completedTerms: [], startedAt: 0, lastStudiedAt: 0 };

  const raw = localStorage.getItem(PATH_PROGRESS_KEY);
  const all: Record<string, PathProgress> = raw ? JSON.parse(raw) : {};
  const now = Date.now();

  if (!all[slug]) {
    all[slug] = {
      slug,
      completedTerms: [],
      startedAt: now,
      lastStudiedAt: now,
    };
  }

  if (!all[slug].completedTerms.includes(termId)) {
    all[slug].completedTerms.push(termId);
  }
  all[slug].lastStudiedAt = now;

  localStorage.setItem(PATH_PROGRESS_KEY, JSON.stringify(all));
  return all[slug];
}

export function getPathCompletionPercent(
  path: LearningPath,
  progress: PathProgress | null,
): number {
  if (!progress || path.termIds.length === 0) return 0;
  return Math.round(
    (progress.completedTerms.length / path.termIds.length) * 100,
  );
}

export function getAllPathProgress(): Record<string, PathProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PATH_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
