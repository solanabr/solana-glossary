import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Category =
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

type Depth = 1 | 2 | 3 | 4 | 5;

type Term = {
  id: string;
  term: string;
  definition: string;
  category: Category;
  related?: string[];
  aliases?: string[];
  depth?: Depth;
};

const TERMS_DIR = resolve(
  process.cwd(),
  "apps/telegram-bot/src/glossary/data/terms",
);

const TERM_FILES = [
  "ai-ml.json",
  "blockchain-general.json",
  "core-protocol.json",
  "defi.json",
  "dev-tools.json",
  "infrastructure.json",
  "network.json",
  "programming-fundamentals.json",
  "programming-model.json",
  "security.json",
  "solana-ecosystem.json",
  "token-ecosystem.json",
  "web3.json",
  "zk-compression.json",
] as const;

const CATEGORY_DEFAULTS: Record<Category, Depth> = {
  "blockchain-general": 1,
  web3: 1,
  "solana-ecosystem": 2,
  "token-ecosystem": 2,
  defi: 2,
  "ai-ml": 2,
  network: 3,
  "core-protocol": 3,
  "programming-fundamentals": 3,
  infrastructure: 3,
  "dev-tools": 3,
  security: 3,
  "programming-model": 4,
  "zk-compression": 4,
};

const MANUAL_OVERRIDES: Partial<Record<string, Depth>> = {
  "proof-of-history": 3,
  "proof-of-stake": 2,
  "proof-of-work": 2,
  account: 2,
  wallet: 1,
  transaction: 2,
  validator: 2,
  slot: 3,
  epoch: 3,
  pda: 4,
  cpi: 4,
  "compute-units": 3,
  rent: 3,
  anchor: 3,
  "spl-token": 3,
  amm: 2,
  dex: 2,
  "liquidity-pool": 2,
  "impermanent-loss": 3,
  "zk-proof": 4,
  turbine: 4,
  "tower-bft": 4,
  "gulf-stream": 4,
  lockout: 5,
  root: 5,
  "optimistic-confirmation": 5,
  "concurrent-merkle-tree": 5,
  "proof-path": 5,
  "elgamal-encryption": 5,
  "canopy-depth": 5,
};

const counts: Record<Depth, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

let totalTerms = 0;

for (const fileName of TERM_FILES) {
  const filePath = resolve(TERMS_DIR, fileName);
  const terms = JSON.parse(readFileSync(filePath, "utf-8")) as Term[];

  const updatedTerms = terms.map((term) => {
    const depth =
      MANUAL_OVERRIDES[term.id] ??
      term.depth ??
      CATEGORY_DEFAULTS[term.category];
    counts[depth] += 1;
    totalTerms += 1;
    return { ...term, depth };
  });

  writeFileSync(
    filePath,
    `${JSON.stringify(updatedTerms, null, 2)}\n`,
    "utf-8",
  );
}

console.log(
  JSON.stringify(
    {
      totalTerms,
      depth1: counts[1],
      depth2: counts[2],
      depth3: counts[3],
      depth4: counts[4],
      depth5: counts[5],
    },
    null,
    2,
  ),
);
