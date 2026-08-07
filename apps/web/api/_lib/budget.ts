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
  reserve(identity: string, micros: number): Promise<void>;
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

  async function incr(key: string, micros: number, ttl: number): Promise<void> {
    if (!redis || micros === 0) return;
    const total = await redis.incrby(key, micros);
    // Set the TTL only on first creation so we don't slide the window forward.
    if (total === micros) await redis.expire(key, ttl);
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

    async reserve(identity, micros): Promise<void> {
      if (micros <= 0) return;
      try {
        const now = new Date();
        await Promise.all([
          incr(globalDayKey(now), micros, DAY_TTL),
          incr(globalMonthKey(now), micros, MONTH_TTL),
          incr(userDayKey(identity, now), micros, DAY_TTL),
        ]);
      } catch (err) {
        console.warn("[budget] reserve failed (best-effort):", err);
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
