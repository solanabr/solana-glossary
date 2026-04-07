# Glossário Solana — Web App

> **[🚀 Live Demo](https://solana-glossary-lek6.vercel.app)** · Built on top of [`@stbr/solana-glossary`](https://github.com/solanabr/solana-glossary) for the Superteam Brazil Bounty

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](../LICENSE)

---

## What Is This?

A **full-featured web application** that transforms the `@stbr/solana-glossary` SDK into an interactive learning experience for Solana developers — from complete beginners to protocol engineers.

Three tools in one:

| Feature | Description |
|---|---|
| **📚 Glossary** | Browse and search 1001 terms with real-time filtering by category |
| **🕸️ Knowledge Graph** | Interactive force-directed graph showing how all 1001 terms connect |
| **🎯 Quiz** | Learn by doing — multiple choice and 3D flashcard modes |

Built with Solana's visual identity (purple → green gradient), full i18n (PT/ES/EN), and deployed on Vercel.

---

## Features

### 📚 Glossary — Instant Search Across 1001 Terms

- Real-time search filtering term names, definitions, and aliases
- Filter by any of the 14 categories with color-coded pills
- Random term button for discovery
- Each term page shows full definition, aliases, and related terms
- Metadata for SEO — every term at `/termo/[id]` has its own `<title>` and `<meta description>`

### 🕸️ Knowledge Graph — Visualize the Entire Ecosystem

- Force-directed D3 graph of all 1001 terms and their cross-references
- Filter the graph by category — isolate only DeFi, ZK Compression, or any other area
- Search for a specific term: it lights up with a glow effect on the graph
- Click any node to navigate to that term's detail page
- Live stats: node count and connection count update as you filter
- Zoom, pan, and explore the full topology of Solana knowledge

### 🎯 Quiz — Two Modes, Fully Gamified

**Multiple Choice**
- Shows you a definition → you pick the correct term from 4 options
- Instant color feedback: green for correct, red for wrong
- Progress bar, live score counter
- Covers any subset of terms you choose

**Flashcard**
- Shows the term name → click to flip (real CSS 3D animation)
- Definition revealed on the back, with category-specific gradient
- Mark each card as "Sabia!" ✅ or "Não sabia" 😅
- Tracks your score across the deck

**Results Screen**
- SVG ring progress chart with gradient fill
- Correct/incorrect breakdown
- Confetti animation for scores ≥ 70%

**Setup**
- Choose mode (Multiple Choice or Flashcard)
- Filter to specific categories (DeFi only? Security only? Your choice)
- Pick question count: 10, 20, 50, or all available terms

### 🌍 Full i18n — PT / ES / EN

Every page works in three languages. The language switcher updates the URL and re-renders Server Components, so pages are correctly indexed by language. Locale persists in `localStorage` between sessions.

```
/?lang=pt → Portuguese definitions
/?lang=es → Spanish definitions
/?lang=en → Original English
```

### 🤖 AI Context Copy

Each term page has a "Copy for AI" button that copies the entire category's terms as a structured context block — ready to paste into Claude, ChatGPT, or any LLM prompt. Saves tokens by letting the model focus on your actual question instead of re-explaining Solana basics.

---

## SDK Integration

This app is built **entirely** on `@stbr/solana-glossary`. Every piece of data comes from the SDK.

```typescript
import {
  allTerms,
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
} from "@stbr/solana-glossary";

import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";

// Homepage: all 1001 terms for display
const terms = allTerms; // GlossaryTerm[]

// Real-time search
const results = searchTerms(query); // matches names, definitions, aliases

// Term detail page
const term = getTerm("proof-of-history"); // lookup by ID or alias

// Related terms on each page
const related = term.related?.map((id) => getTerm(id)) ?? [];

// i18n — translated term names and definitions
const ptTerms = getLocalizedTerms("pt");
const esTerms = getLocalizedTerms("es");

// Knowledge Graph: build edges from cross-references
const links = allTerms.flatMap((t) =>
  (t.related ?? []).map((relId) => ({ source: t.id, target: relId }))
);

// Quiz: shuffle and sample terms by category
const defiTerms = getTermsByCategory("defi"); // 135 terms for a DeFi-focused quiz
```

