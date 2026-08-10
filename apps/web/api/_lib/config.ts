// Env parsing + capability detection for the AI backend. Pure: reads env and
// computes derived constants, no network/disk I/O. Every other module imports
// the wired `config` singleton (or takes a Config via a factory in tests).

import { randomBytes } from "node:crypto";
import type { AiFeature, Tier } from "./types.js";

/** USD per 1M tokens for a model. */
export interface Prices {
  in: number;
  out: number;
}

export interface RateWindows {
  perMin: number;
  perHour: number;
  perDay: number;
}

export interface Config {
  // ── capability flags (drive graceful degradation) ──
  hasGemini: boolean;
  hasUpstash: boolean;
  hasTurnstile: boolean;
  hasEdgeConfig: boolean;
  hasSessionSecret: boolean;
  isProd: boolean;

  // ── server-only secrets / ids ──
  geminiApiKey: string;
  geminiModel: string;
  geminiModelLite: string;
  turnstileSecret: string;
  sessionHmacSecret: string;
  sessionSecretIsEphemeral: boolean;
  upstashUrl: string;
  upstashToken: string;
  edgeConfig: string;

  // ── feature flags / operator overrides ──
  aiEnabled: boolean;
  copilotEnabled: boolean;
  quizEnabled: boolean;
  applyCodeEnabled: boolean;
  forceTier: Tier | null;
  allowUnmeteredAi: boolean;

  // ── budgets, stored/compared in micro-dollars (1e-6 USD) ──
  dailyBudgetMicros: number;
  monthlyBudgetMicros: number;
  userDailyBudgetMicros: number;

  // ── pricing + serving knobs ──
  prices: Record<string, Prices>;
  rateLimits: Record<AiFeature, RateWindows>;
  ipDailyCeiling: number;
  maxOutputTokens: Record<AiFeature, { normal: number; economy: number }>;
  ragK: { normal: number; economy: number };
  /** Spend %-of-budget cut-overs for the tier ladder. */
  tierThresholds: { economy: number; canned: number; resting: number };

  // ── misc ──
  sessionTtlSec: number;
  cacheTtlSec: number;
  maxBodyBytes: number;
  allowedOrigins: string[];

