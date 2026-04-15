import type { Category, LocaleCode } from "./types";

export interface CategoryMeta {
  label: string;
  color: string;
  description: string;
}

export const categoryMeta: Record<Category, CategoryMeta> = {
  "core-protocol": {
    label: "Core Protocol",
    color: "#9945FF",
    description: "Fundamental mechanisms powering the Solana blockchain.",
  },
  "programming-model": {
    label: "Programming Model",
    color: "#3B82F6",
    description:
      "Programs, accounts, instructions, and Solana's execution model.",
  },
  "token-ecosystem": {
    label: "Token Ecosystem",
    color: "#F59E0B",
    description: "SPL tokens, minting, transfers, and token standards.",
  },
  defi: {
    label: "DeFi",
    color: "#10B981",
    description: "Decentralized finance protocols, AMMs, lending, and yield.",
  },
  "zk-compression": {
    label: "ZK Compression",
    color: "#8B5CF6",
    description: "Zero-knowledge proofs and state compression on Solana.",
  },
  infrastructure: {
    label: "Infrastructure",
    color: "#6B7280",
    description: "Validators, RPCs, clusters, and network infrastructure.",
  },
  security: {
    label: "Security",
    color: "#EF4444",
    description: "Vulnerabilities, auditing, and security best practices.",
  },
  "dev-tools": {
    label: "Dev Tools",
    color: "#06B6D4",
    description: "SDKs, CLIs, frameworks, and developer tooling.",
  },
  network: {
    label: "Network",
    color: "#14F195",
    description: "Consensus, gossip, turbine, and network communication.",
  },
  "blockchain-general": {
    label: "Blockchain General",
    color: "#FB923C",
    description: "General blockchain concepts not specific to Solana.",
  },
  web3: {
    label: "Web3",
    color: "#E879F9",
    description: "Wallets, dapps, identity, and the decentralized web.",
  },
  "programming-fundamentals": {
    label: "Programming Fundamentals",
    color: "#38BDF8",
    description: "Core CS concepts supporting blockchain development.",
  },
  "ai-ml": {
    label: "AI / ML",
    color: "#FDBA74",
    description: "Machine learning, LLMs, and AI concepts for builders.",
  },
  "solana-ecosystem": {
    label: "Solana Ecosystem",
    color: "#C084FC",
    description: "Projects, products, and culture across the Solana landscape.",
  },
};

const localizedCategoryMeta: Partial<
  Record<
    LocaleCode,
    Record<Category, Pick<CategoryMeta, "label" | "description">>
  >
> = {
  pt: {
    "core-protocol": {
      label: "Protocolo Base",
      description: "Mecanismos fundamentais que movem a blockchain Solana.",
    },
    "programming-model": {
      label: "Modelo de Programação",
      description:
        "Programs, accounts, instructions e o modelo de execução da Solana.",
    },
    "token-ecosystem": {
      label: "Ecossistema de Tokens",
      description: "SPL tokens, mintagem, transferências e padrões de tokens.",
    },
    defi: {
      label: "DeFi",
      description: "AMMs, lending, yield e protocolos de finanças onchain.",
    },
    "zk-compression": {
      label: "Compressão ZK",
      description: "Provas de conhecimento zero e compressão de estado.",
    },
    infrastructure: {
      label: "Infraestrutura",
      description: "Validators, RPCs, clusters e a infraestrutura da rede.",
    },
    security: {
      label: "Segurança",
      description: "Auditoria, vulnerabilidades e boas práticas de segurança.",
    },
    "dev-tools": {
      label: "Ferramentas Dev",
      description: "SDKs, CLIs, frameworks e tooling para builders.",
    },
    network: {
      label: "Rede",
      description: "Consensus, gossip, turbine e comunicação de rede.",
    },
    "blockchain-general": {
      label: "Blockchain Geral",
      description: "Conceitos gerais de blockchain além de Solana.",
    },
    web3: {
      label: "Web3",
      description: "Wallets, dapps, identidade e a web descentralizada.",
    },
    "programming-fundamentals": {
      label: "Fundamentos de Programação",
      description: "Conceitos-base de CS que sustentam blockchain.",
    },
    "ai-ml": {
      label: "IA / ML",
      description: "LLMs, machine learning e IA aplicada para builders.",
    },
    "solana-ecosystem": {
      label: "Ecossistema Solana",
      description: "Projetos, produtos e cultura em volta de Solana.",
    },
  },
  es: {
    "core-protocol": {
      label: "Protocolo Base",
      description:
        "Mecanismos fundamentales que impulsan la blockchain Solana.",
    },
    "programming-model": {
      label: "Modelo de Programación",
      description:
        "Programs, accounts, instructions y el modelo de ejecución de Solana.",
    },
    "token-ecosystem": {
      label: "Ecosistema de Tokens",
      description:
        "SPL tokens, minting, transferencias y estándares de tokens.",
    },
    defi: {
      label: "DeFi",
      description: "AMMs, lending, yield y protocolos financieros onchain.",
    },
    "zk-compression": {
      label: "Compresión ZK",
      description: "Pruebas de conocimiento cero y compresión de estado.",
    },
    infrastructure: {
      label: "Infraestructura",
      description: "Validators, RPCs, clusters e infraestructura de red.",
    },
    security: {
      label: "Seguridad",
      description: "Auditoría, vulnerabilidades y buenas prácticas.",
    },
    "dev-tools": {
      label: "Herramientas Dev",
      description: "SDKs, CLIs, frameworks y tooling para builders.",
    },
    network: {
      label: "Red",
      description: "Consensus, gossip, turbine y comunicación de red.",
    },
    "blockchain-general": {
      label: "Blockchain General",
      description: "Conceptos generales de blockchain más allá de Solana.",
    },
    web3: {
      label: "Web3",
      description: "Wallets, dapps, identidad y la web descentralizada.",
    },
    "programming-fundamentals": {
      label: "Fundamentos de Programación",
      description: "Conceptos base de CS que sostienen blockchain.",
    },
    "ai-ml": {
      label: "IA / ML",
      description: "LLMs, machine learning e IA aplicada para builders.",
    },
    "solana-ecosystem": {
      label: "Ecosistema Solana",
      description: "Proyectos, productos y cultura alrededor de Solana.",
    },
  },
};

export function getCategoryMetaForLocale(
  category: Category,
  locale: LocaleCode,
): CategoryMeta {
  const base = categoryMeta[category];
  const override = localizedCategoryMeta[locale]?.[category];

  return override
    ? {
        ...base,
        ...override,
      }
    : base;
}
