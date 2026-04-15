/**
 * Known Solana Programs Registry
 *
 * 20+ well-known program IDs with human-readable descriptions.
 * Used by address classification and transaction explanation tools.
 */

export interface KnownProgram {
  address: string;
  name: string;
  description: string;
  category: "system" | "spl" | "defi" | "nft" | "infrastructure" | "governance";
}

export const KNOWN_PROGRAMS: KnownProgram[] = [
  // System Programs
  { address: "11111111111111111111111111111111", name: "System Program", description: "Native program for creating accounts, transferring SOL, and allocating space", category: "system" },
  { address: "Vote111111111111111111111111111111111111111", name: "Vote Program", description: "Manages validator vote accounts and voting", category: "system" },
  { address: "Stake11111111111111111111111111111111111111", name: "Stake Program", description: "Manages stake accounts and delegation", category: "system" },
  { address: "Config1111111111111111111111111111111111111", name: "Config Program", description: "Stores configuration data on-chain", category: "system" },
  { address: "BPFLoaderUpgradeab1e11111111111111111111111", name: "BPF Upgradeable Loader", description: "Deploys and upgrades on-chain programs", category: "system" },
  { address: "ComputeBudget111111111111111111111111111111", name: "Compute Budget Program", description: "Sets compute unit limits and priority fees", category: "system" },
  { address: "AddressLookupTab1e1111111111111111111111111", name: "Address Lookup Table Program", description: "Manages address lookup tables for versioned transactions", category: "system" },

  // SPL Programs
  { address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", name: "Token Program", description: "SPL Token program — create and manage fungible tokens", category: "spl" },
  { address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", name: "Token-2022 Program", description: "SPL Token Extensions with transfer hooks, confidential transfers, and more", category: "spl" },
  { address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", name: "Associated Token Account Program", description: "Creates and manages associated token accounts (ATAs)", category: "spl" },
  { address: "namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX", name: "Name Service Program", description: "Solana Name Service (.sol domains)", category: "spl" },
  { address: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", name: "Memo Program v2", description: "Attaches memo data to transactions", category: "spl" },

  // DeFi Programs
  { address: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", name: "Jupiter v6", description: "Jupiter aggregator — DEX routing and swap optimization", category: "defi" },
  { address: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", name: "Raydium AMM", description: "Raydium automated market maker for token swaps", category: "defi" },
  { address: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", name: "Orca Whirlpools", description: "Orca concentrated liquidity DEX", category: "defi" },
  { address: "MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky", name: "Marinade Finance", description: "Liquid staking protocol (mSOL)", category: "defi" },
  { address: "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1", name: "Orca Legacy", description: "Orca legacy token swap program", category: "defi" },
  { address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin", name: "Serum DEX v3", description: "Serum central limit order book DEX", category: "defi" },

  // NFT Programs
  { address: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s", name: "Metaplex Token Metadata", description: "NFT metadata standard — defines name, symbol, URI for tokens", category: "nft" },
  { address: "auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg", name: "Metaplex Authorization", description: "Metaplex authorization rules for programmable NFTs", category: "nft" },
  { address: "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK", name: "Bubblegum (cNFTs)", description: "Metaplex compressed NFT program using state compression", category: "nft" },

  // Infrastructure
  { address: "FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH", name: "Pyth Oracle", description: "Pyth Network price oracle — real-time market data feeds", category: "infrastructure" },
  { address: "SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f", name: "Switchboard Oracle", description: "Switchboard decentralized oracle network", category: "infrastructure" },
  { address: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth", name: "Wormhole", description: "Wormhole cross-chain bridge protocol", category: "infrastructure" },
];

const programMap = new Map(KNOWN_PROGRAMS.map((p) => [p.address, p]));

/** Look up a known program by address */
export function identifyProgram(address: string): KnownProgram | undefined {
  return programMap.get(address);
}

/** Check if an address is a known program */
export function isKnownProgram(address: string): boolean {
  return programMap.has(address);
}
