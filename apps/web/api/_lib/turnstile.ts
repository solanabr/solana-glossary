// Cloudflare Turnstile verification + short-lived HMAC session tokens. The
// session token is minted once (after a Turnstile check) and presented on every
// AI call, so there is no siteverify network round-trip per request.

import { createHmac, timingSafeEqual } from "node:crypto";
import { config, type Config } from "./config";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface SessionToken {
  token: string;
  expiresAt: number; // unix seconds
}

export interface SessionVerification {
  valid: boolean;
  identity?: string;
}

export interface Turnstile {
  /** True when the deployment enforces Turnstile-minted sessions. */
  readonly required: boolean;
  verifyToken(token: string | undefined, remoteIp?: string): Promise<boolean>;
  mintSession(identity: string): SessionToken;
  verifySession(token: string | undefined): SessionVerification;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(payload: string, secret: string): string {
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function createTurnstile(deps: {
  config?: Config;
  fetchImpl?: typeof fetch;
}): Turnstile {
  const cfg = deps.config ?? config;
  const doFetch = deps.fetchImpl ?? fetch;

  return {
    required: cfg.hasTurnstile,

    async verifyToken(token, remoteIp): Promise<boolean> {
      // No secret configured (dev) → skip the bot gate. Rate limiting still runs.
      if (!cfg.hasTurnstile) return true;
      if (!token) return false;

      try {
        const body = new URLSearchParams();
        body.set("secret", cfg.turnstileSecret);
        body.set("response", token);
        if (remoteIp) body.set("remoteip", remoteIp);

        const resp = await doFetch(SITEVERIFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const data = (await resp.json()) as { success?: boolean };
        return data.success === true;
      } catch (err) {
        console.warn("[turnstile] siteverify failed:", err);
        return false;
      }
    },

    mintSession(identity): SessionToken {
      const expiresAt = Math.floor(Date.now() / 1000) + cfg.sessionTtlSec;
      const payload = b64url(JSON.stringify({ id: identity, exp: expiresAt }));
      const sig = sign(payload, cfg.sessionHmacSecret);
      return { token: `${payload}.${sig}`, expiresAt };
    },

    verifySession(token): SessionVerification {
      // No revocation list: tokens are short-lived (SESSION_TTL_SEC) and can't be
      // invalidated early. Accepted trade-off — rotate SESSION_HMAC_SECRET to
      // mass-invalidate. Rate limit + budget still bound a leaked token's blast.
      if (!token) return { valid: false };
      const dot = token.indexOf(".");
      if (dot < 0) return { valid: false };

      const payload = token.slice(0, dot);
      const sig = token.slice(dot + 1);
      if (!safeEqual(sig, sign(payload, cfg.sessionHmacSecret))) {
        return { valid: false };
      }

      try {
        const decoded = JSON.parse(fromB64url(payload).toString("utf8")) as {
          id?: string;
          exp?: number;
        };
        if (!decoded.id || !decoded.exp) return { valid: false };
        if (decoded.exp < Math.floor(Date.now() / 1000))
          return { valid: false };
        return { valid: true, identity: decoded.id };
      } catch {
        return { valid: false };
      }
    },
  };
}

/** Default singleton wired from env + global fetch. */
export const turnstile: Turnstile = createTurnstile({});
