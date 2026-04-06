/**
 * get_wallet_balance — SOL balance + USD conversion
 */

import { z } from "zod";
import { getBalance, isValidAddress } from "../../services/solana-rpc.js";
import { getTokenPrice } from "../../services/jupiter.js";
import { formatSol, formatUsd, shortenAddress } from "../../utils/format.js";

export const getWalletBalanceSchema = z.object({
  address: z.string().describe("Solana wallet address (base58 public key)"),
});

export type GetWalletBalanceInput = z.infer<typeof getWalletBalanceSchema>;

export async function getWalletBalance(input: GetWalletBalanceInput): Promise<string> {
  if (!isValidAddress(input.address)) {
    return `❌ Invalid Solana address: "${input.address}"\n\nA valid Solana address is a base58-encoded string of 32-44 characters.`;
  }

  try {
    const balance = await getBalance(input.address);

    // Get SOL price for USD conversion
    let usdValue = "";
    try {
      const solPrice = await getTokenPrice("SOL");
      if (solPrice) {
        const usd = balance.sol * solPrice.price;
        usdValue = ` (${formatUsd(usd)} @ ${formatUsd(solPrice.price)}/SOL)`;
      }
    } catch {
      // USD conversion optional
    }

    const lines = [
      `💰 **Wallet Balance**`,
      ``,
      `  • **Address:** ${shortenAddress(input.address)}`,
      `  • **SOL:** ${formatSol(balance.lamports)}${usdValue}`,
      `  • **Lamports:** ${balance.lamports.toLocaleString()}`,
    ];

    if (balance.sol === 0) {
      lines.push(``, `⚠️ This wallet has zero SOL balance.`);
    }

    return lines.join("\n");
  } catch (error) {
    return `❌ Error fetching balance: ${error instanceof Error ? error.message : "Unknown error"}\n\nMake sure the address is valid and try again.`;
  }
}
