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
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-ai-session",
};

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export function jsonResponse(
  obj: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...extraHeaders },
  });
}

export function errorResponse(
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return jsonResponse({ error: message }, status, extraHeaders);
}

/** One OpenAI-shaped SSE delta line (matches the existing client parser). */
export function encodeSseDelta(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

export const SSE_DONE = "data: [DONE]\n\n";

export function sseHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    ...CORS,
  };
}

/** A complete SSE response that emits `text` (if any) then [DONE]. */
export function sseFromText(text: string): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (text) controller.enqueue(enc.encode(encodeSseDelta(text)));
      controller.enqueue(enc.encode(SSE_DONE));
      controller.close();
    },
  });
  return new Response(stream, { headers: sseHeaders() });
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
  if (text.length > maxBytes) {
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
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
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
        return reject(errorResponse("Bad request", 400), locale);
      }
      if (!originAllowed(req, cfg)) {
        return reject(errorResponse("Forbidden origin", 403), locale);
      }

      // 2. flags + kill-switch → disabled surfaces the resting state
      if (
        !featureFlagOn(feature, cfg) ||
        (await killSwitchActive(feature, cfg))
      ) {
        return reject(jsonResponse({ mode: "disabled" }), locale);
      }
      // Prod must not spend un-metered unless explicitly allowed.
      if (!cfg.hasUpstash && cfg.isProd && !cfg.allowUnmeteredAi) {
        return reject(jsonResponse({ mode: "disabled" }), locale);
      }

      // 3. session token (only when Turnstile is configured)
      const ip = clientIp(req);
      let identity = ipIdentity(ip);
      if (turnstile.required) {
        const verified = turnstile.verifySession(
          req.headers.get("x-ai-session") ?? undefined,
        );
        if (!verified.valid) {
          return reject(errorResponse("Session required", 401), locale);
        }
        identity = verified.identity ?? identity;
      }

      // 4. rate limit
      const rl = await rateLimiter.check(feature, identity, ip);
      if (!rl.ok) {
        return reject(
          errorResponse("Rate limit exceeded. Please slow down.", 429, {
            "Retry-After": String(rl.retryAfterSec ?? 30),
          }),
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
