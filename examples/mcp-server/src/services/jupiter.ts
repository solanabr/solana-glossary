/**
 * Jupiter API Service
 *
 * Uses Jupiter Lite API (https://lite-api.jup.ag) — no auth required, free tier.
 *
 * Price API v2 and swap/v6 on api.jup.ag require auth and may be network-restricted.
 * The lite-api quote endpoint is confirmed working and is used for both price
 * derivation (token→USDC quote) and swap simulation.
 *
 * API key stored in config for future use if endpoints become available.
 */

import { config } from "../utils/config.js";

const LITE_QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// ─── Known Token Registry ────────────────────────────────────────

export interface KnownToken {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  coingeckoId?: string;
}

export const KNOWN_TOKENS: KnownToken[] = [
  { symbol: "SOL",     name: "Solana",              mint: "So11111111111111111111111111111111111111112",  decimals: 9, coingeckoId: "solana" },
  { symbol: "USDC",    name: "USD Coin",             mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, coingeckoId: "usd-coin" },
  { symbol: "USDT",    name: "Tether USD",           mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6, coingeckoId: "tether" },
  { symbol: "JUP",     name: "Jupiter",              mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",  decimals: 6, coingeckoId: "jupiter-exchange-solana" },
  { symbol: "RAY",     name: "Raydium",              mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",  decimals: 6, coingeckoId: "raydium" },
  { symbol: "BONK",    name: "Bonk",                 mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",  decimals: 5, coingeckoId: "bonk" },
  { symbol: "PYTH",    name: "Pyth Network",         mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",  decimals: 6, coingeckoId: "pyth-network" },
  { symbol: "WIF",     name: "dogwifhat",             mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",  decimals: 6, coingeckoId: "dogwifcoin" },
  { symbol: "ORCA",    name: "Orca",                 mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMs3RhJ3bR",   decimals: 6, coingeckoId: "orca" },
  { symbol: "MNDE",    name: "Marinade",             mint: "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey",   decimals: 9, coingeckoId: "marinade" },
  { symbol: "mSOL",    name: "Marinade Staked SOL",  mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",  decimals: 9, coingeckoId: "msol" },
  { symbol: "jitoSOL", name: "Jito Staked SOL",      mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",  decimals: 9, coingeckoId: "jito-staked-sol" },
  { symbol: "RENDER",  name: "Render Token",         mint: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",   decimals: 8, coingeckoId: "render-token" },
  { symbol: "HNT",     name: "Helium",               mint: "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux",  decimals: 8, coingeckoId: "helium" },
];

const tokenBySymbol = new Map(KNOWN_TOKENS.map((t) => [t.symbol.toUpperCase(), t]));
const tokenByMint   = new Map(KNOWN_TOKENS.map((t) => [t.mint, t]));

/** Resolve a token by symbol or mint address (case-insensitive symbol) */
export function resolveToken(symbolOrMint: string): KnownToken | undefined {
  return tokenBySymbol.get(symbolOrMint.toUpperCase()) ?? tokenByMint.get(symbolOrMint);
}

// ─── Price ───────────────────────────────────────────────────────

export interface TokenPrice {
  mint:   string;
  symbol: string;
  price:  number;
  source: string;
}

/**
 * Derive USD price of a token by quoting 1 token → USDC via Jupiter Lite API.
 * USDC is always returned as $1.00 without a network call.
 */
async function derivePrice(mint: string, decimals: number): Promise<number | null> {
  if (mint === USDC_MINT) return 1.0;

  try {
    const amount = Math.floor(Math.pow(10, decimals)); // 1 whole token
    const url = `${LITE_QUOTE}?inputMint=${mint}&outputMint=${USDC_MINT}&amount=${amount}&slippageBps=50`;
    const res = await fetch(url, { signal: AbortSignal.timeout(config.requestTimeoutMs) });
    if (!res.ok) return null;
    const data = (await res.json()) as { outAmount?: string };
    if (!data.outAmount) return null;
    // outAmount is in USDC base units (6 decimals)
    return parseInt(data.outAmount, 10) / 1_000_000;
  } catch {
    return null;
  }
}

/** Get USD prices for multiple tokens in parallel */
export async function getTokenPrices(mints: string[]): Promise<Map<string, TokenPrice>> {
  const result = new Map<string, TokenPrice>();
  if (mints.length === 0) return result;

  await Promise.all(
    mints.map(async (mint) => {
      const known    = tokenByMint.get(mint);
      const decimals = known?.decimals ?? 9;
      const price    = await derivePrice(mint, decimals);
      if (price !== null) {
        result.set(mint, {
          mint,
          symbol: known?.symbol ?? "???",
          price,
          source: "Jupiter Lite API (quote-derived)",
        });
      }
    })
  );

  return result;
}

/** Get USD price for a single token by symbol or mint */
export async function getTokenPrice(symbolOrMint: string): Promise<TokenPrice | null> {
  const token = resolveToken(symbolOrMint);
  const mint  = token?.mint ?? symbolOrMint;
  const prices = await getTokenPrices([mint]);
  return prices.get(mint) ?? null;
}

// ─── Swap Quote ──────────────────────────────────────────────────

export interface SwapQuote {
  inputMint:            string;
  outputMint:           string;
  inputSymbol:          string;
  outputSymbol:         string;
  inAmount:             string;
  outAmount:            string;
  otherAmountThreshold: string;
  priceImpactPct:       string;
  routePlan: Array<{
    swapInfo: {
      ammKey:    string;
      label:     string;
      inputMint: string;
      outputMint:string;
      inAmount:  string;
      outAmount: string;
      feeAmount: string;
      feeMint:   string;
    };
    percent: number;
  }>;
  slippageBps: number;
}

/**
 * Get a swap quote from Jupiter Lite API.
 * Simulation only — does NOT execute the swap.
 */
export async function getSwapQuote(
  inputSymbolOrMint:  string,
  outputSymbolOrMint: string,
  amount:             number,
  slippageBps = 50,
): Promise<SwapQuote | null> {
  const inputToken  = resolveToken(inputSymbolOrMint);
  const outputToken = resolveToken(outputSymbolOrMint);

  const inputMint    = inputToken?.mint  ?? inputSymbolOrMint;
  const outputMint   = outputToken?.mint ?? outputSymbolOrMint;
  const inputDecimals = inputToken?.decimals ?? 9;

  const amountRaw = Math.floor(amount * Math.pow(10, inputDecimals));

  try {
    const url = `${LITE_QUOTE}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountRaw}&slippageBps=${slippageBps}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(config.requestTimeoutMs),
    });

    if (!res.ok) throw new Error(`Jupiter quote returned ${res.status}`);

    const data = (await res.json()) as any;

    return {
      inputMint,
      outputMint,
      inputSymbol:          inputToken?.symbol  ?? "???",
      outputSymbol:         outputToken?.symbol ?? "???",
      inAmount:             data.inAmount,
      outAmount:            data.outAmount,
      otherAmountThreshold: data.otherAmountThreshold,
      priceImpactPct:       data.priceImpactPct,
      routePlan:            data.routePlan ?? [],
      slippageBps,
    };
  } catch {
    return null;
  }
}
