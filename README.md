# Solana Glossary — monorepo

The most comprehensive Solana ecosystem glossary, as an npm SDK + MCP server **and** a web app.

```
.
├── packages/
│   └── glossary/     @stbr/solana-glossary — SDK + MCP server (1059 terms, 14 categories, en/pt/es)
└── apps/
    └── web/          Solana Dev Copilot — Vite + React glossary browser + AI copilot
```

This is an npm-workspaces monorepo. `packages/glossary` is the published package (`@stbr/solana-glossary`); `apps/web` consumes it locally via the workspace link — the app is native to the SDK (no vendored copy).

## Quick start

```bash
npm install                                   # installs all workspaces
npm run build            -w @stbr/solana-glossary   # build the SDK (the app resolves its dist)
npm run dev              -w @stbr/solana-glossary-web  # run the web app (http://localhost:8080)
```

Tests / typecheck:

```bash
npm test  -w @stbr/solana-glossary        # SDK + MCP (vitest)
npm test  -w @stbr/solana-glossary-web    # web unit + AI-middleware tests
```

## The web app

A glossary browser (instant search, 14-category explorer, knowledge graph, term cross-references, en/pt/es) plus an **AI copilot** (chat, code-explain, quiz) grounded in the glossary via RAG.

- **Glossary features are 100% client-side** off the SDK — no backend, no keys.
- **AI features** run on Vercel serverless functions (Google Gemini) with an anti-bot gate (Cloudflare Turnstile) and spend guardrails that **degrade gracefully to free, deterministic SDK answers** rather than freezing. The app runs fully in dev with **no** AI creds set — AI surfaces just show a "resting" state.

See `docs/superpowers/specs/` for the design + AI-backend contract.

## Deploy (Vercel)

Point a Vercel project at this repo with **Root Directory = `apps/web`** and **"Include files outside the Root Directory" = ON** (so the workspace root + `packages/glossary` are available at install/build). `apps/web/vercel.json` handles the SPA rewrites (and excludes `/api`). Framework preset: **Vite**.

To enable the AI copilot in production, set the env vars documented in `apps/web/.env.example` (Gemini key, a Cloudflare Turnstile site, and an Upstash Redis). Add a Google Cloud billing budget as a provider-side backstop.

## Credits

Frontend originally created by [eduardo3071](https://github.com/eduardo3071) ("Solana Dev Copilot"); ported and re-architected here. Licensed MIT.
