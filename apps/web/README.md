# Solana Glossary — Web

Next.js app for [solanabr/solana-glossary](https://github.com/solanabr/solana-glossary): browse terms (en · pt-BR · es), graph of relations, flashcards, match game, and learn path.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)

## Features

| Area | What it does |
|------|----------------|
| **Home** (`/`) | Fuzzy search (Fuse.js), category filters (sidebar + mobile sheet), learn-path modal, “Explore” shortcuts, URL sync for `?q=` and categories |
| **Terms** | `/[lang]/term/[id]` — localized copy, OG image, JSON-LD `DefinedTerm` |
| **Graph** | `/[lang]/graph` — d3-force map from `related` (+ reverse edges), focus + depth |
| **Flashcards** | `/flashcards` — locale/category scope, flip, shuffle, known/review, keyboard |
| **Match** | `/match` — drag-and-drop term ↔ definition |
| **Learn** | `/[lang]/learn` — curated trail |
| **Static pages** | `/mcp`, `/cli` — discovery (nav toggled via env) |
| **Contributing** | `/contributing` — `CONTRIBUTING.md` copied to `public/contributing.md` at prebuild |
| **SEO** | `sitemap.ts`, `robots.ts`, `metadataBase` / `BASE_URL` |

## Data

Terms live under repo root `data/`. **`scripts/copy-data.js`** runs on **`predev`** / **`prebuild`**, copies into **`public/data/`**, and builds **`terms-all.json`**. The client loads that bundle (with fallback to per-category JSON). No npm package required at runtime.

**Locales:** `en` uses source JSON; `pt-BR` and `es` overlay `data/i18n/pt.json` and `es.json`.

## Setup

**Requirements:** Node 18+, monorepo clone with `data/` present.

```bash
cd apps/web
pnpm install   # or npm install
pnpm dev       # http://localhost:3000 — predev copies data
```

Copy **`.env.example`** → **`.env`**. Important vars:

| Variable | Role |
|----------|------|
| `BASE_URL` | Canonical URLs, sitemap, OG (no trailing slash) |
| `NEXT_PUBLIC_SHOW_NAV_MCP` / `CLI` / `VSCODE` | Set `0` / `false` / `off` to hide those nav entries |

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server + copy data |
| `pnpm build` | `copy-data` + `next build --webpack` |
| `pnpm start` | Production server |
| `pnpm run type-check` | `tsc --noEmit` |
| `pnpm run lint` | `next lint` |
| `pnpm run copy-data` | Data copy only |

## Layout (src)

```
src/app/
  page.tsx, home-page-client.tsx   # home
  [lang]/term/[id]/, learn/, graph/
  flashcards/, match/, mcp/, cli/
src/lib/
  glossary.ts       # client fetch, cache, i18n, UI_LABELS
  glossary-fs.ts    # build-time / server reads
  term-graph.ts, learn-path.ts, url-lang.ts, site-url.ts
src/components/    # SearchBar, CategoryFilter, TermCard, graphs, modals, …
```

## Deploy (Vercel)

`apps/web/vercel.json` assumes the **Git repo root** is the Vercel project root (commands use `cd apps/web`).

If you set **Root Directory** to `apps/web` in the Vercel UI, use instead:

- Install: `pnpm install`
- Build: `pnpm run build`
- Output: `.next`

Set **`BASE_URL`** to the production origin in project env.

## Stack

Next.js 16 (App Router), React 18, TypeScript, Tailwind 3, Fuse.js 7, d3-force. Fonts: DM Sans; optional ABC Diatype in `public/fonts/diatype/`.

## Contributing & license

Content and term edits: repo **[CONTRIBUTING.md](../../CONTRIBUTING.md)**. MIT — maintained by [Superteam Brazil](https://github.com/solanabr).
