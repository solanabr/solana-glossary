/**
 * simulate_swap — Jupiter swap simulation (read-only)
 *
 * Gets a swap quote from Jupiter's aggregator without executing.
 * Shows expected output, price impact, route, and slippage.
 */

import { z } from "zod";
import { getSwapQuote, resolveToken, KNOWN_TOKENS } from "../../services/jupiter.js";
import { formatUsd, shortenAddress } from "../../utils/format.js";

const knownSymbols = KNOWN_TOKENS.map((t) => t.symbol).join(", ");

export const simulateSwapSchema = z.object({
  inputToken: z.string().describe(`Input token symbol or mint address. Known: ${knownSymbols}`),
  outputToken: z.string().describe(`Output token symbol or mint address. Known: ${knownSymbols}`),
  amount: z.number().positive().describe("Amount of input token to swap (human-readable, e.g. 1.5 for 1.5 SOL)"),
  slippageBps: z.number().min(1).max(5000).optional().describe("Slippage tolerance in basis points (default: 50 = 0.5%, max: 5000 = 50%)"),
});

export type SimulateSwapInput = z.infer<typeof simulateSwapSchema>;

export async function simulateSwapTool(input: SimulateSwapInput): Promise<string> {
  try {
    const quote = await getSwapQuote(
      input.inputToken,
      input.outputToken,
      input.amount,
      input.slippageBps ?? 50
    );

    if (!quote) {
      return [
        `❌ Could not get a swap quote for ${input.amount} ${input.inputToken} → ${input.outputToken}.`,
        ``,
        `Possible reasons:`,
        `  • Unknown token symbol — try using the mint address instead`,
        `  • No liquidity for this pair`,
        `  • Amount too small or too large`,
        ``,
        `Known tokens: ${knownSymbols}`,
      ].join("\n");
    }

    const inputToken = resolveToken(input.inputToken);
    const outputToken = resolveToken(input.outputToken);

    const inputDecimals = inputToken?.decimals ?? 9;
    const outputDecimals = outputToken?.decimals ?? 6;

    const outAmount = parseInt(quote.outAmount) / Math.pow(10, outputDecimals);
    const minReceived = parseInt(quote.otherAmountThreshold) / Math.pow(10, outputDecimals);
    const priceImpact = parseFloat(quote.priceImpactPct);

    // Calculate effective rate
    const rate = outAmount / input.amount;

    const lines = [
      `🔄 **Swap Simulation** (read-only, no execution)`,
      ``,
      `  • **Input:** ${input.amount} ${quote.inputSymbol}`,
      `  • **Output:** ~${outAmount.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${quote.outputSymbol}`,
      `  • **Minimum received:** ${minReceived.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${quote.outputSymbol}`,
      `  • **Rate:** 1 ${quote.inputSymbol} = ${rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${quote.outputSymbol}`,
      `  • **Price impact:** ${priceImpact.toFixed(4)}%`,
      `  • **Slippage:** ${(quote.slippageBps / 100).toFixed(2)}%`,
    ];

    // Price impact warning
    if (priceImpact > 1) {
      lines.push(``, `⚠️ **High price impact!** Consider reducing the swap amount.`);
    } else if (priceImpact > 5) {
      lines.push(``, `🚨 **Very high price impact!** This swap would significantly move the market.`);
    }

    // Route info
    if (quote.routePlan.length > 0) {
      lines.push(``, `🗺️ **Route** (${quote.routePlan.length} step${quote.routePlan.length > 1 ? "s" : ""}):`);
      for (const step of quote.routePlan) {
        const label = step.swapInfo.label || "Unknown DEX";
        const pct = step.percent;
        lines.push(`  ${pct}% → ${label}`);
      }
    }

    lines.push(
      ``,
      `⚠️ _This is a simulation only. No tokens were swapped. Prices may change._`
    );

    return lines.join("\n");
  } catch (error) {
    return `❌ Error simulating swap: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
