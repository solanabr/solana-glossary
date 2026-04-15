/**
 * what_is_this_address — Intelligent address classification
 *
 * Determines whether a Solana address is a wallet, program, token mint,
 * token account, stake account, or vote account, with contextual details.
 */

import { z } from "zod";
import { classifyAddress, isValidAddress } from "../../services/solana-rpc.js";
import { shortenAddress } from "../../utils/format.js";

export const whatIsThisAddressSchema = z.object({
  address: z.string().describe("Solana address (base58 public key) to classify and analyze"),
});

export type WhatIsThisAddressInput = z.infer<typeof whatIsThisAddressSchema>;

export async function whatIsThisAddressTool(input: WhatIsThisAddressInput): Promise<string> {
  if (!isValidAddress(input.address)) {
    return `❌ Invalid Solana address: "${input.address}"\n\nA valid Solana address is a base58-encoded string of 32-44 characters.`;
  }

  try {
    const classification = await classifyAddress(input.address);

    const typeEmoji: Record<string, string> = {
      "known-program": "🏛️",
      "executable": "⚙️",
      "token-mint": "🪙",
      "token-account": "💳",
      "stake-account": "🥩",
      "vote-account": "🗳️",
      "wallet": "👛",
      "system": "🖥️",
      "unknown": "❓",
    };

    const emoji = typeEmoji[classification.type] ?? "❓";

    const lines = [
      `${emoji} **${classification.label}**`,
      ``,
      `  • **Address:** \`${input.address}\``,
      `  • **Type:** ${classification.type}`,
    ];

    // Add contextual details
    const details = classification.details;
    for (const [key, value] of Object.entries(details)) {
      if (value !== null && value !== undefined) {
        const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
        lines.push(`  • **${key}:** ${displayValue}`);
      }
    }

    // Add helpful suggestions based on type
    lines.push(``);
    switch (classification.type) {
      case "wallet":
        lines.push(`💡 _Try 'get_wallet_balance' for SOL balance or 'get_token_balance' for token holdings._`);
        break;
      case "token-mint":
        lines.push(`💡 _Try 'get_token_price' with this mint address for current price._`);
        break;
      case "known-program":
      case "executable":
        lines.push(`💡 _This is a program (smart contract). Use 'lookup_term' to learn more about Solana programs._`);
        break;
      case "stake-account":
        lines.push(`💡 _Use 'lookup_term staking' to learn about how Solana staking works._`);
        break;
      case "vote-account":
        lines.push(`💡 _This is a validator's vote account. Use 'lookup_term validator' to learn more._`);
        break;
      default:
        lines.push(`💡 _Use 'get_recent_transactions' to see activity on this address._`);
    }

    return lines.join("\n");
  } catch (error) {
    return `❌ Error classifying address: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
