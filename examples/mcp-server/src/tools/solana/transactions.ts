/**
 * get_recent_transactions — Transaction history
 * explain_transaction — Transaction parsing with program identification
 */

import { z } from "zod";
import {
  getRecentTransactions as fetchRecentTx,
  getTransactionDetail,
  isValidAddress,
} from "../../services/solana-rpc.js";
import { shortenAddress, formatTimestamp, formatSol } from "../../utils/format.js";

// ─── get_recent_transactions ─────────────────────────────────────

export const getRecentTransactionsSchema = z.object({
  address: z.string().describe("Solana address to get transaction history for"),
  limit: z.number().min(1).max(20).optional().describe("Number of recent transactions (default: 5, max: 20)"),
});

export type GetRecentTransactionsInput = z.infer<typeof getRecentTransactionsSchema>;

export async function getRecentTransactionsTool(
  input: GetRecentTransactionsInput
): Promise<string> {
  if (!isValidAddress(input.address)) {
    return `❌ Invalid Solana address: "${input.address}"`;
  }

  try {
    const limit = input.limit ?? 5;
    const txs = await fetchRecentTx(input.address, limit);

    if (txs.length === 0) {
      return `📭 No recent transactions found for ${shortenAddress(input.address)}.`;
    }

    const lines = [
      `📋 **Recent Transactions for ${shortenAddress(input.address)}** (${txs.length}):`,
      ``,
    ];

    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      const status = tx.err ? "❌ Failed" : "✅ Success";
      const time = tx.blockTime ? formatTimestamp(tx.blockTime) : "Unknown time";

      lines.push(`${i + 1}. ${status} — ${time}`);
      lines.push(`   Signature: \`${shortenAddress(tx.signature, 8)}\``);
      lines.push(`   Slot: ${tx.slot.toLocaleString()}`);
      if (tx.memo) {
        lines.push(`   Memo: ${tx.memo}`);
      }
      lines.push(``);
    }

    lines.push(`_Use 'explain_transaction' with a signature for detailed analysis._`);

    return lines.join("\n");
  } catch (error) {
    return `❌ Error fetching transactions: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// ─── explain_transaction ─────────────────────────────────────────

export const explainTransactionSchema = z.object({
  signature: z.string().describe("Transaction signature (base58 hash) to analyze"),
});

export type ExplainTransactionInput = z.infer<typeof explainTransactionSchema>;

export async function explainTransactionTool(
  input: ExplainTransactionInput
): Promise<string> {
  try {
    const tx = await getTransactionDetail(input.signature);

    if (!tx) {
      return `❌ Transaction not found: "${shortenAddress(input.signature, 8)}"\n\nMake sure the signature is correct and the transaction has been confirmed.`;
    }

    const status = tx.err ? "❌ Failed" : "✅ Success";
    const time = tx.blockTime ? formatTimestamp(tx.blockTime) : "Unknown";

    const lines = [
      `🔍 **Transaction Analysis**`,
      ``,
      `  • **Status:** ${status}`,
      `  • **Signature:** \`${shortenAddress(tx.signature, 8)}\``,
      `  • **Slot:** ${tx.slot.toLocaleString()}`,
      `  • **Time:** ${time}`,
      `  • **Fee:** ${formatSol(tx.fee)} SOL (${tx.fee.toLocaleString()} lamports)`,
      ``,
    ];

    // Programs involved
    lines.push(`🔧 **Programs Involved** (${tx.programs.length}):`);
    for (let i = 0; i < tx.programs.length; i++) {
      const name = tx.programNames[i];
      const addr = tx.programs[i];
      const isKnown = name !== "Unknown";
      lines.push(`  ${isKnown ? "✅" : "❓"} ${name} — \`${shortenAddress(addr)}\``);
    }
    lines.push(``);

    // Instructions
    if (tx.instructions.length > 0) {
      lines.push(`📝 **Instructions** (${tx.instructions.length}):`);
      for (let i = 0; i < tx.instructions.length; i++) {
        const ix = tx.instructions[i];
        const typeStr = ix.type ? ` → ${ix.type}` : "";
        lines.push(`  ${i + 1}. **${ix.programName}**${typeStr}`);

        // Show key data fields
        if (ix.data) {
          const entries = Object.entries(ix.data).slice(0, 5);
          for (const [key, value] of entries) {
            const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
            const truncated = displayValue.length > 60 ? displayValue.substring(0, 57) + "..." : displayValue;
            lines.push(`     ${key}: ${truncated}`);
          }
        }
      }
      lines.push(``);
    }

    // Balance changes
    if (tx.preBalances.length > 0 && tx.postBalances.length > 0) {
      const changes: string[] = [];
      for (let i = 0; i < tx.preBalances.length; i++) {
        const diff = tx.postBalances[i] - tx.preBalances[i];
        if (diff !== 0) {
          const sign = diff > 0 ? "+" : "";
          changes.push(`  Account ${i}: ${sign}${formatSol(Math.abs(diff))} SOL`);
        }
      }
      if (changes.length > 0) {
        lines.push(`💰 **SOL Balance Changes:**`);
        lines.push(...changes);
      }
    }

    return lines.join("\n");
  } catch (error) {
    return `❌ Error analyzing transaction: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
