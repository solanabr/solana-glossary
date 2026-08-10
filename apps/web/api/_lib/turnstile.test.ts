import { describe, it, expect } from "vitest";
import { loadConfig } from "./config.js";
import { createTurnstile } from "./turnstile.js";

// Build a Turnstile with a fixed HMAC secret + Turnstile enforced, overridable.
function makeTurnstile(
  env: Record<string, string> = {},
  fetchImpl?: typeof fetch,
) {
  const config = loadConfig({
    TURNSTILE_SECRET_KEY: "test-turnstile-secret",
    SESSION_HMAC_SECRET: "test-hmac-secret",
    ...env,
  });
  return { config, turnstile: createTurnstile({ config, fetchImpl }) };
}

function fakeFetch(success: boolean): typeof fetch {
  return (async () => ({
    json: async () => ({ success }),
  })) as unknown as typeof fetch;
}

describe("turnstile — HMAC session tokens", () => {
  it("mint → verify round-trips with the bound identity", () => {
    const { turnstile } = makeTurnstile();
    const { token, expiresAt } = turnstile.mintSession("ip:1.2.3.4");
    expect(expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(turnstile.verifySession(token)).toEqual({
      valid: true,
      identity: "ip:1.2.3.4",
    });
  });

  it("rejects an expired token", () => {
    const { turnstile } = makeTurnstile({ SESSION_TTL_SEC: "-10" });
    const { token } = turnstile.mintSession("ip:x");
    expect(turnstile.verifySession(token).valid).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const { turnstile } = makeTurnstile();
    const { token } = turnstile.mintSession("ip:a");
    const dot = token.indexOf(".");
    const flippedFirst = token[0] === "A" ? "B" : "A";
    const tampered = flippedFirst + token.slice(1, dot) + token.slice(dot);
    expect(turnstile.verifySession(tampered).valid).toBe(false);
  });

  it("rejects a bad signature", () => {
    const { turnstile } = makeTurnstile();
    const { token } = turnstile.mintSession("ip:a");
    const payload = token.slice(0, token.indexOf("."));
    expect(turnstile.verifySession(`${payload}.deadbeef`).valid).toBe(false);
  });

  it("rejects tokens minted under a rotated secret", () => {
    const a = makeTurnstile({ SESSION_HMAC_SECRET: "secret-A" }).turnstile;
    const b = makeTurnstile({ SESSION_HMAC_SECRET: "secret-B" }).turnstile;
    const { token } = a.mintSession("ip:a");
    expect(b.verifySession(token).valid).toBe(false);
  });

  it("rejects malformed tokens", () => {
    const { turnstile } = makeTurnstile();
    expect(turnstile.verifySession(undefined).valid).toBe(false);
    expect(turnstile.verifySession("").valid).toBe(false);
    expect(turnstile.verifySession("no-dot-here").valid).toBe(false);
  });
});

describe("turnstile — verifyToken", () => {
  it("skips the gate when no secret is configured (dev)", async () => {
    const turnstile = createTurnstile({ config: loadConfig({}) });
    expect(turnstile.required).toBe(false);
    expect(await turnstile.verifyToken("anything")).toBe(true);
  });

  it("rejects a missing token when Turnstile is enforced", async () => {
    const { turnstile } = makeTurnstile();
    expect(turnstile.required).toBe(true);
    expect(await turnstile.verifyToken(undefined)).toBe(false);
  });

  it("returns true on siteverify success", async () => {
    const { turnstile } = makeTurnstile({}, fakeFetch(true));
    expect(await turnstile.verifyToken("tok")).toBe(true);
  });

  it("returns false on siteverify failure", async () => {
    const { turnstile } = makeTurnstile({}, fakeFetch(false));
    expect(await turnstile.verifyToken("tok")).toBe(false);
  });

  it("returns false (fails closed) when siteverify throws", async () => {
    const throwing = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const { turnstile } = makeTurnstile({}, throwing);
    expect(await turnstile.verifyToken("tok")).toBe(false);
  });
});
