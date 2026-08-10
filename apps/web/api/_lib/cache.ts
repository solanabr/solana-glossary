// Answer cache in Redis. Keyed by feature + locale + corpus version +
// sha256(canonical-prompt | sorted-rag-ids), so alias-equivalent prompts share
// a slot. Only Normal-tier answers are written; a hit bills $0 (but the guard
// has already spent a rate-limit token, since cache lookup follows rate check).

import { createHash } from "node:crypto";
import { config, type Config } from "./config.js";
import { CORPUS_VERSION } from "./glossary.js";
import { getRedis } from "./redis.js";
import type { RedisLike } from "./redis.js";
import type { AiFeature, Locale } from "./types.js";

export interface Cache {
  key(
    feature: AiFeature | string,
    locale: Locale,
    promptNorm: string,
    ragIds: string[],
  ): string;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export function createCache(deps: {
  config?: Config;
  redis?: RedisLike | null;
}): Cache {
  const cfg = deps.config ?? config;
  const redis = deps.redis ?? null;

  return {
    key(feature, locale, promptNorm, ragIds): string {
      const digest = createHash("sha256")
        .update(`${promptNorm}|${[...ragIds].sort().join(",")}`)
        .digest("hex");
      return `ai:cache:${feature}:${locale}:${CORPUS_VERSION}:${digest}`;
    },

    async get(key): Promise<string | null> {
      if (!redis) return null;
      try {
        const v = await redis.get(key);
        if (v == null) return null;
        return typeof v === "string" ? v : JSON.stringify(v);
      } catch (err) {
        console.warn("[cache] get failed:", err);
        return null;
      }
    },

    async set(key, value): Promise<void> {
      if (!redis) return;
      try {
        await redis.set(key, value, { ex: cfg.cacheTtlSec });
      } catch (err) {
        console.warn("[cache] set failed:", err);
      }
    },
  };
}

/** Default singleton wired from env. */
export const cache: Cache = createCache({ redis: getRedis() });
