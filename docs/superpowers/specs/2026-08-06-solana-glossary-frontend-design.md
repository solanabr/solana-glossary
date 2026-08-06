# Solana Glossary — Frontend Port & Monorepo Design

**Date:** 2026-08-06
**Branch:** `feat-front`
**Status:** Approved (structure + phasing delegated to implementer; AI=Gemini + abuse/spend guardrails + cut-extension chosen by owner)

## 1. Goal

Turn the `@stbr/solana-glossary` repo (currently a single published npm package: SDK + MCP server) into a maintainable monorepo and land a production web app ported from the hackathon-winning frontend `eduardo3071/solana-aura-guide` ("Solana Dev Copilot"). The app integrates **natively** with our SDK (no vendored fork) and re-hosts its AI features on our own infrastructure (Gemini on Vercel), removing all Lovable/Supabase coupling. First deploy must get Vercel green (the current repo has no frontend, so Vercel deploys fail with "nothing to serve").

Source app is MIT / rights owned by us. The source repo has **no LICENSE file**; we add MIT to the monorepo and credit the original author in one README line.

## 2. Key Decisions (with rationale)

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo layout | **Full restructure**: private root manager + `packages/glossary` + `apps/web` | Disentangles the root (already a meta/tooling container) from the package; avoids npm root-as-child self-link fragility; scales. Adversarial verdict 82 vs 72. SDK moves **verbatim** → tarball byte-identical. |
| Package granularity | **Single `packages/glossary`** (no core/mcp split) | Splitting changes the published tarball + forces a breaking rename; bundlers already tree-shake the MCP server out of the browser build. Split is a deliberate future v2.0.0. |
| Package manager | **npm workspaces** | Matches current CI (`npm ci`); least migration. |
| AI provider | **Google Gemini** (Flash for copilot/code-explain, Flash-Lite for quiz) | Owner has Gemini keys; matches original model family; cheapest. |
| AI hosting | **Vercel Node serverless functions** under `apps/web/api/` | SDK RAG runs in-process; `getLocalizedTerms` uses Node `require` (breaks on Edge). LLM round-trip dwarfs Node cold-start. |
| Abuse/spend | **Turnstile + Upstash + Edge Config**, graceful degradation to free SDK answers | Owner requirement: gate to real users, cap spend without freezing the app. |
| VSCode extension | **Cut** | Owner choice. |
| Execution phasing | **Static-green-first**, then AI layer | Gets Vercel green immediately (fixes current failure); smaller review surfaces. |

## 3. Target Directory Structure

```
solana-glossary/                      # PRIVATE workspace manager (publishes nothing)
├── package.json                      # {private:true, workspaces:["packages/*","apps/*"]}
├── package-lock.json                 # single hoisted lockfile
├── README.md  LICENSE  CONTRIBUTING.md   # monorepo-wide; README credits eduardo3071
├── CLAUDE.md  .env.example  .gitignore  .gitmodules
├── .github/workflows/ci.yml          # workspace-aware; npm pack guard; submodules: recursive
├── .claude/ (+ skills/ext/* submodules)  .memsearch/    # UNCHANGED, stay at root
├── packages/
│   └── glossary/                     # == @stbr/solana-glossary (MOVED VERBATIM)
│       ├── package.json              # only edit: + repository.directory
│       ├── src/{index,i18n,types}.ts  mcp/{server,tools,bin}.ts
│       ├── data/{terms/*.json, i18n/{pt,es}.json}
│       ├── scripts/validate.js  tests/*.test.ts  skills/  README.md
│       └── tsconfig.json  vitest.config.ts
└── apps/
    └── web/                          # @stbr/solana-glossary-web (ported frontend)
        ├── package.json              # dep "@stbr/solana-glossary": "*"
        ├── index.html vite.config.ts tailwind/postcss/eslint/tsconfig* vitest.config.ts
        ├── vercel.json               # install from root, build web, output dist/
        ├── public/                   # favicon, robots.txt (zip removed)
        ├── api/                      # Vercel Node functions (Phase 2)
        │   ├── copilot.ts quiz.ts apply-code.ts
        │   ├── ai/status.ts
        │   └── _lib/{glossary,guard,gemini,budget,cache}.ts
        └── src/{components,pages,hooks,lib,App.tsx,main.tsx,index.css}
```

