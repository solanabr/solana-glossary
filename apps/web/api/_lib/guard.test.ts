import { describe, it, expect } from "vitest";
import { createGuard, encodeSseDelta, sseFromText } from "./guard";
import { createBudget } from "./budget";
import { createTurnstile } from "./turnstile";
import { loadConfig } from "./config";
import { FakeRedis, throwingRedis } from "./testutil";
import type { RateLimiter } from "./ratelimit";

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