  /** Human-readable notes about degraded capabilities (logged once at boot). */
  warnings: string[];
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_MODEL_LITE = "gemini-2.5-flash-lite";

// Published Gemini list prices (USD per 1M tokens), see contract §1.
const FLASH_PRICES: Prices = { in: 0.3, out: 2.5 };
const FLASH_LITE_PRICES: Prices = { in: 0.1, out: 0.4 };

/** Ordered restrictiveness — index 0 is the most generous tier. */
export const TIER_ORDER: Tier[] = ["normal", "economy", "canned", "resting"];

function str(v: string | undefined, fallback = ""): string {
  return v != null && v !== "" ? v : fallback;
}

function bool(v: string | undefined, fallback: boolean): boolean {
  if (v == null || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && v != null && v !== "" ? n : fallback;
}

function usdToMicros(usd: number): number {
  return Math.round(usd * 1_000_000);
}

/**
 * Build a Config from an env bag (defaults to `process.env`). Tests call this
 * with an explicit bag to exercise specific capability combinations.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const warnings: string[] = [];

  const geminiApiKey = str(env.GEMINI_API_KEY);
  const hasGemini = geminiApiKey !== "";
  if (!hasGemini)
    warnings.push(
      "GEMINI_API_KEY absent → AI disabled (routes serve the resting/free-answer path).",
    );

  const upstashUrl = str(env.UPSTASH_REDIS_REST_URL);
  const upstashToken = str(env.UPSTASH_REDIS_REST_TOKEN);
  const hasUpstash = upstashUrl !== "" && upstashToken !== "";
  if (!hasUpstash)
    warnings.push(
      "Upstash absent → no durable metering; in-memory best-effort rate limiting.",
    );

  const turnstileSecret = str(env.TURNSTILE_SECRET_KEY);
  const hasTurnstile = turnstileSecret !== "";
  if (!hasTurnstile)
    warnings.push(
      "TURNSTILE_SECRET_KEY absent → bot gate skipped (rate limit still applies).",
    );

  const edgeConfig = str(env.EDGE_CONFIG);
  const hasEdgeConfig = edgeConfig !== "";

  let sessionHmacSecret = str(env.SESSION_HMAC_SECRET);
  const hasSessionSecret = sessionHmacSecret !== "";
  let sessionSecretIsEphemeral = false;
  if (!hasSessionSecret) {
    // Dev fallback: a per-process random secret. Tokens do not survive a
    // restart, which is fine for local development.
    sessionHmacSecret = randomBytes(32).toString("hex");
    sessionSecretIsEphemeral = true;
    warnings.push(
      "SESSION_HMAC_SECRET absent → using an ephemeral in-memory secret (dev only).",
    );
  }

  const isProd =
    str(env.VERCEL_ENV) === "production" ||
    (str(env.NODE_ENV) === "production" && str(env.VERCEL_ENV) === "");

  const forceTierRaw = str(env.AI_FORCE_TIER).toLowerCase();
  const forceTier = (TIER_ORDER as string[]).includes(forceTierRaw)
    ? (forceTierRaw as Tier)
    : null;

  const geminiModel = str(env.GEMINI_MODEL, DEFAULT_MODEL);
  const geminiModelLite = str(env.GEMINI_MODEL_LITE, DEFAULT_MODEL_LITE);

  const allowedOrigins = str(env.ALLOWED_ORIGINS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowUnmeteredAi = bool(env.ALLOW_UNMETERED_AI, false);
  if (isProd && forceTier === "normal") {
    warnings.push(
      "AI_FORCE_TIER=normal in production pins the generous tier and disables the budget ladder/ceiling.",
    );
  }
  if (isProd && allowUnmeteredAi) {
    warnings.push(
      "ALLOW_UNMETERED_AI=1 in production weakens metering, bot-gate, and session protections.",
    );
  }

  return {
    hasGemini,
    hasUpstash,
    hasTurnstile,
    hasEdgeConfig,
    hasSessionSecret,
    isProd,

    geminiApiKey,
    geminiModel,
    geminiModelLite,
    turnstileSecret,
    sessionHmacSecret,
    sessionSecretIsEphemeral,
    upstashUrl,
    upstashToken,
    edgeConfig,

    aiEnabled: bool(env.AI_ENABLED, true),
    copilotEnabled: bool(env.COPILOT_ENABLED, true),
    quizEnabled: bool(env.QUIZ_ENABLED, true),
    applyCodeEnabled: bool(env.APPLY_CODE_ENABLED, true),
    forceTier,
    allowUnmeteredAi,

    dailyBudgetMicros: usdToMicros(num(env.AI_DAILY_BUDGET_USD, 10)),
    monthlyBudgetMicros: usdToMicros(num(env.AI_MONTHLY_BUDGET_USD, 200)),
    userDailyBudgetMicros: usdToMicros(num(env.AI_USER_DAILY_BUDGET_USD, 0.05)),

    prices: {
      [geminiModel]: FLASH_PRICES,
      [geminiModelLite]: FLASH_LITE_PRICES,
    },

    rateLimits: {
      copilot: { perMin: 5, perHour: 40, perDay: 150 },
      quiz: { perMin: 4, perHour: 30, perDay: 100 },
      "apply-code": { perMin: 4, perHour: 30, perDay: 100 },
    },
    ipDailyCeiling: num(env.AI_IP_DAILY_CEILING, 300),

    maxOutputTokens: {
      copilot: { normal: 1400, economy: 700 },
      quiz: { normal: 1200, economy: 700 },
      "apply-code": { normal: 1000, economy: 600 },
    },
    ragK: { normal: 6, economy: 3 },
    tierThresholds: { economy: 70, canned: 85, resting: 100 },

    sessionTtlSec: num(env.SESSION_TTL_SEC, 1800),
    cacheTtlSec: num(env.AI_CACHE_TTL_SEC, 60 * 60 * 24 * 30),
    maxBodyBytes: num(env.AI_MAX_BODY_BYTES, 48 * 1024),
    allowedOrigins,

    warnings,
  };
}

/** Default singleton wired from the live process environment. */
export const config: Config = loadConfig();

// Loud, one-time boot warnings for degraded/insecure configs (quiet in tests).
if (str(process.env.NODE_ENV) !== "test") {
  for (const w of config.warnings) console.warn("[ai-config]", w);
}

/** Map a spend-percentage (0..∞) to a serving tier via the budget ladder. */
export function tierFromPct(pct: number, cfg: Config = config): Tier {
  const { economy, canned, resting } = cfg.tierThresholds;
  if (pct >= resting) return "resting";
  if (pct >= canned) return "canned";
  if (pct >= economy) return "economy";
  return "normal";
}

/** Return whichever tier serves less (more restrictive wins). */
export function moreRestrictiveTier(a: Tier, b: Tier): Tier {
  return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b;
}

/** Cost in micro-dollars for a token split on a given model. */
export function costMicros(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cfg: Config = config,
): number {
  const p = cfg.prices[model] ?? FLASH_PRICES;
  const usd = (inputTokens * p.in + outputTokens * p.out) / 1_000_000;
  return Math.ceil(usd * 1_000_000);
}

/** Which model a feature uses at a given tier. */
export function modelForTier(
  feature: AiFeature,
  tier: Tier,
  cfg: Config = config,
): string {
  // Quiz always runs on the cheap Lite model. Copilot/apply-code drop to Lite
  // once the budget forces the economy tier.
  if (feature === "quiz") return cfg.geminiModelLite;
  return tier === "economy" ? cfg.geminiModelLite : cfg.geminiModel;
}

/** maxOutputTokens for a feature at a tier (economy caps lower). */
export function maxOutForTier(
  feature: AiFeature,
  tier: Tier,
  cfg: Config = config,
): number {
  const caps = cfg.maxOutputTokens[feature];
  return tier === "economy" ? caps.economy : caps.normal;
}
