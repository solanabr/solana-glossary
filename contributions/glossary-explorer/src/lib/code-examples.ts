/**
 * Code examples for glossary terms.
 * Each term can have multiple examples in different languages.
 */

export interface CodeExample {
  language: "rust" | "typescript" | "bash";
  label: string;
  code: string;
  playgroundUrl?: string;
}

/**
 * Map of term IDs to their code examples.
 * Only popular/important terms have examples - the rest get AI-generated on demand.
 */
export const codeExamples: Record<string, CodeExample[]> = {
  "program-derived-address": [
    {
      language: "rust",
      label: "Anchor - Derive PDA",
      code: `use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Profile::INIT_SPACE,
        seeds = [b"profile", authority.key().as_ref()],
        bump,
    )]
    pub profile: Account<'info, Profile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Profile {
    pub authority: Pubkey,
    #[max_len(32)]
    pub username: String,
    pub bump: u8,
}`,
      playgroundUrl: "https://beta.solpg.io",
    },
    {
      language: "typescript",
      label: "Find PDA",
      code: `import { PublicKey } from "@solana/web3.js";

const [profilePda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), wallet.publicKey.toBuffer()],
  programId
);

console.log("PDA:", profilePda.toBase58());
console.log("Bump:", bump);`,
    },
  ],
  account: [
    {
      language: "rust",
      label: "Anchor - Account Definition",
      code: `use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GameState {
    pub authority: Pubkey,   // 32 bytes
    pub score: u64,          // 8 bytes
    pub level: u32,          // 4 bytes
    pub is_active: bool,     // 1 byte
    pub bump: u8,            // 1 byte
}

// Total space: 8 (discriminator) + 32 + 8 + 4 + 1 + 1 = 54 bytes`,
    },
    {
      language: "typescript",
      label: "Fetch Account",
      code: `import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

const accountInfo = await connection.getAccountInfo(
  new PublicKey("YourAccountPubkeyHere")
);

if (accountInfo) {
  console.log("Owner:", accountInfo.owner.toBase58());
  console.log("Lamports:", accountInfo.lamports);
  console.log("Data length:", accountInfo.data.length);
  console.log("Executable:", accountInfo.executable);
}`,
    },
  ],
  instruction: [
    {
      language: "rust",
      label: "Anchor - Instruction Handler",
      code: `use anchor_lang::prelude::*;

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.authority = ctx.accounts.authority.key();
        profile.name = name;
        profile.bump = ctx.bumps.profile;
        Ok(())
    }

    pub fn update_name(ctx: Context<UpdateName>, new_name: String) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        require!(
            profile.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        profile.name = new_name;
        Ok(())
    }
}`,
    },
    {
      language: "typescript",
      label: "Build & Send Instruction",
      code: `import {
  Connection,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";

const program = new Program(idl, programId, provider);

// Anchor makes it simple
const tx = await program.methods
  .initialize("My Profile")
  .accounts({
    profile: profilePda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("Transaction signature:", tx);`,
    },
  ],
  "cross-program-invocation": [
    {
      language: "rust",
      label: "Anchor - CPI to Token Program",
      code: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount};

pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.from_ata.to_account_info(),
        to: ctx.accounts.to_ata.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;
    Ok(())
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_ata: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}`,
    },
  ],
  "spl-token": [
    {
      language: "typescript",
      label: "Create SPL Token",
      code: `import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

// Create a new token mint
const mint = await createMint(
  connection,
  payer,          // fee payer
  mintAuthority,  // mint authority
  freezeAuthority, // freeze authority (optional)
  9               // decimals
);

// Create token account for recipient
const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,
  mint,
  recipient
);

// Mint 1000 tokens (with 9 decimals)
await mintTo(
  connection,
  payer,
  mint,
  tokenAccount.address,
  mintAuthority,
  1000 * 10 ** 9
);`,
    },
    {
      language: "bash",
      label: "CLI - Create Token",
      code: `# Create a new token
spl-token create-token

# Create a token account
spl-token create-account <TOKEN_MINT>

# Mint tokens
spl-token mint <TOKEN_MINT> 1000

# Check balance
spl-token balance <TOKEN_MINT>

# Transfer tokens
spl-token transfer <TOKEN_MINT> 100 <RECIPIENT>`,
    },
  ],
  "anchor-framework": [
    {
      language: "bash",
      label: "Quick Start",
      code: `# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest

