// Micro-dollar spend accounting in Redis (INCRBY reserve-then-spend). Decides
// the serving Tier from max(dailyPct, monthlyPct), further capped per identity.
//
// Fail-safe (contract §0.2, §5): if the store errors, evaluate() returns
// `canned` — the route then serves the free SDK answer, never blind Gemini
// spend. Reserving the worst-case cost up front caps concurrent overshoot.

import {
  config,
  moreRestrictiveTier,
  tierFromPct,
  type Config,
} from "./config";
import { getRedis } from "./redis";
import type { RedisLike } from "./redis";
import type { Tier } from "./types";

export interface BudgetEvaluation {
  tier: Tier;
  /** True when metering was unavailable/errored (informational). */
  degraded: boolean;
}

export interface Budget {
  evaluate(identity: string): Promise<BudgetEvaluation>;
  /** Global tier only (no per-identity read) — for the cheap status endpoint. */
  globalTier(): Promise<Tier>;
  /** Reserve worst-case spend; returns the post-INCRBY global tier so callers
   *  can refuse in-flight once the running total crosses the resting ceiling. */
  reserve(identity: string, micros: number): Promise<Tier>;
  settle(
    identity: string,
    reservedMicros: number,
    actualMicros: number,
  ): Promise<void>;
}

const DAY_TTL = 60 * 60 * 24 * 2; // 2 days
const MONTH_TTL = 60 * 60 * 24 * 40; // 40 days

function dayStamp(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}
function monthStamp(d: Date): string {
  return d.toISOString().slice(0, 7).replace(/-/g, "");
}

function globalDayKey(d: Date): string {
  return `ai:spend:global:day:${dayStamp(d)}`;
}
function globalMonthKey(d: Date): string {
  return `ai:spend:global:month:${monthStamp(d)}`;
}
function userDayKey(id: string, d: Date): string {
  return `ai:spend:user:${id}:day:${dayStamp(d)}`;
}

function toNum(raw: unknown): number {
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function createBudget(deps: {
  config?: Config;
  redis?: RedisLike | null;
}): Budget {
  const cfg = deps.config ?? config;
  const redis = deps.redis ?? null;

  // Returns the post-increment running total (0 when unmetered).
  async function incr(
    key: string,
    micros: number,
    ttl: number,
  ): Promise<number> {
    if (!redis || micros === 0) return 0;
    const total = await redis.incrby(key, micros);
    // Set the TTL only on first creation so we don't slide the window forward.
    if (total === micros) await redis.expire(key, ttl);
    return total;
  }

  return {
    async evaluate(identity): Promise<BudgetEvaluation> {
      if (cfg.forceTier) return { tier: cfg.forceTier, degraded: false };
      if (!redis) return { tier: "normal", degraded: true };

      try {
        const now = new Date();
        const [gDay, gMonth, uDay] = await Promise.all([
          redis.get(globalDayKey(now)),
          redis.get(globalMonthKey(now)),
          redis.get(userDayKey(identity, now)),
        ]);

        const dailyPct = (toNum(gDay) / cfg.dailyBudgetMicros) * 100;
        const monthlyPct = (toNum(gMonth) / cfg.monthlyBudgetMicros) * 100;
        const userPct = (toNum(uDay) / cfg.userDailyBudgetMicros) * 100;

        const globalTier = tierFromPct(Math.max(dailyPct, monthlyPct), cfg);
        const userTier = tierFromPct(userPct, cfg);
        return {
          tier: moreRestrictiveTier(globalTier, userTier),
          degraded: false,
        };
      } catch (err) {
        // Store unreachable → fail into the free deterministic path.
        console.warn("[budget] evaluate failed, forcing canned tier:", err);
        return { tier: "canned", degraded: true };
      }
    },

    async globalTier(): Promise<Tier> {
      if (cfg.forceTier) return cfg.forceTier;
      if (!redis) return "normal";
      try {
        const now = new Date();
        const [gDay, gMonth] = await Promise.all([
          redis.get(globalDayKey(now)),
          redis.get(globalMonthKey(now)),
        ]);
        const dailyPct = (toNum(gDay) / cfg.dailyBudgetMicros) * 100;
        const monthlyPct = (toNum(gMonth) / cfg.monthlyBudgetMicros) * 100;
        return tierFromPct(Math.max(dailyPct, monthlyPct), cfg);
      } catch {
        return "normal"; // status display is fail-open; calls still gate.
      }
    },

    async reserve(identity, micros): Promise<Tier> {
      if (micros <= 0 || !redis) return cfg.forceTier ?? "normal";
      try {
        const now = new Date();
        const [gDay, gMonth] = await Promise.all([
          incr(globalDayKey(now), micros, DAY_TTL),
          incr(globalMonthKey(now), micros, MONTH_TTL),
          incr(userDayKey(identity, now), micros, DAY_TTL),
        ]);
        // A pinned tier deliberately bypasses the ladder (and ceiling); see the
        // AI_FORCE_TIER=normal boot warning.
        if (cfg.forceTier) return cfg.forceTier;
        const dailyPct = (gDay / cfg.dailyBudgetMicros) * 100;
        const monthlyPct = (gMonth / cfg.monthlyBudgetMicros) * 100;
        return tierFromPct(Math.max(dailyPct, monthlyPct), cfg);
      } catch (err) {
        console.warn("[budget] reserve failed (best-effort):", err);
        return cfg.forceTier ?? "normal";
      }
    },

    async settle(identity, reservedMicros, actualMicros): Promise<void> {
      const delta = actualMicros - reservedMicros;
      if (delta === 0) return;
      try {
        const now = new Date();
        await Promise.all([
          incr(globalDayKey(now), delta, DAY_TTL),
          incr(globalMonthKey(now), delta, MONTH_TTL),
          incr(userDayKey(identity, now), delta, DAY_TTL),
        ]);
      } catch (err) {
        console.warn("[budget] settle failed (best-effort):", err);
      }
    },
  };
}

/** Default singleton wired from env. */
export const budget: Budget = createBudget({ redis: getRedis() });
