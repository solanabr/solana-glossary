# Phase 2 — AI Backend Contract (Gemini copilot + abuse/spend guardrails)

**Date:** 2026-08-06 · **Branch:** `feat-front` · Builds on the Phase 1 static app.
Code contract: `apps/web/api/_lib/types.ts`. Runtime: **Vercel Node serverless functions**, Fetch-style handlers `export default (req: Request) => Promise<Response>` (streaming via `ReadableStream`). Every route wraps a shared `withGuard()`.

## 0. Non-negotiable invariants

1. **No secret ever reaches the browser.** Only `VITE_TURNSTILE_SITE_KEY` (public by design) is `VITE_`-prefixed. Gemini/Upstash/HMAC/Turnstile-secret live only in functions. A test/grep must confirm no secret in `apps/web/dist`.
2. **The app never freezes.** Client-only glossary (browse/search/category/graph/i18n) never calls `/api`. When AI is degraded/disabled/erroring, surfaces show the "resting" state; browsing keeps working. Budget/Redis failure **fails into the free SDK answer path**, never blind spend.
3. **Runs in dev without any cloud creds.** Missing creds → graceful capability-detected degradation (below), with a loud server-side `console.warn`, never a crash.

## 1. Environment variables (all server-only unless noted)

| Var | Purpose | Absent →|
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini key | AI disabled (status `disabled`, routes return resting) |
| `GEMINI_MODEL` (default `gemini-2.5-flash`) | copilot / code-explain model | default |
| `GEMINI_MODEL_LITE` (default `gemini-2.5-flash-lite`) | quiz / economy model | default |
| `TURNSTILE_SECRET_KEY` | verify Turnstile token server-side | bot gate skipped (warn); rate-limit still applies |
| `VITE_TURNSTILE_SITE_KEY` (**public**) | client widget | client skips widget; requests still work in dev |
| `SESSION_HMAC_SECRET` | sign/verify session tokens | ephemeral in-memory secret (dev; warn) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | rate-limit + budget + cache store | **no durable metering** → in-memory best-effort limiter; block prod unless `ALLOW_UNMETERED_AI=1` |
| `EDGE_CONFIG` | runtime kill-switches | fall back to env flags below |
| `AI_ENABLED` (default `true`), `COPILOT_ENABLED`, `QUIZ_ENABLED`, `APPLY_CODE_ENABLED` | feature flags | default on |
| `AI_FORCE_TIER` (optional: `normal\|economy\|canned\|resting`) | operator override | none |
| `AI_DAILY_BUDGET_USD` (default `10`), `AI_MONTHLY_BUDGET_USD` (default `200`) | global ceilings | defaults |
| `AI_USER_DAILY_BUDGET_USD` (default `0.05`) | per-identity daily cap | default |
| `ALLOW_UNMETERED_AI` (default off) | allow AI without Upstash in prod | — |

`config.ts` exposes capability booleans: `hasGemini`, `hasUpstash`, `hasTurnstile`, `hasEdgeConfig`, `hasSessionSecret`, plus parsed numbers/model-ids/price-constants. Prices (per 1M tok, config constants): Flash `$0.30/$2.50`, Flash-Lite `$0.10/$0.40`.

## 2. Modules (`apps/web/api/_lib/`)

