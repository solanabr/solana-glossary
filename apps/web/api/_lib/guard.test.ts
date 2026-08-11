import { describe, it, expect } from "vitest";
import { clientIp, createGuard, encodeSseDelta, sseFromText } from "./guard.js";
import { createBudget } from "./budget.js";
import { createTurnstile } from "./turnstile.js";
import { loadConfig } from "./config.js";
import { FakeRedis, throwingRedis } from "./testutil.js";
import type { RateLimiter } from "./ratelimit.js";

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/copilot", {
    method: "POST",
    headers,
  });
}

const passRL: RateLimiter = { check: async () => ({ ok: true }) };
const denyRL: RateLimiter = {
  check: async () => ({ ok: false, retryAfterSec: 12 }),
};

const meteredEnv = {
  GEMINI_API_KEY: "k",
  UPSTASH_REDIS_REST_URL: "https://x",
  UPSTASH_REDIS_REST_TOKEN: "t",
};

describe("withGuard — fail-safe", () => {
  it("budget-store error yields canned tier, not blind spend", async () => {
    const cfg = loadConfig(meteredEnv);
    const guard = createGuard({
      config: cfg,
      turnstile: createTurnstile({ config: cfg }),
      rateLimiter: passRL,
      budget: createBudget({ config: cfg, redis: throwingRedis }),
    });

    const outcome = await guard.withGuard("copilot", req(), { locale: "en" });
    expect(outcome.ok).toBe(true);
    expect(outcome.tier).toBe("canned");
  });
});

describe("withGuard — rejections", () => {
  function guardWith(env: Record<string, string>, rl: RateLimiter = passRL) {
    const cfg = loadConfig(env);
    return createGuard({
      config: cfg,
      turnstile: createTurnstile({ config: cfg }),
      rateLimiter: rl,
      budget: createBudget({ config: cfg, redis: new FakeRedis() }),
    });
  }

  it("429s when rate-limited, with Retry-After", async () => {
    const guard = guardWith(meteredEnv, denyRL);
    const outcome = await guard.withGuard("copilot", req(), { locale: "en" });
    expect(outcome.ok).toBe(false);
    expect(outcome.response?.status).toBe(429);
    expect(outcome.response?.headers.get("Retry-After")).toBe("12");
  });

  it("returns {mode:disabled} when the feature flag is off", async () => {
    const guard = guardWith({ GEMINI_API_KEY: "k", COPILOT_ENABLED: "false" });
    const outcome = await guard.withGuard("copilot", req(), { locale: "en" });
    expect(outcome.ok).toBe(false);
    expect(outcome.response?.status).toBe(200);
    expect(await outcome.response?.json()).toEqual({ mode: "disabled" });
  });

  it("is disabled without a Gemini key", async () => {
    const guard = guardWith({});
    const outcome = await guard.withGuard("copilot", req(), { locale: "en" });
    expect(outcome.ok).toBe(false);
    expect(await outcome.response?.json()).toEqual({ mode: "disabled" });
  });

  it("400s a tripped honeypot", async () => {
    const guard = guardWith(meteredEnv);
    const outcome = await guard.withGuard("copilot", req(), {
      website: "spam",
      locale: "en",
    });
    expect(outcome.ok).toBe(false);
    expect(outcome.response?.status).toBe(400);
  });
});

describe("withGuard — session gating", () => {
  function sessionGuard() {
    const cfg = loadConfig({ ...meteredEnv, TURNSTILE_SECRET_KEY: "s" });
    const turnstile = createTurnstile({ config: cfg });
    const guard = createGuard({
      config: cfg,
      turnstile,
      rateLimiter: passRL,
      budget: createBudget({ config: cfg, redis: new FakeRedis() }),
    });
    return { guard, turnstile };
  }

  it("401s when a session is required but missing", async () => {
    const { guard } = sessionGuard();
    const outcome = await guard.withGuard("copilot", req(), { locale: "en" });
    expect(outcome.ok).toBe(false);
    expect(outcome.response?.status).toBe(401);
  });

  it("accepts a validly minted session and binds its identity", async () => {
    const { guard, turnstile } = sessionGuard();
    const minted = turnstile.mintSession("ip_abc");
    const outcome = await guard.withGuard(
      "copilot",
      req({ "x-ai-session": minted.token }),
      { locale: "en" },
    );
    expect(outcome.ok).toBe(true);
    expect(outcome.identity).toBe("ip_abc");
  });
});

