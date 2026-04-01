"use client";
import { useState } from "react";

const CODE_EXAMPLES: Record<string, { lang: string; code: string }> = {
  pda: {
    lang: "typescript",
    code: `import { PublicKey } from "@solana/web3.js";

const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), user.toBuffer()],
  programId
);

console.log("PDA:", pda.toBase58());
console.log("Bump:", bump); // Store this on-chain for CPI signing`,
  },
  cpi: {
    lang: "rust",
    code: `// CPI: calling the Token program from your program
use anchor_spl::token::{self, Transfer};

let cpi_accounts = Transfer {
    from: ctx.accounts.vault.to_account_info(),
    to: ctx.accounts.user_token.to_account_info(),
    authority: ctx.accounts.vault_authority.to_account_info(),
};
let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts,
    signer_seeds,
);
token::transfer(cpi_ctx, amount)?;`,
  },
  amm: {
    lang: "typescript",
    code: `// Constant product AMM formula: x * y = k
function getAmountOut(
  amountIn: number,
  reserveIn: number,
  reserveOut: number
): number {
  const amountInWithFee = amountIn * 997; // 0.3% fee
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000 + amountInWithFee;
  return numerator / denominator;
}`,
  },
  account: {
    lang: "typescript",
    code: `import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const pubkey = new PublicKey("So11111111111111111111111111111111111111112");

const accountInfo = await connection.getAccountInfo(pubkey);
console.log("Owner:", accountInfo?.owner.toBase58());
console.log("Lamports:", accountInfo?.lamports);
console.log("Data length:", accountInfo?.data.length);`,
  },
  "spl-token": {
    lang: "typescript",
    code: `import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

// Create a new SPL token mint
const mint = await createMint(
  connection,
  payer,       // payer of transaction fees
  payer.publicKey, // mint authority
  null,        // freeze authority
  9            // decimals
);

// Create token account and mint tokens
const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, recipient
);
await mintTo(connection, payer, mint, tokenAccount.address, payer, 1_000_000_000);`,
  },
};

export default function CodeExample({ termId }: { termId: string }) {
  const [copied, setCopied] = useState(false);
  const example = CODE_EXAMPLES[termId];
  if (!example) return null;

  function copy() {
    navigator.clipboard.writeText(example.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-text-dim uppercase tracking-widest">Exemplo</p>
        <button
          onClick={copy}
          className="text-[9px] text-text-dim hover:text-text transition-colors border border-border px-2 py-0.5 rounded"
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </div>
      <pre className="bg-black/30 border border-border rounded p-4 overflow-x-auto">
        <code className="text-[11px] text-text-muted font-mono leading-relaxed">
          {example.code}
        </code>
      </pre>
    </div>
  );
}
