/**
 * Formatting Utilities
 *
 * SOL/USD formatting, address shortening, and LLM-friendly response builders.
 */

const LAMPORTS_PER_SOL = 1_000_000_000;

/** Convert lamports to SOL with up to 4 decimal places */
export function formatSol(lamports: number): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

/** Format a number as USD */
export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Shorten a Solana address: ABC...XYZ */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/** Format a timestamp (unix seconds) to human-readable */
export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

/** Build a structured LLM response section */
export function section(title: string, emoji: string, lines: string[]): string {
  return [`${emoji} **${title}**`, "", ...lines].join("\n");
}

/** Build a key-value pair line */
export function kv(key: string, value: string | number): string {
  return `  • **${key}:** ${value}`;
}
