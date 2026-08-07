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

/**
 * Body a billable route returns when the serving tier has dropped to `resting`.
 * Sent instead of an answer so the client can render the resting state.
 */
export interface RestingBody {
  mode: "resting";
}
