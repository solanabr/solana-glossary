import { describe, it, expect } from "vitest";
import {
  costMicros,
  loadConfig,
  maxOutForTier,
  modelForTier,
  moreRestrictiveTier,
  tierFromPct,
} from "./config.js";

describe("tierFromPct — budget ladder", () => {
  const cfg = loadConfig({});
  it("maps spend percentages to the correct tier", () => {
    expect(tierFromPct(0, cfg)).toBe("normal");
    expect(tierFromPct(69.9, cfg)).toBe("normal");
    expect(tierFromPct(70, cfg)).toBe("economy");
    expect(tierFromPct(84.9, cfg)).toBe("economy");
    expect(tierFromPct(85, cfg)).toBe("canned");
    expect(tierFromPct(99.9, cfg)).toBe("canned");
    expect(tierFromPct(100, cfg)).toBe("resting");
    expect(tierFromPct(250, cfg)).toBe("resting");
  });
});

describe("moreRestrictiveTier", () => {
  it("picks the tier that serves less", () => {
    expect(moreRestrictiveTier("normal", "canned")).toBe("canned");
    expect(moreRestrictiveTier("resting", "economy")).toBe("resting");
    expect(moreRestrictiveTier("normal", "normal")).toBe("normal");
  });
});

describe("costMicros", () => {
  const cfg = loadConfig({});
  it("prices Flash at $0.30 in / $2.50 out per 1M tokens", () => {
    expect(costMicros(cfg.geminiModel, 1_000_000, 0, cfg)).toBe(300_000);
    expect(costMicros(cfg.geminiModel, 0, 1_000_000, cfg)).toBe(2_500_000);
    expect(costMicros(cfg.geminiModel, 1_000_000, 1_000_000, cfg)).toBe(
      2_800_000,
    );
  });
  it("prices Flash-Lite cheaper", () => {
    expect(costMicros(cfg.geminiModelLite, 1_000_000, 1_000_000, cfg)).toBe(
      500_000,
    );
  });
  it("defaults unknown models to Flash pricing", () => {
    expect(costMicros("mystery-model", 0, 1_000_000, cfg)).toBe(2_500_000);
  });
});

describe("modelForTier / maxOutForTier", () => {
  const cfg = loadConfig({});
  it("quiz always uses the Lite model", () => {
    expect(modelForTier("quiz", "normal", cfg)).toBe(cfg.geminiModelLite);
    expect(modelForTier("quiz", "economy", cfg)).toBe(cfg.geminiModelLite);
  });
  it("copilot/apply drop to Lite under economy", () => {
    expect(modelForTier("copilot", "normal", cfg)).toBe(cfg.geminiModel);
    expect(modelForTier("copilot", "economy", cfg)).toBe(cfg.geminiModelLite);
    expect(modelForTier("apply-code", "normal", cfg)).toBe(cfg.geminiModel);
    expect(modelForTier("apply-code", "economy", cfg)).toBe(
      cfg.geminiModelLite,
    );
  });
  it("economy caps output tokens lower than normal", () => {
    expect(maxOutForTier("copilot", "economy", cfg)).toBeLessThan(
      maxOutForTier("copilot", "normal", cfg),
    );
  });
});

describe("loadConfig — capability detection", () => {
  it("degrades gracefully with no cloud creds", () => {
    const cfg = loadConfig({});
    expect(cfg.hasGemini).toBe(false);
    expect(cfg.hasUpstash).toBe(false);
    expect(cfg.hasTurnstile).toBe(false);
    expect(cfg.aiEnabled).toBe(true); // default-on flag
    expect(cfg.warnings.length).toBeGreaterThan(0);
  });
  it("detects configured capabilities", () => {
    const cfg = loadConfig({
      GEMINI_API_KEY: "k",
      UPSTASH_REDIS_REST_URL: "https://x",
      UPSTASH_REDIS_REST_TOKEN: "t",
      TURNSTILE_SECRET_KEY: "s",
      AI_FORCE_TIER: "economy",
      COPILOT_ENABLED: "false",
    });
    expect(cfg.hasGemini).toBe(true);
    expect(cfg.hasUpstash).toBe(true);
    expect(cfg.hasTurnstile).toBe(true);
    expect(cfg.forceTier).toBe("economy");
    expect(cfg.copilotEnabled).toBe(false);
  });
  it("ignores an invalid AI_FORCE_TIER", () => {
    expect(loadConfig({ AI_FORCE_TIER: "bogus" }).forceTier).toBeNull();
  });
});

describe("loadConfig — prod-weakening warnings", () => {
  it("warns when AI_FORCE_TIER=normal in production", () => {
    const cfg = loadConfig({
      VERCEL_ENV: "production",
      AI_FORCE_TIER: "normal",
    });
    expect(cfg.warnings.some((w) => w.includes("AI_FORCE_TIER=normal"))).toBe(
      true,
    );
  });

  it("warns when ALLOW_UNMETERED_AI=1 in production", () => {
    const cfg = loadConfig({
      VERCEL_ENV: "production",
      ALLOW_UNMETERED_AI: "1",
    });
    expect(cfg.warnings.some((w) => w.includes("ALLOW_UNMETERED_AI"))).toBe(
      true,
    );
  });

  it("does not emit prod-weakening warnings in dev", () => {
    const cfg = loadConfig({
      AI_FORCE_TIER: "normal",
      ALLOW_UNMETERED_AI: "1",
    });
    expect(cfg.warnings.some((w) => w.includes("AI_FORCE_TIER=normal"))).toBe(
      false,
    );
  });
});
