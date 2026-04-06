import { type CacheEntry, isFresh } from "./cache.js";

interface LiveNetworkStats {
  epoch: number;
  epochProgress: number;
  slotsRemaining: number;
  currentSlot: number;
  activeValidators: number;
  tps: number;
}

const RPC_URL = "https://api.mainnet-beta.solana.com";
const SLOT_MS = 400;

let statsCache: CacheEntry<LiveNetworkStats> | null = null;

async function rpcRequest<T>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1_500);
  let response: Response;
  try {
    response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    result?: T;
    error?: unknown;
  };

  if (!("result" in json) || json.error) {
    throw new Error("RPC result missing");
  }

  return json.result as T;
}

export async function getLiveNetworkStats(): Promise<LiveNetworkStats | null> {
  if (isFresh(statsCache)) return statsCache.value;

  try {
    const [epochInfo, voteAccounts, perfSamples] = await Promise.all([
      rpcRequest<{
        epoch: number;
        slotIndex: number;
        slotsInEpoch: number;
        absoluteSlot: number;
      }>("getEpochInfo"),
      rpcRequest<{
        current: unknown[];
      }>("getVoteAccounts"),
      rpcRequest<
        {
          numTransactions: number;
          samplePeriodSecs: number;
        }[]
      >("getRecentPerformanceSamples", [1]),
    ]);

    const sample = perfSamples[0];
    const tps =
      sample && sample.samplePeriodSecs > 0
        ? sample.numTransactions / sample.samplePeriodSecs
        : 0;

    const value: LiveNetworkStats = {
      epoch: epochInfo.epoch,
      epochProgress:
        epochInfo.slotsInEpoch > 0
          ? (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100
          : 0,
      slotsRemaining: Math.max(epochInfo.slotsInEpoch - epochInfo.slotIndex, 0),
      currentSlot: epochInfo.absoluteSlot,
      activeValidators: voteAccounts.current.length,
      tps,
    };

    statsCache = {
      value,
      expiresAt: Date.now() + 30_000,
    };

    return value;
  } catch {
    return null;
  }
}

const EPOCH_TERMS = new Set(["epoch", "leader-schedule"]);
const SLOT_TERMS = new Set(["slot", "block"]);
const VALIDATOR_TERMS = new Set(["validator", "vote-account", "stake"]);
const TPS_TERMS = new Set(["turbine", "proof-of-history", "tower-bft"]);

export async function getLiveStatsLine(termId: string): Promise<string | null> {
  if (
    !EPOCH_TERMS.has(termId) &&
    !SLOT_TERMS.has(termId) &&
    !VALIDATOR_TERMS.has(termId) &&
    !TPS_TERMS.has(termId)
  ) {
    return null;
  }

  const stats = await getLiveNetworkStats();
  if (!stats) return null;

  if (EPOCH_TERMS.has(termId)) {
    const hoursRemaining = Math.max(
      Math.round((stats.slotsRemaining * SLOT_MS) / 3_600_000),
      0,
    );
    return `📡 <b>Live:</b> Epoch ${stats.epoch} · ${stats.epochProgress.toFixed(1)}% · ${hoursRemaining}h remaining`;
  }

  if (SLOT_TERMS.has(termId)) {
    return `📡 <b>Live:</b> Current slot ${stats.currentSlot.toLocaleString("en-US")}`;
  }

  if (VALIDATOR_TERMS.has(termId)) {
    return `📡 <b>Live:</b> ${stats.activeValidators.toLocaleString("en-US")} active validators`;
  }

  if (TPS_TERMS.has(termId)) {
    return `📡 <b>Live:</b> Network ~${Math.round(stats.tps).toLocaleString("en-US")} TPS`;
  }

  return null;
}
