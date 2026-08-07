// Shared request gate for the billable AI routes. Runs cheap→expensive checks
// and fails fast: origin/size/honeypot → flags/kill-switch → session → rate
// limit → budget tier. On rejection it returns a ready Response; otherwise it
// hands the route a serving tier + identity. Also houses the response helpers
// (JSON + OpenAI-shaped SSE) every route shares.

import { createHash } from "node:crypto";
import { get as edgeGet } from "@vercel/edge-config";
import { config, type Config } from "./config";
import { budget as defaultBudget, type Budget } from "./budget";
import {
  rateLimiter as defaultRateLimiter,
  type RateLimiter,
} from "./ratelimit";
import { turnstile as defaultTurnstile, type Turnstile } from "./turnstile";
import type { AiFeature, GuardOutcome, Locale } from "./types";

const LOCALES: Locale[] = ["en", "pt", "es"];

// ── CORS / response helpers ──────────────────────────────────
// The API is token-authenticated (no cookies), so `*` is safe in dev. In prod
// with ALLOWED_ORIGINS set we reflect only an allow-listed Origin (never `*`,
// never an un-listed origin) as defense-in-depth.
function corsOrigin(req: Request | undefined, cfg: Config = config): string {
  if (!req || !cfg.isProd || cfg.allowedOrigins.length === 0) return "*";
  const origin = req.headers.get("origin");
  if (origin && cfg.allowedOrigins.includes(origin)) return origin;
  return cfg.allowedOrigins[0]; // un-listed origin → don't reflect it
}

function corsHeaders(req?: Request): Record<string, string> {
  const origin = corsOrigin(req);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-ai-session",
  };
  if (origin !== "*") headers["Vary"] = "Origin";
  return headers;
}

export function corsPreflight(req?: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export function jsonResponse(
  obj: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
  req?: Request,
): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(req),
      ...extraHeaders,
    },
  });
}

export function errorResponse(
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {},
  req?: Request,
): Response {
  return jsonResponse({ error: message }, status, extraHeaders, req);
}

/** One OpenAI-shaped SSE delta line (matches the existing client parser). */
export function encodeSseDelta(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

export const SSE_DONE = "data: [DONE]\n\n";

export function sseHeaders(req?: Request): Record<string, string> {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    ...corsHeaders(req),
  };
}

/** A complete SSE response that emits `text` (if any) then [DONE]. */
export function sseFromText(text: string, req?: Request): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (text) controller.enqueue(enc.encode(encodeSseDelta(text)));
      controller.enqueue(enc.encode(SSE_DONE));
      controller.close();
    },
  });
  return new Response(stream, { headers: sseHeaders(req) });
}

// ── body reader (size-bounded) ───────────────────────────────
export type ReadJsonResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: Response };

export async function readJson(
  req: Request,
  maxBytes: number = config.maxBodyBytes,
): Promise<ReadJsonResult> {
  if (req.method !== "POST") {
    return { ok: false, response: errorResponse("Method not allowed", 405) };
  }
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared && declared > maxBytes) {
    return { ok: false, response: errorResponse("Payload too large", 413) };
  }
  let text: string;
  try {
    text = await req.text();
  } catch {
    return { ok: false, response: errorResponse("Unreadable body", 400) };
  }
  // Measure bytes, not UTF-16 code units — a multibyte body can exceed the cap
  // while `text.length` stays under it (and content-length may be absent/spoofed).
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return { ok: false, response: errorResponse("Payload too large", 413) };
  }
  if (!text.trim()) return { ok: true, body: {} };
  try {
    return { ok: true, body: JSON.parse(text) as Record<string, unknown> };
  } catch {
    return { ok: false, response: errorResponse("Invalid JSON", 400) };
  }
}

// ── identity / origin helpers ────────────────────────────────
/** Validate + normalize an IP string (strips brackets/port); null if invalid. */
function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().replace(/^\[|\]$/g, "");
  if (!s) return null;
  const v4 = s.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$/);
  if (v4) {
    return v4[1].split(".").every((o) => Number(o) <= 255) ? v4[1] : null;
  }
  // IPv6 (allow embedded IPv4 + zone id chars); reject anything non-address.
  if (s.includes(":") && /^[0-9a-fA-F:.%]+$/.test(s)) return s;
  return null;
}

function firstIp(raw: string | null): string | null {
  return raw ? normalizeIp(raw.split(",")[0]) : null;
}

/**
 * Trustworthy client IP. On Vercel, `x-vercel-forwarded-for` / `x-real-ip` are
 * set by the platform and NOT client-spoofable — prefer them. The raw
 * `x-forwarded-for` is client-appendable, so it's only a validated last resort,
 * and never its leftmost (spoofable) entry: we take the rightmost valid hop.
 */
