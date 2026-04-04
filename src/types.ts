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
  /** URL-safe unique identifier, e.g. "proof-of-history" */
  id: string;
  /** Display name, e.g. "Proof of History (PoH)" */
  term: string;
  /** Plain-text definition. Empty string means not yet populated. */
  definition: string;
  /** Which category this term belongs to */
  category: Category;
  /** Related term IDs for cross-referencing */
  related?: string[];
  /** Aliases or abbreviations, e.g. ["PoH"] */
  aliases?: string[];
}
