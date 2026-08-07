import { describe, it, expect } from "vitest";
import { createBudget } from "./budget";
import { loadConfig } from "./config";
import { FakeRedis, throwingRedis } from "./testutil";

// Metered config: $10/day, high per-user cap so global-ladder tests aren't
// swamped by the per-identity cap.
function meteredConfig(extra: Record<string, string> = {}) {
  return loadConfig({
    GEMINI_API_KEY: "k",
    UPSTASH_REDIS_REST_URL: "https://x",
    UPSTASH_REDIS_REST_TOKEN: "t",
    AI_DAILY_BUDGET_USD: "10",
    AI_MONTHLY_BUDGET_USD: "200",
    AI_USER_DAILY_BUDGET_USD: "1000",
    ...extra,
  });
}

const ID = "ip_test";

describe("budget.evaluate — global ladder via reservations", () => {
  it("downgrades tier as global daily spend rises", async () => {
    const cfg = meteredConfig();
    const budget = createBudget({ config: cfg, redis: new FakeRedis() });

    // $10/day → 10_000_000 micros. 69% stays normal.
    await budget.reserve(ID, 6_900_000);
    expect((await budget.evaluate(ID)).tier).toBe("normal");

    // Cross 70% → economy (this is the reserve-then-spend overshoot cap: a
    // concurrent request now sees the raised spend and serves cheaper).
    await budget.reserve(ID, 200_000); // 71%
    expect((await budget.evaluate(ID)).tier).toBe("economy");

    await budget.reserve(ID, 1_500_000); // 86%
    expect((await budget.evaluate(ID)).tier).toBe("canned");

    await budget.reserve(ID, 1_500_000); // 101%
    expect((await budget.evaluate(ID)).tier).toBe("resting");
  });

  it("caps per identity even when the global budget is healthy", async () => {
    const cfg = loadConfig({
      GEMINI_API_KEY: "k",
      UPSTASH_REDIS_REST_URL: "https://x",
      UPSTASH_REDIS_REST_TOKEN: "t",
      AI_DAILY_BUDGET_USD: "1000", // global effectively unlimited here
      AI_USER_DAILY_BUDGET_USD: "0.05", // 50_000 micros per user/day
    });
    const budget = createBudget({ config: cfg, redis: new FakeRedis() });

    await budget.reserve(ID, 51_000); // >100% of the user's daily cap
    expect((await budget.evaluate(ID)).tier).toBe("resting");
  });

  it("settle reconciles an over-reservation back down", async () => {
    const cfg = meteredConfig();
    const budget = createBudget({ config: cfg, redis: new FakeRedis() });

    await budget.reserve(ID, 9_000_000); // 90% → canned
    expect((await budget.evaluate(ID)).tier).toBe("canned");

    // Actual spend was tiny; settle releases the difference → back to normal.
    await budget.settle(ID, 9_000_000, 500_000);
    expect((await budget.evaluate(ID)).tier).toBe("normal");
  });
});

describe("budget.evaluate — fail-safe", () => {
  it("returns canned (never blind spend) when the store errors", async () => {
    const cfg = meteredConfig();
    const budget = createBudget({ config: cfg, redis: throwingRedis });
    const result = await budget.evaluate(ID);
    expect(result.tier).toBe("canned");
    expect(result.degraded).toBe(true);
  });

  it("honors AI_FORCE_TIER over metering", async () => {
    const cfg = meteredConfig({ AI_FORCE_TIER: "resting" });
    const budget = createBudget({ config: cfg, redis: new FakeRedis() });
    expect((await budget.evaluate(ID)).tier).toBe("resting");
  });

  it("without Upstash reports normal + degraded (dev best-effort)", async () => {
    const cfg = loadConfig({ GEMINI_API_KEY: "k" });
    const budget = createBudget({ config: cfg, redis: null });
    const result = await budget.evaluate(ID);
    expect(result.tier).toBe("normal");
    expect(result.degraded).toBe(true);
  });
});