export function clientIp(req: Request): string {
  const trusted =
    firstIp(req.headers.get("x-vercel-forwarded-for")) ??
    firstIp(req.headers.get("x-real-ip"));
  if (trusted) return trusted;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const ip = normalizeIp(parts[i]);
      if (ip) return ip;
    }
  }
  return "0.0.0.0";
}

/** Coarse, stable identity from an IP — shared by the guard and the session mint. */
export function ipIdentity(ip: string): string {
  return "ip_" + createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export function pickLocale(raw: unknown): Locale {
  return LOCALES.includes(raw as Locale) ? (raw as Locale) : "en";
}

function originAllowed(req: Request, cfg: Config): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin / server-to-server
  if (!cfg.isProd) return true; // never block local dev
  if (cfg.allowedOrigins.length === 0) return true; // not configured → permissive
  return cfg.allowedOrigins.includes(origin);
}

function honeypotTripped(body: Record<string, unknown>): boolean {
  for (const field of ["website", "honeypot", "_hp"]) {
    const v = body[field];
    if (typeof v === "string" && v.trim() !== "") return true;
  }
  return false;
}

function featureFlagOn(feature: AiFeature, cfg: Config): boolean {
  if (!cfg.aiEnabled || !cfg.hasGemini) return false;
  if (feature === "copilot") return cfg.copilotEnabled;
  if (feature === "quiz") return cfg.quizEnabled;
  return cfg.applyCodeEnabled;
}

async function killSwitchActive(
  feature: AiFeature,
  cfg: Config,
): Promise<boolean> {
  if (!cfg.hasEdgeConfig) return false;
  try {
    const kill = await edgeGet<boolean | Record<string, boolean>>("aiKill");
    if (kill === true) return true;
    if (kill && typeof kill === "object") {
      return kill.all === true || kill[feature] === true;
    }
    return false;
  } catch {
    return false; // Edge Config unreachable → fall back to env flags.
  }
}

// ── the guard ────────────────────────────────────────────────
export interface Guard {
  withGuard(
    feature: AiFeature,
    req: Request,
    body: Record<string, unknown>,
  ): Promise<GuardOutcome>;
}

export function createGuard(deps: {
  config?: Config;
  turnstile?: Turnstile;
  rateLimiter?: RateLimiter;
  budget?: Budget;
}): Guard {
  const cfg = deps.config ?? config;
  const turnstile = deps.turnstile ?? defaultTurnstile;
  const rateLimiter = deps.rateLimiter ?? defaultRateLimiter;
  const budget = deps.budget ?? defaultBudget;

  function reject(response: Response, locale: Locale): GuardOutcome {
    return { ok: false, response, tier: "resting", identity: "", locale };
  }

  return {
    async withGuard(feature, req, body): Promise<GuardOutcome> {
      const locale = pickLocale(body.locale);

      // 1. cheap structural checks
      if (honeypotTripped(body)) {
        return reject(errorResponse("Bad request", 400, {}, req), locale);
      }
      if (!originAllowed(req, cfg)) {
        return reject(errorResponse("Forbidden origin", 403, {}, req), locale);
      }

      // 2. flags + kill-switch → disabled surfaces the resting state
      if (
        !featureFlagOn(feature, cfg) ||
        (await killSwitchActive(feature, cfg))
      ) {
        return reject(jsonResponse({ mode: "disabled" }, 200, {}, req), locale);
      }
      // Prod fails CLOSED on missing protections: durable metering (Upstash),
      // the Turnstile bot gate, and a stable cross-instance session secret (an
      // ephemeral per-instance secret would 401 across instances). ALLOW_UNMETERED_AI
      // is the explicit opt-out for non-prod-like deploys.
      if (
        cfg.isProd &&
        !cfg.allowUnmeteredAi &&
        (!cfg.hasUpstash || !cfg.hasTurnstile || !cfg.hasSessionSecret)
      ) {
        return reject(jsonResponse({ mode: "disabled" }, 200, {}, req), locale);
      }

      // 3. session token (only when Turnstile is configured)
      const ip = clientIp(req);
      let identity = ipIdentity(ip);
      if (turnstile.required) {
        const verified = turnstile.verifySession(
          req.headers.get("x-ai-session") ?? undefined,
        );
        if (!verified.valid) {
          return reject(
            errorResponse("Session required", 401, {}, req),
            locale,
          );
        }
        identity = verified.identity ?? identity;
      }

      // 4. rate limit
      const rl = await rateLimiter.check(feature, identity, ip);
      if (!rl.ok) {
        return reject(
          errorResponse(
            "Rate limit exceeded. Please slow down.",
            429,
            { "Retry-After": String(rl.retryAfterSec ?? 30) },
            req,
          ),
          locale,
        );
      }

      // 5. budget gate → serving tier (fails into `canned` on store error)
      const { tier } = await budget.evaluate(identity);
      return { ok: true, tier, identity, locale };
    },
  };
}

const defaultGuard = createGuard({});
export const withGuard = defaultGuard.withGuard;
