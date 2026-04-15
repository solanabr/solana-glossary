/**
 * Glossary Index — Practical Examples & Tag System
 *
 * Enriches key glossary terms with practical code examples,
 * tags for better discoverability, and use-case hints.
 */

export interface TermEnrichment {
  tags: string[];
  example?: string;
  useCase?: string;
}

/**
 * Enrichment data for frequently-accessed terms.
 * Keyed by glossary term ID.
 */
export const GLOSSARY_INDEX: Record<string, TermEnrichment> = {
  "pda": {
    tags: ["accounts", "security", "anchor", "seeds"],
    example: `const [pda, bump] = PublicKey.findProgramAddressSync(\n  [Buffer.from("user"), wallet.toBuffer()],\n  programId\n);`,
    useCase: "Deterministic account addresses derived from seeds — no private key needed",
  },
  "cpi": {
    tags: ["composability", "programs", "cross-program"],
    example: `// CPI: invoke the Token Program from your program\ninvoke(\n  &transfer_instruction,\n  &[source.clone(), destination.clone(), authority.clone()]\n)?;`,
    useCase: "One program calling another — the backbone of Solana composability",
  },
  "token-account": {
    tags: ["spl", "tokens", "wallet"],
    example: `const ata = getAssociatedTokenAddressSync(\n  mintAddress,\n  walletAddress\n);`,
    useCase: "Holds SPL tokens for a specific mint + owner pair",
  },
  "proof-of-history": {
    tags: ["consensus", "performance", "core"],
    example: `// PoH is a VDF (Verifiable Delay Function)\n// Each hash proves that time has passed:\nhash_n = SHA256(hash_n-1 + data)`,
    useCase: "Cryptographic clock that orders transactions without consensus overhead",
  },
  "transaction": {
    tags: ["core", "signing", "instructions"],
    example: `const tx = new Transaction().add(\n  SystemProgram.transfer({\n    fromPubkey: sender,\n    toPubkey: receiver,\n    lamports: 1_000_000_000, // 1 SOL\n  })\n);\nawait sendAndConfirmTransaction(connection, tx, [senderKeypair]);`,
    useCase: "Atomic unit of execution on Solana — contains one or more instructions",
  },
  "rent": {
    tags: ["economics", "accounts", "storage"],
    example: `const rentExempt = await connection.getMinimumBalanceForRentExemption(\n  accountDataSize // bytes\n);`,
    useCase: "SOL deposit to keep an account alive — 2 years rent = rent-exempt",
  },
  "validator": {
    tags: ["consensus", "staking", "network"],
    useCase: "Runs the Solana software, validates transactions, produces blocks",
  },
  "staking": {
    tags: ["economics", "validators", "rewards"],
    example: `// Delegate stake to a validator\nconst tx = StakeProgram.delegate({\n  stakePubkey,\n  authorizedPubkey: wallet,\n  votePubkey: validatorVote,\n});`,
    useCase: "Lock SOL with a validator to earn rewards and secure the network",
  },
  "nft": {
    tags: ["tokens", "metaplex", "digital-assets"],
    example: `// Create NFT with Metaplex\nconst { nft } = await metaplex.nfts().create({\n  uri: "https://arweave.net/.../metadata.json",\n  name: "My NFT",\n  sellerFeeBasisPoints: 500, // 5% royalty\n});`,
    useCase: "Non-fungible token — unique digital asset on Solana",
  },
  "anchor": {
    tags: ["framework", "rust", "idl", "dev-tools"],
    example: `#[program]\npub mod my_program {\n  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n    ctx.accounts.data.authority = ctx.accounts.signer.key();\n    Ok(())\n  }\n}`,
    useCase: "Rust framework for Solana programs — handles serialization, security checks, IDL",
  },
  "spl-token": {
    tags: ["tokens", "fungible", "standard"],
    example: `// Create a new mint\nconst mint = await createMint(\n  connection,\n  payer,\n  mintAuthority,\n  freezeAuthority,\n  9 // decimals\n);`,
    useCase: "Solana's standard for fungible and non-fungible tokens",
  },
  "keypair": {
    tags: ["cryptography", "wallet", "signing"],
    example: `import { Keypair } from "@solana/web3.js";\nconst kp = Keypair.generate();\nconsole.log("Public:", kp.publicKey.toBase58());\nconsole.log("Secret:", bs58.encode(kp.secretKey));`,
    useCase: "Ed25519 key pair — public key is the address, secret key signs transactions",
  },
  "lamport": {
    tags: ["economics", "units", "sol"],
    useCase: "Smallest unit of SOL — 1 SOL = 1,000,000,000 lamports",
  },
  "rust": {
    tags: ["language", "programs", "systems"],
    useCase: "Primary language for writing Solana on-chain programs",
  },
  "jupiter": {
    tags: ["defi", "dex", "aggregator", "swaps"],
    useCase: "Leading DEX aggregator on Solana — finds best swap routes across all DEXes",
  },
  "amm": {
    tags: ["defi", "liquidity", "trading"],
    useCase: "Automated Market Maker — enables token swaps via liquidity pools",
  },
};

const tagIndex = new Map<string, string[]>();

// Build tag index
for (const [id, enrichment] of Object.entries(GLOSSARY_INDEX)) {
  for (const tag of enrichment.tags) {
    const existing = tagIndex.get(tag) ?? [];
    existing.push(id);
    tagIndex.set(tag, existing);
  }
}

/** Get enrichment data for a term */
export function getEnrichment(termId: string): TermEnrichment | undefined {
  return GLOSSARY_INDEX[termId];
}

/** Search terms by tag */
export function getTermsByTag(tag: string): string[] {
  return tagIndex.get(tag.toLowerCase()) ?? [];
}

/** Get all available tags */
export function getAllTags(): string[] {
  return [...tagIndex.keys()].sort();
}
