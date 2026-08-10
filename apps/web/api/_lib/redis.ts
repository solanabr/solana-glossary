// Shared Upstash Redis (REST) client. Connectionless HTTP, safe to construct
// once and reuse across budget/cache/ratelimit. Returns null when Upstash is
// not configured so callers fall back to their degraded paths.

import { Redis } from "@upstash/redis";
import { config } from "./config.js";

/** The subset of Upstash Redis that budget/cache rely on (fakeable in tests). */
export interface RedisLike {
  get(key: string): Promise<unknown>;
  set(
    key: string,
    value: string | number,
    opts?: { ex?: number; nx?: boolean },
  ): Promise<unknown>;
  incrby(key: string, amount: number): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

let cached: Redis | null | undefined;

/** Lazily build the singleton client (or null when Upstash is absent). */
export function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  cached = config.hasUpstash
    ? new Redis({ url: config.upstashUrl, token: config.upstashToken })
    : null;
  return cached;
}
