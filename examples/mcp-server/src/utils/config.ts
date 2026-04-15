/**
 * Environment & Service Configuration
 *
 * Centralizes all external service endpoints and environment variable handling.
 * Uses public endpoints by default. For better rate limits, set env vars:
 *   SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
 *   JUPITER_API_KEY=YOUR_KEY
 */

export interface ServiceConfig {
  solanaRpcUrl: string;
  jupiterApiUrl: string;
  jupiterApiKey: string;
  requestTimeoutMs: number;
}

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config: ServiceConfig = {
  solanaRpcUrl: getEnv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com"),
  jupiterApiUrl: getEnv("JUPITER_API_URL", "https://api.jup.ag"),
  jupiterApiKey: getEnv("JUPITER_API_KEY", ""),
  requestTimeoutMs: parseInt(getEnv("REQUEST_TIMEOUT_MS", "10000"), 10),
};

/**
 * Check if live Solana services are configured and reachable.
 * Returns a status report for startup logging.
 */
export async function checkServiceStatus(): Promise<{
  rpc: boolean;
  jupiter: boolean;
  rpcUrl: string;
}> {
  let rpcOk = false;
  let jupiterOk = false;

  try {
    const res = await fetch(config.solanaRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
      signal: AbortSignal.timeout(5000),
    });
    rpcOk = res.ok;
  } catch {
    rpcOk = false;
  }

  try {
    const res = await fetch("https://lite-api.jup.ag/swap/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000000&slippageBps=50", {
      signal: AbortSignal.timeout(5000),
    });
    jupiterOk = res.ok;
  } catch {
    jupiterOk = false;
  }

  return { rpc: rpcOk, jupiter: jupiterOk, rpcUrl: config.solanaRpcUrl };
}
