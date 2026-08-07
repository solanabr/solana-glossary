// Test-only helpers (not a route, not bundled). An in-memory RedisLike so
// budget/cache/guard tests run with zero cloud creds.

import type { RedisLike } from "./redis";

export class FakeRedis implements RedisLike {
  store = new Map<string, string | number>();

  async get(key: string): Promise<unknown> {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async set(key: string, value: string | number): Promise<unknown> {
    this.store.set(key, value);
    return "OK";
  }

  async incrby(key: string, amount: number): Promise<number> {
    const next = Number(this.store.get(key) ?? 0) + amount;
    this.store.set(key, next);
    return next;
  }

  async expire(): Promise<unknown> {
    return 1;
  }
}

/** A RedisLike whose reads/writes always throw — exercises fail-safe paths. */
export const throwingRedis: RedisLike = {
  get: async () => {
    throw new Error("redis down");
  },
  set: async () => {
    throw new Error("redis down");
  },
  incrby: async () => {
    throw new Error("redis down");
  },
  expire: async () => {
    throw new Error("redis down");
  },
};
