// Per-feature sliding-window rate limiting with a per-IP daily ceiling. Uses
// @upstash/ratelimit when Redis is configured, otherwise an in-memory
// best-effort limiter so the app still works with zero cloud creds.

import { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";
import { config, type Config } from "./config";
import { getRedis } from "./redis";
import type { AiFeature } from "./types";

export interface RateResult {
  ok: boolean;
  retryAfterSec?: number;
}

export interface RateLimiter {
  check(feature: AiFeature, identity: string, ip: string): Promise<RateResult>;
}

interface Window {
  name: "min" | "hour" | "day";
  limit: number;
  seconds: number;
}

function windowsFor(feature: AiFeature, cfg: Config): Window[] {
  const w = cfg.rateLimits[feature];
  return [
    { name: "min", limit: w.perMin, seconds: 60 },
    { name: "hour", limit: w.perHour, seconds: 3600 },
    { name: "day", limit: w.perDay, seconds: 86400 },
  ];
}

// ── in-memory fallback (module-level so it survives across calls) ──
const memory = new Map<string, number[]>();

function memPeek(
  key: string,
  limit: number,
  seconds: number,
  now: number,
): RateResult {
  const windowMs = seconds * 1000;
  const kept = (memory.get(key) ?? []).filter((ts) => now - ts < windowMs);
  memory.set(key, kept);
  if (kept.length >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((kept[0] + windowMs - now) / 1000),
    };
  }
  return { ok: true };
}

function memCommit(key: string, now: number): void {
  const arr = memory.get(key) ?? [];
  arr.push(now);
  memory.set(key, arr);
}

export function createRateLimiter(deps: {
  config?: Config;
  redis?: Redis | null;
}): RateLimiter {
  const cfg = deps.config ?? config;
  const redis = deps.redis ?? null;

  // Cache one Upstash limiter per (feature/window) + the IP ceiling.
  const upstashCache = new Map<string, Ratelimit>();
  const ephemeral = new Map<string, number>();

  function upstashLimiter(
    id: string,
    limit: number,
    seconds: number,
  ): Ratelimit {
    let rl = upstashCache.get(id);
    if (!rl) {
      rl = new Ratelimit({
        redis: redis as Redis,
        limiter: Ratelimit.slidingWindow(limit, `${seconds} s`),
        prefix: `ai:rl:${id}`,
        analytics: false,
        ephemeralCache: ephemeral,
      });
      upstashCache.set(id, rl);
    }
    return rl;
  }

  async function checkUpstash(
    feature: AiFeature,
    identity: string,
    ip: string,
  ): Promise<RateResult> {
    // Tightest window first so a burst trips the minute limit before the rest.
    for (const win of windowsFor(feature, cfg)) {
      const rl = upstashLimiter(
        `${feature}:${win.name}`,
        win.limit,
        win.seconds,
      );
      const res = await rl.limit(`${feature}:${identity}`);
      void res.pending?.catch(() => {});
      if (!res.success) {
        return { ok: false, retryAfterSec: retryFrom(res.reset) };
      }
    }
    const ipRl = upstashLimiter("ip:day", cfg.ipDailyCeiling, 86400);
    const ipRes = await ipRl.limit(`ip:${ip}`);
    void ipRes.pending?.catch(() => {});
    if (!ipRes.success)
      return { ok: false, retryAfterSec: retryFrom(ipRes.reset) };
    return { ok: true };
  }

  function checkMemory(
    feature: AiFeature,
    identity: string,
    ip: string,
  ): RateResult {
    const now = Date.now();
    const checks: Array<{ key: string; limit: number; seconds: number }> = [
      ...windowsFor(feature, cfg).map((w) => ({
        key: `${feature}:${identity}:${w.name}`,
        limit: w.limit,
        seconds: w.seconds,
      })),
      { key: `ip:${ip}:day`, limit: cfg.ipDailyCeiling, seconds: 86400 },
    ];

    // Peek every window; only record the hit if all of them pass.
    for (const c of checks) {
      const res = memPeek(c.key, c.limit, c.seconds, now);
      if (!res.ok) return res;
    }
    for (const c of checks) memCommit(c.key, now);
    return { ok: true };
  }

  return {
    async check(feature, identity, ip): Promise<RateResult> {
      if (redis) {
        try {
          return await checkUpstash(feature, identity, ip);
        } catch (err) {
          // Redis hiccup must not open the floodgates: fall back to in-memory.
          console.warn("[ratelimit] Upstash error, using in-memory:", err);
          return checkMemory(feature, identity, ip);
        }
      }
      return checkMemory(feature, identity, ip);
    },
  };
}

function retryFrom(resetMs: number): number {
  return Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
}

/** Test hook: clear the in-memory window store. */
export function __resetMemory(): void {
  memory.clear();
}

/** Default singleton wired from env. */
export const rateLimiter: RateLimiter = createRateLimiter({
  redis: getRedis(),
});