---

## Architecture

```
apps/glossary-site/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage (Client Component — real-time search)
│   │   ├── layout.tsx            # Root layout with navbar + i18n
│   │   ├── globals.css           # Solana brand tokens, flashcard 3D CSS
│   │   ├── grafo/
│   │   │   └── page.tsx          # Knowledge graph page (static)
│   │   ├── quiz/
│   │   │   └── page.tsx          # Quiz page (static)
│   │   └── termo/[id]/
│   │       ├── page.tsx          # Term detail (Server Component, per-term metadata)
│   │       └── loading.tsx       # Loading skeleton
│   ├── components/
│   │   ├── KnowledgeGraph.tsx    # D3 force graph (dynamic import, no SSR)
│   │   ├── Quiz.tsx              # Quiz orchestrator + 3 sub-views
│   │   ├── CopyContextButton.tsx # AI context copy button
│   │   ├── LocaleSwitcher.tsx    # Language switcher (Client Component)
│   │   └── ui/button.tsx         # Base button primitive
│   ├── hooks/
│   │   └── useLocale.ts          # Locale state with localStorage persistence
│   └── lib/
│       ├── i18n.ts               # Localized term lookup and search
│       └── categories.ts         # Category labels and brand colors
├── vercel.json                   # Monorepo build config
└── next.config.ts
```

**Rendering strategy:**
- `/` — Static at build time (1001 terms available immediately, search runs client-side)
- `/grafo` — Static (graph data computed client-side from SDK)
- `/quiz` — Static (quiz state is ephemeral client-side)
- `/termo/[id]` — Server-rendered on demand (supports `?lang=` param, full metadata per term)

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Components + static generation |
| Language | TypeScript 5 | Full type safety with SDK types |
| Styling | Tailwind CSS 4 | Utility-first, matches SDK token system |
| Graph | `react-force-graph-2d` | D3 force simulation, canvas rendering |
| Font | Inter (Google Fonts) | Clean, readable for technical content |
| Deploy | Vercel | Zero-config, edge network |

---

## Running Locally

**Prerequisites:** Node.js 18+, npm

```bash
# Clone the monorepo
git clone https://github.com/solanabr/solana-glossary.git
cd solana-glossary

# Build the SDK first (the app depends on the local package)
npm install
npm run build

# Install and run the web app
cd apps/glossary-site
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Or jump straight to the live demo:** [solana-glossary-lek6.vercel.app](https://solana-glossary-lek6.vercel.app)

---

## Deploying to Vercel

The `vercel.json` handles the monorepo setup automatically:

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && npm install && npm run build && cd apps/glossary-site && npm install",
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

1. Import `Jmkoygg/solana-glossary` on [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** → `apps/glossary-site`
3. Deploy — no environment variables needed

---

## Design Decisions

**Why a knowledge graph?**
The `related` field in each term creates a web of 2,000+ connections. Rendering this visually reveals something that a flat list never could: how tightly coupled core Solana concepts are, and how DeFi/ZK/infrastructure clusters emerge naturally from the data.

**Why a quiz?**
Reading a glossary is passive. Testing yourself is active recall — proven to improve retention 2-4x. The quiz turns the same data into a learning tool, not just a reference.

**Why i18n on a glossary?**
Portuguese and Spanish are the primary languages of the Solana ecosystem in Latin America. Being the first glossary that actually works in PT is a real differentiator for the developer community this bounty aims to serve.

**Why "Copy for AI"?**
LLMs hallucinate Solana-specific details constantly. A one-click copy of a full category's terms as structured context fixes this at zero cost to the user. It's a bridge between the glossary and the AI-native development workflow.

---

## Bounty Submission

This is a submission for the [Superteam Brazil Solana Glossary Bounty](https://earn.superteam.fun).

**What's covered:**
- ✅ Frontend web application with full SDK integration
- ✅ Interactive knowledge graph (unique visualization of SDK cross-references)
- ✅ Quiz/Flashcard learning tool
- ✅ i18n support: PT, ES, EN
- ✅ Live deployed demo on Vercel
- ✅ AI-assisted context copy feature
- ✅ Clean, production-quality code — no rough edges

---

## License

MIT — same as the parent repository.
