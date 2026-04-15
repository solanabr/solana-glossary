/**
 * get_token_balance — SPL token holdings for a wallet
 * get_token_price — Real-time token price via Jupiter
 */

import { z } from "zod";
import { getTokenAccounts, isValidAddress } from "../../services/solana-rpc.js";
import { getTokenPrice as fetchTokenPrice, getTokenPrices, resolveToken, KNOWN_TOKENS } from "../../services/jupiter.js";
import { formatUsd, shortenAddress } from "../../utils/format.js";

// ─── get_token_balance ───────────────────────────────────────────

export const getTokenBalanceSchema = z.object({
  address: z.string().describe("Solana wallet address to check token holdings"),
  showEmpty: z.boolean().optional().describe("Include zero-balance token accounts (default: false)"),
});

export type GetTokenBalanceInput = z.infer<typeof getTokenBalanceSchema>;

export async function getTokenBalance(input: GetTokenBalanceInput): Promise<string> {
  if (!isValidAddress(input.address)) {
    return `❌ Invalid Solana address: "${input.address}"`;
  }

  try {
    const accounts = await getTokenAccounts(input.address);

    if (accounts.length === 0) {
      return `📭 No SPL token accounts found for ${shortenAddress(input.address)}.\n\nThis wallet may only hold SOL. Use 'get_wallet_balance' to check.`;
    }

    // Try to get prices for all mints
    const mints = accounts.map((a) => a.mint);
    let prices = new Map<string, number>();
    try {
      const priceData = await getTokenPrices(mints);
      for (const [mint, data] of priceData) {
        prices.set(mint, data.price);
      }
    } catch {
      // Prices are optional
    }

    const lines = [
      `🪙 **Token Holdings for ${shortenAddress(input.address)}** (${accounts.length} tokens):`,
      ``,
    ];

    let totalUsd = 0;

    for (const account of accounts) {
      const token = resolveToken(account.mint);
      const symbol = token?.symbol ?? shortenAddress(account.mint);
      const price = prices.get(account.mint);
      let valueStr = "";

      if (price && account.uiAmount > 0) {
        const value = account.uiAmount * price;
        totalUsd += value;
        valueStr = ` — ${formatUsd(value)}`;
      }

      lines.push(`  • **${symbol}:** ${account.uiAmount.toLocaleString()}${valueStr}`);
    }

    if (totalUsd > 0) {
      lines.push(``, `💵 **Estimated total value:** ${formatUsd(totalUsd)}`);
    }

    return lines.join("\n");
  } catch (error) {
    return `❌ Error fetching token accounts: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// ─── get_token_price ─────────────────────────────────────────────

export const getTokenPriceSchema = z.object({
  token: z.string().describe(`Token symbol or mint address. Known tokens: ${KNOWN_TOKENS.map((t) => t.symbol).join(", ")}`),
});

export type GetTokenPriceInput = z.infer<typeof getTokenPriceSchema>;

export async function getTokenPriceTool(input: GetTokenPriceInput): Promise<string> {
  try {
    const price = await fetchTokenPrice(input.token);

    if (!price) {
      return `❌ Could not find price for "${input.token}".\n\nKnown tokens: ${KNOWN_TOKENS.map((t) => t.symbol).join(", ")}\n\nYou can also pass a token mint address directly.`;
    }

    const token = resolveToken(input.token);

    const lines = [
      `📊 **${price.symbol} Price**`,
      ``,
      `  • **Price:** ${formatUsd(price.price)}`,
      `  • **Mint:** ${shortenAddress(price.mint)}`,
    ];

    if (token) {
      lines.push(`  • **Name:** ${token.name}`);
      lines.push(`  • **Decimals:** ${token.decimals}`);
    }

    lines.push(``, `_Source: ${price.source}_`);

    return lines.join("\n");
  } catch (error) {
    return `❌ Error fetching token price: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
