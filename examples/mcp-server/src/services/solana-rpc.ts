/**
 * Solana RPC Service
 *
 * Wraps @solana/web3.js to provide:
 * - SOL balance lookup
 * - SPL token account enumeration
 * - Transaction history and parsing
 * - Address classification (wallet, program, token mint, etc.)
 */

import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  ParsedTransactionWithMeta,
} from "@solana/web3.js";
import { config } from "../utils/config.js";
import { identifyProgram } from "../data/known-programs.js";

// Lazy-init connection
let _connection: Connection | null = null;

function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(config.solanaRpcUrl, {
      commitment: "confirmed",
    });
  }
  return _connection;
}

/** Validate a supposed Solana address */
export function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return address.length >= 32 && address.length <= 44;
  } catch {
    return false;
  }
}

// ─── Balance ─────────────────────────────────────────────────────

export interface BalanceResult {
  address: string;
  lamports: number;
  sol: number;
}

export async function getBalance(address: string): Promise<BalanceResult> {
  const conn = getConnection();
  const pubkey = new PublicKey(address);
  const lamports = await conn.getBalance(pubkey);
  return {
    address,
    lamports,
    sol: lamports / LAMPORTS_PER_SOL,
  };
}

// ─── Token Accounts ──────────────────────────────────────────────

export interface TokenAccountInfo {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
}

export async function getTokenAccounts(walletAddress: string): Promise<TokenAccountInfo[]> {
  const conn = getConnection();
  const pubkey = new PublicKey(walletAddress);

  const response = await conn.getParsedTokenAccountsByOwner(pubkey, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });

  return response.value
    .map((account) => {
      const info = account.account.data.parsed.info;
      return {
        mint: info.mint as string,
        amount: info.tokenAmount.amount as string,
        decimals: info.tokenAmount.decimals as number,
        uiAmount: info.tokenAmount.uiAmount as number,
      };
    })
    .filter((t) => t.uiAmount > 0)
    .sort((a, b) => b.uiAmount - a.uiAmount);
}

// ─── Transactions ────────────────────────────────────────────────

export interface TransactionSummary {
  signature: string;
  slot: number;
  blockTime: number | null;
  err: boolean;
  fee: number;
  memo: string | null;
}

export async function getRecentTransactions(
  address: string,
  limit = 10
): Promise<TransactionSummary[]> {
  const conn = getConnection();
  const pubkey = new PublicKey(address);

  const signatures = await conn.getSignaturesForAddress(pubkey, { limit });

  return signatures.map((sig) => ({
    signature: sig.signature,
    slot: sig.slot,
    blockTime: sig.blockTime ?? null,
    err: sig.err !== null,
    fee: 0, // Basic info from signatures
    memo: sig.memo ?? null,
  }));
}

export interface ParsedTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  err: boolean;
  programs: string[];
  programNames: string[];
  instructions: Array<{
    programId: string;
    programName: string;
    type?: string;
    data?: Record<string, unknown>;
  }>;
  preBalances: number[];
  postBalances: number[];
}

export async function getTransactionDetail(signature: string): Promise<ParsedTransaction | null> {
  const conn = getConnection();

  const tx = await conn.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) return null;

  const programs = new Set<string>();
  const instructions: ParsedTransaction["instructions"] = [];

  for (const ix of tx.transaction.message.instructions) {
    const programId = ix.programId.toBase58();
    programs.add(programId);

    const known = identifyProgram(programId);
    const entry: ParsedTransaction["instructions"][0] = {
      programId,
      programName: known?.name ?? "Unknown Program",
    };

    // If parsed instruction, extract type and data
    if ("parsed" in ix) {
      entry.type = (ix as any).parsed?.type;
      entry.data = (ix as any).parsed?.info;
    }

    instructions.push(entry);
  }

  // Also check inner instructions
  if (tx.meta?.innerInstructions) {
    for (const inner of tx.meta.innerInstructions) {
      for (const ix of inner.instructions) {
        const programId = ix.programId.toBase58();
        programs.add(programId);
      }
    }
  }

  const programIds = [...programs];
  const programNames = programIds.map(
    (pid) => identifyProgram(pid)?.name ?? "Unknown"
  );

  return {
    signature,
    slot: tx.slot,
    blockTime: tx.blockTime ?? null,
    fee: tx.meta?.fee ?? 0,
    err: tx.meta?.err !== null && tx.meta?.err !== undefined,
    programs: programIds,
    programNames,
    instructions,
    preBalances: tx.meta?.preBalances ?? [],
    postBalances: tx.meta?.postBalances ?? [],
  };
}

// ─── Address Classification ──────────────────────────────────────

export type AddressType =
  | "known-program"
  | "executable"
  | "token-mint"
  | "token-account"
  | "stake-account"
  | "vote-account"
  | "wallet"
  | "system"
  | "unknown";

export interface AddressClassification {
  address: string;
  type: AddressType;
  label: string;
  details: Record<string, unknown>;
}

export async function classifyAddress(address: string): Promise<AddressClassification> {
  const conn = getConnection();
  const pubkey = new PublicKey(address);

  // Check known programs first
  const known = identifyProgram(address);
  if (known) {
    return {
      address,
      type: "known-program",
      label: known.name,
      details: {
        description: known.description,
        category: known.category,
      },
    };
  }

  // Fetch account info
  const accountInfo = await conn.getParsedAccountInfo(pubkey);

  if (!accountInfo.value) {
    return {
      address,
      type: "unknown",
      label: "Unknown (no data)",
      details: { info: "Account not found or has no data. May be a new/unfunded wallet." },
    };
  }

  const data = accountInfo.value;

  // Executable = program
  if (data.executable) {
    return {
      address,
      type: "executable",
      label: "On-chain Program",
      details: {
        owner: data.owner.toBase58(),
        lamports: data.lamports,
      },
    };
  }

  // Parse account data if available
  if (data.data && typeof data.data === "object" && "parsed" in data.data) {
    const parsed = (data.data as any).parsed;
    const programOwner = (data.data as any).program;

    if (programOwner === "spl-token") {
      if (parsed?.type === "mint") {
        return {
          address,
          type: "token-mint",
          label: "SPL Token Mint",
          details: {
            supply: parsed.info?.supply,
            decimals: parsed.info?.decimals,
            mintAuthority: parsed.info?.mintAuthority,
            freezeAuthority: parsed.info?.freezeAuthority,
          },
        };
      }
      if (parsed?.type === "account") {
        return {
          address,
          type: "token-account",
          label: "SPL Token Account",
          details: {
            mint: parsed.info?.mint,
            owner: parsed.info?.owner,
            amount: parsed.info?.tokenAmount?.uiAmountString,
          },
        };
      }
    }

    if (programOwner === "stake") {
      return {
        address,
        type: "stake-account",
        label: "Stake Account",
        details: parsed.info ?? {},
      };
    }

    if (programOwner === "vote") {
      return {
        address,
        type: "vote-account",
        label: "Vote Account (Validator)",
        details: {
          nodePubkey: parsed.info?.nodePubkey,
          commission: parsed.info?.commission,
        },
      };
    }
  }

  // Default: likely a wallet
  return {
    address,
    type: "wallet",
    label: "Wallet (System Account)",
    details: {
      lamports: data.lamports,
      sol: data.lamports / LAMPORTS_PER_SOL,
      owner: data.owner.toBase58(),
    },
  };
}