# Create new project
anchor init my_project
cd my_project

# Build
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet`,
    },
    {
      language: "rust",
      label: "Program Structure",
      code: `use anchor_lang::prelude::*;

declare_id!("YourProgramIdHere111111111111111111111");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 8 + 32)]
    pub data_account: Account<'info, DataAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct DataAccount {
    pub authority: Pubkey,
}`,
    },
  ],
  transaction: [
    {
      language: "typescript",
      label: "Build Versioned Transaction",
      code: `import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

// Build instruction
const instruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: new PublicKey("RecipientAddress"),
  lamports: 0.1 * 1e9, // 0.1 SOL
});

// Get recent blockhash
const { blockhash } = await connection.getLatestBlockhash();

// Build v0 transaction
const message = new TransactionMessage({
  payerKey: sender.publicKey,
  recentBlockhash: blockhash,
  instructions: [instruction],
}).compileToV0Message();

const tx = new VersionedTransaction(message);
tx.sign([sender]);

const sig = await connection.sendTransaction(tx);
console.log("Signature:", sig);`,
    },
  ],
  staking: [
    {
      language: "typescript",
      label: "Stake SOL",
      code: `import {
  Connection,
  StakeProgram,
  Authorized,
  Lockup,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const stakeAccount = Keypair.generate();

const createStakeTx = StakeProgram.createAccount({
  fromPubkey: wallet.publicKey,
  stakePubkey: stakeAccount.publicKey,
  authorized: new Authorized(
    wallet.publicKey, // staker
    wallet.publicKey  // withdrawer
  ),
  lockup: new Lockup(0, 0, wallet.publicKey),
  lamports: 1 * LAMPORTS_PER_SOL,
});

const delegateTx = StakeProgram.delegate({
  stakePubkey: stakeAccount.publicKey,
  authorizedPubkey: wallet.publicKey,
  votePubkey: validatorVoteAccount,
});`,
    },
  ],
  rpc: [
    {
      language: "typescript",
      label: "Common RPC Calls",
      code: `import { Connection } from "@solana/web3.js";

const rpc = new Connection("https://api.mainnet-beta.solana.com");

// Get SOL balance
const balance = await rpc.getBalance(publicKey);
console.log(\`Balance: \${balance / 1e9} SOL\`);

// Get recent blockhash
const { blockhash, lastValidBlockHeight } =
  await rpc.getLatestBlockhash();

// Get slot
const slot = await rpc.getSlot();

// Get block time
const blockTime = await rpc.getBlockTime(slot);

// Get token accounts
const tokenAccounts = await rpc.getParsedTokenAccountsByOwner(
  publicKey,
  { programId: TOKEN_PROGRAM_ID }
);

// Subscribe to account changes
const subId = rpc.onAccountChange(publicKey, (account) => {
  console.log("Account changed:", account.lamports);
});`,
    },
  ],
  swap: [
    {
      language: "typescript",
      label: "Jupiter Swap",
      code: `// Jupiter V6 API Swap
const quoteResponse = await fetch(
  "https://quote-api.jup.ag/v6/quote?" +
  new URLSearchParams({
    inputMint: "So11111111111111111111111111111111111111112", // SOL
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    amount: String(0.1 * 1e9), // 0.1 SOL in lamports
    slippageBps: "50", // 0.5%
  })
).then((r) => r.json());

const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    quoteResponse,
    userPublicKey: wallet.publicKey.toBase58(),
    wrapAndUnwrapSol: true,
  }),
}).then((r) => r.json());

// Deserialize and sign
const tx = VersionedTransaction.deserialize(
  Buffer.from(swapResponse.swapTransaction, "base64")
);
tx.sign([wallet]);
const sig = await connection.sendTransaction(tx);`,
    },
  ],
};

/** Get code examples for a term ID */
export function getCodeExamples(termId: string): CodeExample[] {
  return codeExamples[termId] ?? [];
}

/** Check if a term has code examples */
export function hasCodeExamples(termId: string): boolean {
  return termId in codeExamples && codeExamples[termId].length > 0;
}

/** Get all term IDs that have code examples */
export function getTermsWithExamples(): string[] {
  return Object.keys(codeExamples);
}