- **`config.ts`** — parse env once; capability flags; model ids; price constants; budgets; rate-limit table; tier thresholds. Pure, no I/O.
- **`glossary.ts`** — RAG from `@stbr/solana-glossary`: `searchTerms`→ compact `term: definition` block (K-capped), alias→canonical id map, `getTerm`+`.related` for quiz/apply. Also the **free deterministic answer**: if a prompt resolves to one term id, return its definition (zero LLM).
- **`gemini.ts`** — `@google/genai` client. `streamText()` (async iterable of text deltas) + `generateStructured(schema)` (quiz/apply). Always sets `thinkingBudget: 0` and a hard `maxOutputTokens` per tier. Returns `usageMetadata` for billing.
- **`turnstile.ts`** — verify Turnstile via siteverify; mint/verify short-lived HMAC session tokens (`SESSION_HMAC_SECRET`, ~30 min, bound to a coarse identity). No network per request after mint.
- **`ratelimit.ts`** — `@upstash/ratelimit` sliding windows per feature (min/hour/day) + per-IP/day ceiling; in-memory fallback when no Upstash.
- **`budget.ts`** — micro-dollar accounting in Upstash (`INCRBY` reserve-then-spend); per-identity + global daily/monthly; returns the `Tier` from `max(daily%,monthly%)` (or `AI_FORCE_TIER`). Ladder: `<70` normal · `≥70` economy · `≥85` canned · `≥100` resting.
- **`cache.ts`** — Upstash GET/SET keyed by `feature:locale:corpusVersion:sha256(normPrompt+sortedRagIds)`; 30d TTL; write only Normal-tier answers; hit bills $0 but still decrements rate limit.
- **`guard.ts`** — `withGuard(feature, req): Promise<GuardOutcome>`. Pipeline (cheap→expensive, fail fast): origin/method/size/honeypot → flags/kill-switch → session-token verify → rate limit → cache lookup → budget gate + tier. Returns a ready `Response` on rejection; else `{ok, tier, identity, locale}`.

## 3. Routes (`apps/web/api/`)

- **`copilot.ts`** — POST `CopilotRequest` → SSE OpenAI-delta stream. Rebuild RAG from `glossary.ts`. `explain-file` may use Flash; economy → Flash-Lite + K=3 + lower `maxOutputTokens`; canned/resting → free SDK answer or `{mode}`; drop multi-turn history beyond last 2.
- **`quiz.ts`** — POST `QuizRequest` → `QuizResponse` (structured). Flash-Lite.
- **`apply-code.ts`** — POST `ApplyCodeRequest` → `ApplyCodeResponse` (structured). Flash.
- **`ai/status.ts`** — GET → `AiStatus` (public; Edge runtime OK). Coarse states only.
- **`ai/session.ts`** — POST `SessionMintRequest` → `SessionMintResponse` (verifies Turnstile, mints HMAC token).

Original prompt fidelity: port the system prompts from the reference edge functions at `…/scratchpad/solana-aura-guide/supabase/functions/{solana-copilot,solana-quiz,solana-apply-code}/index.ts` (mode switches + JSON shapes there).

## 4. Client wiring (`apps/web/src`)

- Upgrade `hooks/useAiStatus.ts` to fetch `/api/ai/status` (cache ~30s; fall back to `VITE_AI_ENABLED` when the fetch fails). Expose per-surface states + `requiresSession`.
- Add an **invisible Turnstile** widget (site key `VITE_TURNSTILE_SITE_KEY`); on first AI use, get a Turnstile token, POST `/api/ai/session`, store the returned session token in memory, send it as a header (e.g. `x-ai-session`) on `/api/*` calls. If no site key (dev), skip and call directly.
- `lib/ai-chat.ts` streams from `/api/copilot` (parser already OpenAI-SSE-shaped — keep). `SmartQuiz`/`ApplyCode` POST `/api/quiz` + `/api/apply-code`. All gated by `useAiStatus`; on `resting`/`disabled`, render the existing resting state (no calls).
- SIWS is **out of scope for this pass** (baseline Turnstile only); leave a clean seam.

## 5. Tests (`apps/web` vitest, mock Upstash/Edge Config/Gemini)

- Budget ladder thresholds → correct `Tier`; reserve-then-spend caps overshoot.
- Rate-limit denies past the window; in-memory fallback works with no Upstash.
- Cache key normalization (alias→canonical collapses "what's an AMM"/"define amm").
- Guard fail-safe: budget-store error → canned tier, not blind spend.
- Free SDK answer path returns a real definition with zero LLM.
- Contract: a built-bundle grep asserts no server secret string pattern is present.

## 6. Deps + deploy

Add: `@google/genai`, `@upstash/redis`, `@upstash/ratelimit`, `@vercel/edge-config`. Client Turnstile via injected script (no npm needed) or a tiny wrapper. `apps/web/.env.example` documents every var above. `vercel.json`: keep SPA rewrites but **exclude `/api`** from the catch-all so functions route correctly; functions default to Node runtime (status may be Edge). Provide a Google Cloud billing-budget note as the provider-side backstop.
