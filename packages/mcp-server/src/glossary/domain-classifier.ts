export type SolanaDomain =
  | "anchor"
  | "runtime"
  | "defi"
  | "agents"
  | "token"
  | "nft"
  | "general";

type DomainSignal = {
  domain: SolanaDomain;
  keywords: string[];
  weight: number;
};

const DOMAIN_SIGNALS: DomainSignal[] = [
  {
    domain: "anchor",
    keywords: [
      "anchor",
      "#[program]",
      "#[account]",
      "declare_id!",
      "context<",
      "has_one",
      "seeds",
      "bump",
      "anchorerror",
      "program<",
    ],
    weight: 1,
  },
  {
    domain: "runtime",
    keywords: [
      "invoke",
      "invoke_signed",
      "accountinfo",
      "programresult",
      "entrypoint!",
      "process_instruction",
      "pubkey",
      "systemprogram",
      "validator",
      "slot",
      "epoch",
      "transaction",
    ],
    weight: 1,
  },
  {
    domain: "defi",
    keywords: [
      "swap",
      "liquidity",
      "pool",
      "amm",
      "yield",
      "stake",
      "unstake",
      "jupiter",
      "raydium",
      "price impact",
      "slippage",
      "dex",
    ],
    weight: 1,
  },
  {
    domain: "agents",
    keywords: [
      "agent",
      "mcp",
      "tool",
      "autonomous",
      "workflow",
      "pipeline",
      "claude",
      "llm",
      "embedding",
      "rag",
      "copilot",
    ],
    weight: 1,
  },
  {
    domain: "token",
    keywords: [
      "mint",
      "token account",
      "spl",
      "token-2022",
      "transfer",
      "burn",
      "freeze",
      "associated token",
    ],
    weight: 1,
  },
  {
    domain: "nft",
    keywords: [
      "nft",
      "metadata",
      "collection",
      "metaplex",
      "master edition",
      "creator",
      "royalty",
    ],
    weight: 1,
  },
];

const LEARNING_PATHS: Record<SolanaDomain, string[]> = {
  anchor: ["anchor", "account", "instruction", "pda", "cpi", "idl"],
  runtime: ["transaction", "instruction", "runtime", "validator", "proof-of-history"],
  defi: ["amm", "liquidity-pool", "swap", "slippage", "price-impact", "dex"],
  agents: ["mcp", "llm", "rag", "embedding", "rpc"],
  token: ["mint", "token-account", "spl-token", "associated-token-account", "token-2022"],
  nft: ["nft", "metadata", "metaplex", "collection", "master-edition"],
  general: ["account", "transaction", "instruction", "program", "validator"],
};

export function classifyDomain(text: string): SolanaDomain {
  const scores: Record<SolanaDomain, number> = {
    anchor: 0,
    runtime: 0,
    defi: 0,
    agents: 0,
    token: 0,
    nft: 0,
    general: 0,
  };

  const lowerText = text.toLowerCase();
  for (const signal of DOMAIN_SIGNALS) {
    for (const keyword of signal.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[signal.domain] += signal.weight;
      }
    }
  }

  const [topDomain, topScore] = (Object.entries(scores) as Array<[SolanaDomain, number]>).sort(
    (left, right) => right[1] - left[1],
  )[0];

  return topScore > 0 ? topDomain : "general";
}

export function getLearningPathForDomain(domain: SolanaDomain): string[] {
  return LEARNING_PATHS[domain];
}
