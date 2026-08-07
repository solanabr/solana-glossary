/**
 * Client-facing mirror of the Phase 2 AI contract.
 *
 * Source of truth: `apps/web/api/_lib/types.ts`. That file lives under `api/`
 * (a separate serverless surface) and is outside the client tsconfig's
 * `include: ["src"]`, so we mirror only the shapes the browser consumes here.
 * Keep these in sync with the contract.
 */

/** Per-feature availability surfaced to the client (never exposes budget numbers). */
export type FeatureState = "on" | "resting" | "disabled";

/** Coarse on/resting/disabled per surface, from `GET /api/ai/status`. */
export interface AiStatus {
  copilot: FeatureState;
  quiz: FeatureState;
  applyCode: FeatureState;
  /** True once the browser must present a Turnstile-minted session token. */
  requiresSession: boolean;
}

/** Response from `POST /api/ai/session`. */
export interface SessionMintResponse {
  token: string;
  /** Unix seconds. */
  expiresAt: number;
}

/** The non-answer "mode" a billable route can return instead of content. */
export type AiUnavailableMode = "resting" | "canned" | "disabled";

/**
 * Body a billable route returns when it won't spend on an answer — the serving
 * tier dropped (resting/canned) or the feature is disabled. The client renders
 * the resting state for all of these.
 */
export interface RestingBody {
  mode: AiUnavailableMode;
}
