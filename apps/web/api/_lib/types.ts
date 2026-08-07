// Shared contract for the Phase 2 AI layer (Vercel Node functions under apps/web/api).
// Both the server handlers and the client wiring build against these shapes.

export type Locale = "en" | "pt" | "es";

/** The three billable AI endpoints. */
export type AiFeature = "copilot" | "quiz" | "apply-code";

/** Spend-driven serving tier (see budget ladder). */
export type Tier = "normal" | "economy" | "canned" | "resting";

/** Per-feature availability surfaced to the client (never exposes budget numbers). */
export type FeatureState = "on" | "resting" | "disabled";

// ── /api/copilot (streaming SSE) ─────────────────────────────
// Streams OpenAI-shaped deltas so the existing client parser is unchanged:
//   data: {"choices":[{"delta":{"content":"…"}}]}\n\n   …   data: [DONE]\n\n
export type CopilotMode =
  "chat" | "explain-code" | "explain-file" | "usage-example";

export interface CopilotMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface CopilotRequest {
  messages: CopilotMessage[];
  /** Legacy client-built context; the server rebuilds RAG from the SDK and ignores/merges this. */
  glossaryContext?: string;
  mode: CopilotMode;
  locale?: Locale;
}

// ── /api/quiz (JSON, structured output) ──────────────────────
export interface QuizRequest {
  term: string;
  category?: string;
  definition?: string;
  relatedTerms?: string[];
  difficulty?: string;
  mode?: string;
  locale?: Locale;
}

export interface QuizQuestion {
  question: string;
  options: string[]; // exactly 4
  correct: number; // 0-based index into options
  explanation: string;
  relatedTerms: string[];
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

// ── /api/apply-code (JSON, structured output) ────────────────
export interface ApplyCodeRequest {
  term: string;
  incorrectTerms?: string[];
  relatedTerms?: string[];
  difficulty?: string;
  mode?: string;
  locale?: Locale;
}

export interface ApplyCodeResponse {
  title: string;
  code: string;
  language: string;
  explanation: string;
  keyConcepts: string[];
}

// ── /api/ai/status (public) ──────────────────────────────────
// Coarse on/resting/disabled per surface. NO budget numbers, ever.
export interface AiStatus {
  copilot: FeatureState;
  quiz: FeatureState;
  applyCode: FeatureState;
  /** True once the browser must present a Turnstile-minted session token to call AI endpoints. */
  requiresSession: boolean;
}

// ── /api/ai/session (mint a short-lived HMAC session token) ──
export interface SessionMintRequest {
  /** Cloudflare Turnstile token from the invisible client widget. */
  turnstileToken?: string;
}

export interface SessionMintResponse {
  token: string;
  /** Unix seconds. */
  expiresAt: number;
}

// ── Guard middleware ─────────────────────────────────────────
export interface GuardOutcome {
  /** When false, the handler returns `response` verbatim (429/401/403/200-resting/etc.). */
  ok: boolean;
  response?: Response;
  /** Present when ok: the serving tier + identity the handler must honor. */
  tier: Tier;
  identity: string;
  /** Cache key prefix inputs the handler can reuse. */
  locale: Locale;
}

/** A canned/free answer produced with zero LLM cost, straight from the SDK. */
export interface CannedAnswer {
  text: string;
  fromCache: boolean;
}
