/**
 * Turnstile-backed AI session tokens.
 *
 * Behavior is gated entirely on `VITE_TURNSTILE_SITE_KEY`:
 *   - No site key (dev / static deploy): `getAiSessionToken()` resolves `null`,
 *     no script is injected, no network happens. AI calls go out unauthenticated
 *     and the backend decides whether to allow them.
 *   - Site key present: on first AI use we inject the invisible Cloudflare
 *     Turnstile widget, solve it, exchange the Turnstile token for a short-lived
 *     HMAC session token via `POST /api/ai/session`, and cache that token in
 *     memory until shortly before it expires.
 *
 * The widget never blocks glossary browsing: it is rendered off-screen and only
 * runs when an AI request actually needs a token.
 */
import type { RestingBody, SessionMintResponse } from "@/lib/ai-types";

const SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SESSION_ENDPOINT = "/api/ai/session";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "cf-turnstile-script";
/** Give up on a Turnstile solve after this long so callers never hang. */
const SOLVE_TIMEOUT_MS = 20_000;
/** Refresh the session token this many seconds before it actually expires. */
const EXPIRY_SKEW_S = 30;

interface CachedSession {
  token: string;
  /** Unix seconds. */
  expiresAt: number;
}

let cached: CachedSession | null = null;
let inFlight: Promise<string | null> | null = null;
let scriptPromise: Promise<void> | null = null;

function hasSiteKey(): boolean {
  return typeof SITE_KEY === "string" && SITE_KEY.length > 0;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function isFresh(session: CachedSession | null): session is CachedSession {
  return session !== null && session.expiresAt - EXPIRY_SKEW_S > nowSeconds();
}

function loadTurnstileScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("no-document"));
      return;
    }
    if (window.turnstile) {
      resolve();
      return;
    }
    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("turnstile-script-failed")),
      { once: true },
    );
    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
  // A failed load shouldn't poison future attempts.
  scriptPromise.catch(() => {
    scriptPromise = null;
  });
  return scriptPromise;
}

/** Render an invisible widget, solve it once, and resolve the Turnstile token. */
async function solveTurnstile(): Promise<string> {
  await loadTurnstileScript();
  const turnstile = window.turnstile;
  if (!turnstile) throw new Error("turnstile-unavailable");

  return new Promise<string>((resolve, reject) => {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.width = "0";
    container.style.height = "0";
    container.style.overflow = "hidden";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);

    let widgetId = "";
    let settled = false;
    let timer = 0;

    const cleanup = () => {
      if (timer) window.clearTimeout(timer);
      try {
        if (widgetId) turnstile.remove(widgetId);
      } catch {
        /* widget already gone */
      }
      container.remove();
    };
    const succeed = (token: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(token);
    };
    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(reason));
    };

    timer = window.setTimeout(
      () => fail("turnstile-timeout"),
      SOLVE_TIMEOUT_MS,
    );

    try {
      widgetId = turnstile.render(container, {
        sitekey: SITE_KEY as string,
        // Invisible unless Cloudflare decides a challenge is required.
        appearance: "interaction-only",
        // We call execute() ourselves below — without this, render() auto-runs
        // the challenge and the extra execute() double-fires ("already
        // executing" console errors).
        execution: "execute",
        // Our timeout/error path owns retries; Turnstile's internal auto-retry
        // would race our cleanup and reset() a removed widget.
        retry: "never",
        callback: succeed,
        "error-callback": (code) =>
          fail(code ? `turnstile-error:${code}` : "turnstile-error"),
        "timeout-callback": () => fail("turnstile-timeout"),
        "expired-callback": () => fail("turnstile-expired"),
      });
      turnstile.execute(widgetId);
    } catch {
      fail("turnstile-render-failed");
    }
  });
}

async function mintSession(): Promise<string | null> {
  const turnstileToken = await solveTurnstile();
  const resp = await fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ turnstileToken }),
  });
  if (!resp.ok) return null;
  const data = (await resp.json()) as SessionMintResponse;
  if (!data || typeof data.token !== "string") return null;
  cached = { token: data.token, expiresAt: data.expiresAt };
  return data.token;
}

/**
 * Resolve a valid AI session token, minting one if needed.
 * Returns `null` when Turnstile isn't configured (dev) or minting fails — the
 * caller then sends the request without an `x-ai-session` header.
 */
export async function getAiSessionToken(): Promise<string | null> {
  if (!hasSiteKey()) return null;
  if (isFresh(cached)) return cached.token;
  if (inFlight) return inFlight;

  inFlight = mintSession()
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * Standard JSON headers for AI requests, plus `x-ai-session` when a token is
 * available. Never throws — a failed mint just omits the session header.
 */
export async function buildAiHeaders(
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = await getAiSessionToken();
  if (token) headers["x-ai-session"] = token;
  return headers;
}

/**
 * True when a route returned a non-answer mode body — resting/canned/disabled —
 * instead of content. The client renders the resting state for all three, so a
 * budget-driven `canned`/`disabled` response never falls through to a blank UI.
 */
export function isRestingBody(value: unknown): value is RestingBody {
  if (typeof value !== "object" || value === null) return false;
  const mode = (value as { mode?: unknown }).mode;
  return mode === "resting" || mode === "canned" || mode === "disabled";
}
