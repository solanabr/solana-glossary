import { describe, it, expect, beforeEach } from "vitest";
import { createRateLimiter, __resetMemory } from "./ratelimit.js";
import { loadConfig } from "./config.js";

// No Upstash → the in-memory best-effort limiter (contract §3, §5).
const cfg = loadConfig({ GEMINI_API_KEY: "k" });

describe("ratelimit — in-memory fallback (no Upstash)", () => {
  beforeEach(() => __resetMemory());

  it("allows up to the per-minute limit then denies", async () => {
    const rl = createRateLimiter({ config: cfg, redis: null });
    const perMin = cfg.rateLimits.copilot.perMin;

    for (let i = 0; i < perMin; i++) {
      const res = await rl.check("copilot", "id-a", "1.1.1.1");
      expect(res.ok).toBe(true);
    }
    const denied = await rl.check("copilot", "id-a", "1.1.1.1");
    expect(denied.ok).toBe(false);
    expect(denied.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates identities", async () => {
    const rl = createRateLimiter({ config: cfg, redis: null });
    const perMin = cfg.rateLimits.copilot.perMin;

    for (let i = 0; i < perMin; i++) {
      await rl.check("copilot", "id-b", "2.2.2.2");
    }
    expect((await rl.check("copilot", "id-b", "2.2.2.2")).ok).toBe(false);
    // A different identity (and IP) is unaffected.
    expect((await rl.check("copilot", "id-c", "3.3.3.3")).ok).toBe(true);
  });

  it("does not record a denied request (denial is stable, not compounding)", async () => {
    const rl = createRateLimiter({ config: cfg, redis: null });
    const perMin = cfg.rateLimits.copilot.perMin;
    for (let i = 0; i < perMin; i++) await rl.check("quiz", "id-d", "4.4.4.4");

    const first = await rl.check("quiz", "id-d", "4.4.4.4");
    const second = await rl.check("quiz", "id-d", "4.4.4.4");
    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
  });
});