## 4. SDK changes (`packages/glossary`) — minimal, backward-compatible

1. **Move verbatim** into `packages/glossary/`. Only manifest edit: add `repository.directory: "packages/glossary"`.
2. **Fix shipped i18n bug (v1.2.0):** published `getLocalizedTerms("pt"/"es")` throws in the built tarball (its dynamic `require("../data/i18n/${locale}.json")` resolves wrong once in `dist/src/`) and silently falls back to English. Fix by bundling `data/i18n/*.json` into `dist` (or copying `data/` into `dist`) so the resolved path is correct. Add a test that runs against **built `dist`**, not just `src`, to catch this class of bug.
3. **No new required exports.** The app consumes terms via the existing `.` export and raw locale JSON via the existing `./data/*` export (`@stbr/solana-glossary/data/i18n/pt.json`). No `./localized` export needed in Phase 1.
4. **Guard:** CI runs `npm pack --dry-run` (or pack+shasum diff) to prove the published contents are unchanged apart from the intended v1.2.0 i18n-bundling.

## 5. Port map (`apps/web`) — from port-inventory

**Bring in from source, then:**

- **Kill the vendored fork:** delete `src/lib/solana-glossary/{index.ts,types.ts,terms/*,i18n/*}` (the stale 1001-term, no-`depth`/`tags` copy). Repoint the 22 import sites: value/type imports → `@stbr/solana-glossary`; the app gains all 1059 terms + `depth`/`tags`.
- **Keep the localization helper layer** but relocate it: `src/lib/solana-glossary/localized.ts` → `src/lib/glossary-i18n.ts`, keeping its five exports (`getLocalizedTerms`, `localizeTerm`, `searchLocalizedTerms`, `buildLocalizedGlossaryContext`, `findLocalizedTermByText`, `GlossaryLocale`) and accent/punct normalization; change its data sources to `allTerms` from `@stbr/solana-glossary` and pt/es JSON from `@stbr/solana-glossary/data/i18n/*.json`.
- **Strip Lovable:** `lovable-tagger` (package.json devDep + `vite.config.ts` plugin), `.lovable/`, README "Built with Lovable" badge, `index.html` author/twitter/og meta (Lovable R2 URLs), `playwright.config.ts` + `playwright-fixture.ts` (reference an uninstalled Lovable playwright pkg), `bun.lock*`.
- **Strip Supabase:** `src/integrations/supabase/*` (dead — client never imported), `supabase/config.toml`, `@supabase/supabase-js` dep. Keep the 3 function bodies under `supabase/functions/{solana-copilot,solana-quiz,solana-apply-code}` as **reference only** for the Vercel port; delete `translate-glossary` (dead + redundant with static i18n).
- **Strip extension:** `extension/` dir, `src/pages/VSCodeExtension.tsx`, `public/solana-dev-copilot-vscode.zip`, its `/vscode` route + any nav entry.
- **Strip dead components:** `SearchBar.tsx`, `TermTooltip.tsx`, `NavLink.tsx` (0 import sites), `src/App.css` (unused scaffold).
- **Fixes:** update 9 hardcoded "1001 terms" i18n strings → dynamic `allTerms.length`; fix the orphaned `sessionStorage["explain-code-input"]` hand-off (writer exists, no reader) so hero "explain this code" works; wire `@tailwindcss/typography` into `tailwind.config.ts` plugins (installed, unregistered) or drop it; don't commit `.env`.
- **Rename:** package `vite_react_shadcn_ts` → `@stbr/solana-glossary-web`.
- **Keep wholesale:** `src/components/ui/*` (49 shadcn primitives), `framer-motion`, `react-force-graph-2d`, `react-markdown`, `react-router-dom`, `@tanstack/react-query`, `lucide-react`, `sonner`, `next-themes`.

