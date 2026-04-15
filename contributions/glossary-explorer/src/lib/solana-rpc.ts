/**
 * Minimal Solana RPC client for fetching live network data.
 * Uses public endpoints, no API key needed.
 */

const MAINNET_RPC = "https://api.mainnet-beta.solana.com";

interface RpcResponse<T> {
  jsonrpc: string;
  id: number;
  result: T;
}

async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(MAINNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!res.ok) throw new Error(`RPC error: ${res.status}`);
  const data: RpcResponse<T> = await res.json();
  return data.result;
}

export interface SolanaNetworkStats {
  slot: number;
  epoch: number;
  epochProgress: number; // 0-100
  blockHeight: number;
  tps: number;
  totalTransactions: number;
  activeValidators: number;
  solSupply: number;
  timestamp: number;
}

/** Fetch current epoch info */
export async function getEpochInfo(): Promise<{
  epoch: number;
  slotIndex: number;
  slotsInEpoch: number;
  absoluteSlot: number;
  blockHeight: number;
}> {
  return rpcCall("getEpochInfo");
}

/** Fetch recent performance samples for TPS calculation */
export async function getRecentTps(): Promise<number> {
  const samples = await rpcCall<
    Array<{
      numTransactions: number;
      numSlots: number;
      samplePeriodSecs: number;
    }>
  >("getRecentPerformanceSamples", [1]);

  if (samples.length === 0) return 0;
  const sample = samples[0];
  return Math.round(sample.numTransactions / sample.samplePeriodSecs);
}

/** Fetch vote accounts (validators) */
export async function getValidatorCount(): Promise<number> {
  const result = await rpcCall<{
    current: Array<unknown>;
    delinquent: Array<unknown>;
  }>("getVoteAccounts");
  return result.current.length;
}

/** Fetch SOL supply */
export async function getSupply(): Promise<number> {
  const result = await rpcCall<{ value: { total: number } }>("getSupply", [
    { excludeNonCirculatingAccountsList: true },
  ]);
  return result.value.total / 1e9; // Convert lamports to SOL
}

/** Fetch all network stats in one go */
export async function getNetworkStats(): Promise<SolanaNetworkStats> {
  try {
    const [epochInfo, tps, validators] = await Promise.all([
      getEpochInfo(),
      getRecentTps(),
      getValidatorCount(),
    ]);

    return {
      slot: epochInfo.absoluteSlot,
      epoch: epochInfo.epoch,
      epochProgress: Math.round(
        (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100,
      ),
      blockHeight: epochInfo.blockHeight,
      tps,
      totalTransactions: 0, // Skip to avoid rate limiting
      activeValidators: validators,
      solSupply: 0, // Skip to avoid rate limiting
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Failed to fetch network stats:", error);
    return {
      slot: 0,
      epoch: 0,
      epochProgress: 0,
      blockHeight: 0,
      tps: 0,
      totalTransactions: 0,
      activeValidators: 0,
      solSupply: 0,
      timestamp: Date.now(),
    };
  }
}

/** Map glossary term IDs to relevant live stats */
export function getRelevantStatsForTerm(
  termId: string,
  stats: SolanaNetworkStats,
): { label: string; value: string; labelPt: string; labelEs: string }[] {
  const relevant: {
    label: string;
    value: string;
    labelPt: string;
    labelEs: string;
  }[] = [];

  switch (termId) {
    case "slot":
      relevant.push({
        label: "Current Slot",
        value: stats.slot.toLocaleString(),
        labelPt: "Slot Atual",
        labelEs: "Slot Actual",
      });
      break;
    case "epoch":
      relevant.push(
        {
          label: "Current Epoch",
          value: stats.epoch.toLocaleString(),
          labelPt: "Epoch Atual",
          labelEs: "Epoch Actual",
        },
        {
          label: "Epoch Progress",
          value: `${stats.epochProgress}%`,
          labelPt: "Progresso do Epoch",
          labelEs: "Progreso del Epoch",
        },
      );
      break;
    case "block":
    case "block-height":
      relevant.push({
        label: "Block Height",
        value: stats.blockHeight.toLocaleString(),
        labelPt: "Altura do Bloco",
        labelEs: "Altura del Bloque",
      });
      break;
    case "validator":
    case "vote-account":
      relevant.push({
        label: "Active Validators",
        value: stats.activeValidators.toLocaleString(),
        labelPt: "Validadores Ativos",
        labelEs: "Validadores Activos",
      });
      break;
    case "transaction":
    case "tps":
    case "transactions-per-second":
      relevant.push({
        label: "Current TPS",
        value: stats.tps.toLocaleString(),
        labelPt: "TPS Atual",
        labelEs: "TPS Actual",
      });
      break;
    case "sol":
    case "lamport":
      if (stats.solSupply > 0) {
        relevant.push({
          label: "Total SOL Supply",
          value: `${(stats.solSupply / 1e6).toFixed(1)}M SOL`,
          labelPt: "Fornecimento Total de SOL",
          labelEs: "Suministro Total de SOL",
        });
      }
      break;
    case "solana":
    case "mainnet-beta":
      relevant.push(
        {
          label: "Current TPS",
          value: stats.tps.toLocaleString(),
          labelPt: "TPS Atual",
          labelEs: "TPS Actual",
        },
        {
          label: "Active Validators",
          value: stats.activeValidators.toLocaleString(),
          labelPt: "Validadores Ativos",
          labelEs: "Validadores Activos",
        },
        {
          label: "Current Epoch",
          value: stats.epoch.toLocaleString(),
          labelPt: "Epoch Atual",
          labelEs: "Epoch Actual",
        },
      );
      break;
    default:
      break;
  }

  return relevant;
}
