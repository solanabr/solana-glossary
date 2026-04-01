import type { Category } from "./glossary";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  account: "Beginner",
  transaction: "Beginner",
  wallet: "Beginner",
  lamport: "Beginner",
  sol: "Beginner",
  validator: "Beginner",
  block: "Beginner",
  cluster: "Beginner",
  devnet: "Beginner",
  "mainnet-beta": "Beginner",
  "smart-contract": "Beginner",
  program: "Beginner",
  instruction: "Beginner",
  signature: "Beginner",
  keypair: "Beginner",
  "public-key": "Beginner",
  "private-key": "Beginner",
  "spl-token": "Beginner",
  nft: "Beginner",
  mint: "Beginner",
  pda: "Intermediate",
  cpi: "Intermediate",
  rent: "Intermediate",
  "rent-exempt": "Intermediate",
  anchor: "Intermediate",
  idl: "Intermediate",
  sysvar: "Intermediate",
  "associated-token-account": "Intermediate",
  "token-account": "Intermediate",
  "proof-of-history": "Intermediate",
  "proof-of-stake": "Intermediate",
  "leader-schedule": "Intermediate",
  slot: "Intermediate",
  epoch: "Intermediate",
  stake: "Intermediate",
  "vote-account": "Intermediate",
  "zk-proof": "Advanced",
  "zk-compression": "Advanced",
  groth16: "Advanced",
  "merkle-tree": "Advanced",
  "concurrent-merkle-tree": "Advanced",
  "light-protocol": "Advanced",
  reentrancy: "Advanced",
  sealevel: "Advanced",
  turbine: "Advanced",
  "gulf-stream": "Advanced",
};

const CATEGORY_DEFAULTS: Record<Category, Difficulty> = {
  "core-protocol": "Intermediate",
  "programming-model": "Intermediate",
  "token-ecosystem": "Beginner",
  defi: "Intermediate",
  "zk-compression": "Advanced",
  infrastructure: "Intermediate",
  security: "Advanced",
  "dev-tools": "Beginner",
  network: "Beginner",
  "blockchain-general": "Beginner",
  web3: "Beginner",
  "programming-fundamentals": "Beginner",
  "ai-ml": "Advanced",
  "solana-ecosystem": "Beginner",
};

export function getDifficulty(id: string, category?: Category): Difficulty {
  if (DIFFICULTY_MAP[id]) return DIFFICULTY_MAP[id];
  if (category) return CATEGORY_DEFAULTS[category];
  return "Intermediate";
}