**AI client fetch sites to repoint (Phase 2):** `lib/ai-chat.ts` (`CHAT_URL`), `SmartQuiz.tsx` (`QUIZ_URL`), `ApplyCode.tsx` (`APPLY_URL`) → `/api/*` (same-origin; drop the Supabase anon bearer). Collapse `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` → single same-origin `/api` base (no public var needed).

## 6. AI backend (Phase 2) — `apps/web/api/`

Three Node functions, all wrapped by a shared `withGuard()`:

- **`copilot.ts`** — streaming (SSE). Input `{messages, glossaryContext?, mode, locale}`, modes `chat|explain-code|explain-file|usage-example`. Calls Gemini streaming; **re-emits OpenAI-shaped SSE** (`data: {choices:[{delta:{content}}]}` … `data: [DONE]`) so the existing client parser is unchanged except base URL. RAG context built **server-side** from the SDK (`searchTerms` → compact block, identical to MCP `inject_context` compact format) — move retrieval off the client.
- **`quiz.ts`** — non-stream, structured output `{questions:[{question,options[4],correct,explanation,relatedTerms[]}]}`. Model Flash-Lite. Context from `getTerm` + `.related`.
- **`apply-code.ts`** — non-stream, structured output `{title,code,language,explanation,keyConcepts[]}`.
- **`ai/status.ts`** — public, coarse `{copilot,quiz,codeExplain: on|resting|disabled}` for the UI. No numbers.
- **`_lib/glossary.ts`** — RAG assembly from `@stbr/solana-glossary` (+ alias→canonical map for the definitional fast-path).
- Model caps: `thinkingBudget:0`, `max_output_tokens` per route, top-K (6 normal / 3 economy), input caps. Model IDs + prices as config constants (Oct-2026 Gemini swap = one line).

## 7. Abuse gate + spend guardrails (Phase 2) — `_lib/guard.ts`, `_lib/budget.ts`, `_lib/cache.ts`

**Request pipeline (cheap→expensive, fail fast):** origin/method/size/honeypot → feature-flag/kill-switch (Edge Config) → session-token verify (local HMAC) → rate limit (Upstash) → cache lookup → budget gate + tier decision → RAG + Gemini (or free SDK answer) → record spend + write cache.

- **Bot gate:** baseline (same-origin allowlist, honeypot, size caps) + **invisible Cloudflare Turnstile** → short-lived HMAC session token (verified locally per-request). **Optional SIWS** (connect wallet + sign nonce) → higher tier. No forced NFT/token gate (flag for future "pro").
- **Rate limiting:** Upstash Redis + `@upstash/ratelimit` sliding window; identity = session/IP (+ wallet for SIWS tier); per-feature per-min/hour/day + global per-IP/day ceiling; small concurrency cap.
- **Spend:** micro-dollar accounting in Redis; per-user daily cap (anon ~$0.05, wallet ~$0.25) + global daily/monthly ceilings (env, e.g. $10/day, $200/mo). Bill from Gemini `usageMetadata`. **Reserve-then-spend** atomic `INCRBY` to bound overshoot.
- **Degradation ladder** (tier = max(daily%, monthly%) of global ceiling; operator `forceTier` override):
  - <70% Normal (Flash, K=6, cache on) → ≥70% Economy (Flash-Lite, K=3, smaller output) → ≥85% Canned (cache hits + **free deterministic SDK answers**, $0) → ≥100% Resting (AI endpoints return `{mode:"resting"}`, no Gemini calls).