describe("withGuard — unmetered (cache-hit) mode", () => {
  it("skips the rate limiter entirely", async () => {
    const cfg = loadConfig(meteredEnv);
    const guard = createGuard({
      config: cfg,
      turnstile: createTurnstile({ config: cfg }),
      rateLimiter: denyRL, // would 429 any metered request
      budget: createBudget({ config: cfg, redis: new FakeRedis() }),
    });
    const outcome = await guard.withGuard(
      "copilot",
      req(),
      { locale: "en" },
      { metered: false },
    );
    expect(outcome.ok).toBe(true);
  });

  it("still requires a session when Turnstile is configured", async () => {
    const cfg = loadConfig({ ...meteredEnv, TURNSTILE_SECRET_KEY: "s" });
    const guard = createGuard({
      config: cfg,
      turnstile: createTurnstile({ config: cfg }),
      rateLimiter: passRL,
      budget: createBudget({ config: cfg, redis: new FakeRedis() }),
    });
    const outcome = await guard.withGuard(
      "copilot",
      req(),
      { locale: "en" },
      { metered: false },
    );
    expect(outcome.ok).toBe(false);
    expect(outcome.response?.status).toBe(401);
  });

  it("still honors the feature flag", async () => {
    const cfg = loadConfig({ GEMINI_API_KEY: "k", COPILOT_ENABLED: "false" });
    const guard = createGuard({
      config: cfg,
      turnstile: createTurnstile({ config: cfg }),
      rateLimiter: passRL,
      budget: createBudget({ config: cfg, redis: new FakeRedis() }),
    });
    const outcome = await guard.withGuard(
      "copilot",
      req(),
      { locale: "en" },
      { metered: false },
    );
    expect(outcome.ok).toBe(false);
    expect(await outcome.response?.json()).toEqual({ mode: "disabled" });
  });
});

describe("SSE helpers — client wire contract", () => {
  it("encodeSseDelta emits the OpenAI delta shape", () => {
    expect(encodeSseDelta("hi")).toBe(
      `data: ${JSON.stringify({ choices: [{ delta: { content: "hi" } }] })}\n\n`,
    );
  });

  it("sseFromText streams the text then terminates with [DONE]", async () => {
    const text = await sseFromText("hello").text();
    expect(text).toContain('"content":"hello"');
    expect(text.trimEnd().endsWith("data: [DONE]")).toBe(true);
  });

  it("sseFromText emits only [DONE] for empty text", async () => {
    const text = await sseFromText("").text();
    expect(text).toBe("data: [DONE]\n\n");
  });
});

describe("clientIp — anti-spoof (X-Forwarded-For)", () => {
  it("prefers platform x-vercel-forwarded-for over a client x-forwarded-for", () => {
    const r = new Request("http://x", {
      method: "POST",
      headers: {
        "x-forwarded-for": "6.6.6.6",
        "x-vercel-forwarded-for": "1.2.3.4",
      },
    });
    expect(clientIp(r)).toBe("1.2.3.4");
  });

  it("prefers x-real-ip over x-forwarded-for", () => {
    const r = new Request("http://x", {
      method: "POST",
      headers: { "x-forwarded-for": "6.6.6.6", "x-real-ip": "9.9.9.9" },
    });
    expect(clientIp(r)).toBe("9.9.9.9");
  });

  it("uses the rightmost valid XFF hop, never the spoofable leftmost", () => {
    const r = new Request("http://x", {
      method: "POST",
      headers: { "x-forwarded-for": "6.6.6.6, 10.0.0.1, 203.0.113.7" },
    });
    expect(clientIp(r)).toBe("203.0.113.7");
  });

  it("rejects junk and returns 0.0.0.0", () => {
    const r = new Request("http://x", {
      method: "POST",
      headers: { "x-forwarded-for": "not-an-ip" },
    });
    expect(clientIp(r)).toBe("0.0.0.0");
  });
});

describe("withGuard — prod fails closed on missing protections", () => {
  function prodGuard(extra: Record<string, string> = {}) {
    const cfg = loadConfig({
      GEMINI_API_KEY: "k",
      UPSTASH_REDIS_REST_URL: "https://x",
      UPSTASH_REDIS_REST_TOKEN: "t",
      VERCEL_ENV: "production",
      ...extra,
    });
    return createGuard({
      config: cfg,
      turnstile: createTurnstile({ config: cfg }),
      rateLimiter: passRL,
      budget: createBudget({ config: cfg, redis: new FakeRedis() }),
    });
  }

  it("disables when prod lacks Turnstile + session secret", async () => {
    const outcome = await prodGuard().withGuard("copilot", req(), {
      locale: "en",
    });
    expect(outcome.ok).toBe(false);
    expect(await outcome.response?.json()).toEqual({ mode: "disabled" });
  });

  it("allows prod when the explicit opt-out is set", async () => {
    const outcome = await prodGuard({ ALLOW_UNMETERED_AI: "1" }).withGuard(
      "copilot",
      req(),
      { locale: "en" },
    );
    expect(outcome.ok).toBe(true);
  });
});
