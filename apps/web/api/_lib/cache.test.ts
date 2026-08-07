import { describe, it, expect } from "vitest";
import { createCache } from "./cache";
import { canonicalizePrompt, searchRag } from "./glossary";
import { loadConfig } from "./config";
import { FakeRedis } from "./testutil";

const cfg = loadConfig({});

describe("cache key normalization", () => {
  const cache = createCache({ config: cfg, redis: null });

  it("collapses alias-equivalent prompts to the same key", () => {
    const a = canonicalizePrompt("what's an AMM");
    const b = canonicalizePrompt("define amm");
    expect(a.norm).toBe("amm");
    expect(b.norm).toBe("amm");

    const keyA = cache.key("copilot", "en", a.norm, searchRag(a.norm).ids);
    const keyB = cache.key("copilot", "en", b.norm, searchRag(b.norm).ids);
    expect(keyA).toBe(keyB);
  });

  it("separates keys by feature, locale, and rag ids", () => {
    const base = cache.key("copilot", "en", "amm", ["amm"]);
    expect(cache.key("quiz", "en", "amm", ["amm"])).not.toBe(base);
    expect(cache.key("copilot", "pt", "amm", ["amm"])).not.toBe(base);
    expect(cache.key("copilot", "en", "amm", ["amm", "dex"])).not.toBe(base);
  });

  it("is stable regardless of rag id order", () => {
    expect(cache.key("copilot", "en", "x", ["b", "a"])).toBe(
      cache.key("copilot", "en", "x", ["a", "b"]),
    );
  });
});

describe("cache get/set", () => {
  it("returns null and no-ops without Redis", async () => {
    const cache = createCache({ config: cfg, redis: null });
    const key = cache.key("copilot", "en", "amm", ["amm"]);
    await cache.set(key, "hello");
    expect(await cache.get(key)).toBeNull();
  });

  it("round-trips a value through Redis", async () => {
    const cache = createCache({ config: cfg, redis: new FakeRedis() });
    const key = cache.key("copilot", "en", "amm", ["amm"]);
    expect(await cache.get(key)).toBeNull();
    await cache.set(key, "cached answer");
    expect(await cache.get(key)).toBe("cached answer");
  });
});