- **Client-only glossary never breaks:** browse/search/i18n run in the SPA off the bundled SDK, never call `/api`. Degradation touches the AI layer only.
- **Cache:** normalize prompt (lowercase/trim/alias→canonical id) + RAG term ids + locale + `corpusVersion`; 30-day TTL; only write Normal-tier answers; cache hit bills $0 but still decrements rate limit. Definitional fast-path answers straight from SDK with zero LLM cost.
- **Kill switch:** Vercel Edge Config flags `{aiEnabled,copilot,quiz,codeExplain,forceTier,maintenanceMessage}` (no redeploy) + env backstop. Disabled feature returns `200 {mode:"disabled"}`, UI relabels the copilot entry ("resting — glossary still works").
- **Fail-safe:** on Redis/budget read failure, degrade to the **free SDK answer path** (never blind spend); add a **Google Cloud billing budget + API quota** as a provider-side hard backstop.
- **Env (server-only, never `VITE_`):** `GEMINI_API_KEY`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN`, `EDGE_CONFIG`, `SESSION_HMAC_SECRET`, `SIWS_DOMAIN`, budget config. Public-safe: `TURNSTILE_SITE_KEY`. Nominal cost ~$37/mo; hard-capped ~$200/mo.

## 8. Deployment (Vercel)

- Project **Root Directory = `apps/web`**, "Include files outside Root Directory" = ON.
- `apps/web/vercel.json`: install from repo root (`npm ci` at workspace root so the `@stbr/solana-glossary` symlink resolves), `buildCommand` builds the web app, `outputDirectory: dist`, framework Vite. Because Vite bundles the SDK's `.`/`./data/*` (JSON inlined), no separate "build SDK first" step is needed for the web build; local dev + CI still build the SDK's `dist` for its own tests.
- Phase 1 deploys as a **static SPA** (no functions, no keys). Phase 2 adds `/api/*` + env vars and flips AI on via Edge Config.

## 9. CI

- Workspace-aware `.github/workflows/ci.yml`, `submodules: recursive`.
- glossary job: `npm ci` → build → validate → test (scope root/pkg `vitest` `include` so it doesn't recurse into app tests) → `npm pack --dry-run` guard.
- web job: `npm ci` → `npm run build -w apps/web` → lint → test.

## 10. Phasing / execution order

- **Phase 0 — Monorepo skeleton (sequential, verified):** create root manager `package.json`; `git mv` SDK → `packages/glossary`; regenerate lockfile; confirm `npm run build -w @stbr/solana-glossary` + tests pass and `npm pack` contents unchanged; update `.gitignore` (`packages/*/dist`, `apps/*/dist`, `.env`, `.memsearch/`); update CI. **Gate before proceeding.**
- **Phase 1 — Static app (parallelizable by file group):** import `apps/web`; strip Lovable/Supabase/extension/dead code; rewire imports to SDK; relocate `glossary-i18n.ts`; SDK i18n v1.2.0 fix; gate AI surfaces off (`/api/ai/status` returns disabled, or a build flag); app builds + runs; deploy static → **Vercel green**.
- **Phase 2 — AI + guards (parallelizable by function/concern):** `_lib` (glossary RAG, gemini, guard, budget, cache); `copilot/quiz/apply-code/status`; Turnstile + Upstash + Edge Config; repoint client fetch → `/api/*`; flip AI on.

## 11. Testing / verification per phase

- Phase 0: SDK unit tests green; `npm pack` diff clean; MCP server still starts.
- Phase 1: app typechecks/builds; smoke test key flows (search, category browse, term detail, i18n switch); no Lovable/Supabase references remain (`grep`); Vercel preview green.
- Phase 2: function contract tests; rate-limit + budget-ladder unit tests (mock Upstash); kill-switch flips; key never in client bundle (`grep` built assets); manual copilot/quiz/apply happy-path.

## 12. Open items / risks

- Confirm/record the license basis (source repo had no LICENSE); add MIT + credit line.
- Cloudflare Turnstile + Upstash + Vercel Edge Config accounts/creds needed for Phase 2.
- SIWS is optional in Phase 2 (baseline Turnstile can ship first; SIWS as a follow-up tier).
- `@tanstack/react-query` provider is mounted but unused — keep provider, or remove if we add no queries.
