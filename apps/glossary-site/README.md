# Glossário Solana — Web App

> **[🚀 Live Demo](https://solana-glossary-lek6.vercel.app)** · Built on top of [`@stbr/solana-glossary`](https://github.com/solanabr/solana-glossary) for the Superteam Brazil Bounty

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](../LICENSE)

---

## What Is This?

A **full-featured web application** that transforms the `@stbr/solana-glossary` SDK into an interactive learning and reference platform for Solana developers — from complete beginners to protocol engineers.

Five tools in one:

| Feature | Description |
|---|---|
| **✦ AI Assistant** | Ask questions about any term — answered by Gemini, grounded in the glossary data |
| **📚 Glossary** | Browse and search 1001 terms with real-time filtering by category |
| **🕸️ Knowledge Graph** | Interactive force-directed graph showing how all 1001 terms connect |
| **🎯 Quiz** | Learn by doing — multiple choice and 3D flashcard modes |
| **🌍 i18n** | Full PT / ES / EN support across every page |

Built with Solana's visual identity (purple → green gradient) and deployed on Vercel.

---

## Features

### ✦ AI Assistant — Glossary-Grounded Answers on Every Term Page

Every term page has an inline AI assistant powered by Gemini 2.5 Flash. It's not a generic chatbot — responses are grounded in:

- The term's full definition and aliases
- Related terms from the glossary cross-reference graph
- The top terms from the same category

```
User opens /termo/pda → clicks "Ask AI"
User: "Como usar PDAs no Anchor?"
AI: "No Anchor, derive o PDA com `seeds = [b"user", user.key().as_ref()]`
     e armazene o bump canonical na conta. Use `init` com `seeds`
     e `bump` no contexto para criação automática..."
```

Quick suggestion buttons auto-populate based on locale (PT/ES/EN). Language detection is automatic — ask in Portuguese, get Portuguese back.

**Setup:** Add `GEMINI_API_KEY` to your Vercel environment variables. The component gracefully stays visible without the key (shows configuration message), so no UX breakage in dev.

### 📚 Glossary — Instant Search Across 1001 Terms

- Real-time search filtering term names, definitions, and aliases
- Filter by any of the 14 categories with color-coded pills
- Random term button for discovery
- Each term page shows full definition, aliases, and related terms
- SEO metadata on every term at `/termo/[id]` — title, description, OG image

### 🧠 4-Layer Context on Term Pages

For 76 key terms, the term page goes beyond the definition:

| Layer | What it adds |
|---|---|
| 📖 **O que é** | The SDK definition |
| 💡 **Como pensar sobre isso** | A mental model / analogy |
| 🛠️ **Por que builders usam** | Practical builder use case |
| ⚠️ **Erro comum** | The most common mistake to avoid |

### 🖼️ Dynamic OG Images — 1001 Social Cards

Every term has a custom `/opengraph-image` generated at request time with the term name, category badge, definition excerpt, and Solana branding. Share any term on Twitter and it renders a proper preview card.

### 🕸️ Knowledge Graph — Visualize the Entire Ecosystem

- Force-directed graph of all 1001 terms and their cross-references
- Filter by category — isolate only DeFi, ZK Compression, Security, etc.
- Search highlights a specific term with a glow ring
- Click any node to navigate to that term's detail page
- Live counter: nodes and connections update as you filter

### 🎯 Quiz — Two Modes, Fully Gamified

**Multiple Choice** — see the definition, pick the right term from 4 options. Instant color feedback, progress bar, live score counter.

**Flashcard** — see the term, tap to flip with a real CSS 3D animation, mark each card as known/unknown. Category-specific gradient on the back.

**Results Screen** — SVG ring progress chart with gradient fill, correct/incorrect breakdown, confetti animation for scores ≥ 70%.

**Setup** — choose mode, filter to specific categories (Security only? DeFi only?), pick question count (10 / 20 / 50 / all).

### 🌍 Full i18n — PT / ES / EN

Every page works in three languages. Locale persists in `localStorage`. AI assistant auto-detects language from the question.

```
/?lang=pt → Portuguese definitions
/?lang=es → Spanish definitions
/?lang=en → Original English
```

### 📋 Copy Context for AI

One-click button on every term page copies the full category's terms as a structured context block. Paste into Claude, ChatGPT, or any LLM prompt — correct Solana context with zero hallucination risk.

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

// Homepage: all 1001 terms
const terms = allTerms;

// Real-time search across names, definitions, aliases
const results = searchTerms(query);

// Term detail page
const term = getTerm("proof-of-history");
const related = term.related?.map((id) => getTerm(id)) ?? [];

// i18n
const ptTerms = getLocalizedTerms("pt");
const esTerms = getLocalizedTerms("es");

// Knowledge Graph: edges from cross-references
const links = allTerms.flatMap((t) =>
  (t.related ?? []).map((relId) => ({ source: t.id, target: relId }))
);

// AI Assistant: assembles system prompt from SDK data
const context = getTermsByCategory(term.category)
  .slice(0, 8)
  .map((t) => `${t.term}: ${t.definition}`)
  .join("\n");
// → fed to Gemini as grounding context

// Quiz: shuffle and sample by category
const defiTerms = getTermsByCategory("defi"); // 135 terms
```

---

## Architecture

```
apps/glossary-site/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Homepage — real-time search
│   │   ├── layout.tsx                # Root layout with navbar + i18n
│   │   ├── globals.css               # Solana brand tokens, flashcard 3D CSS
│   │   ├── api/ask/
│   │   │   └── route.ts              # AI endpoint — assembles SDK context → Gemini
│   │   ├── grafo/
│   │   │   └── page.tsx              # Knowledge graph
│   │   ├── quiz/
│   │   │   └── page.tsx              # Quiz
│   │   └── termo/[id]/
│   │       ├── page.tsx              # Term detail — 4 layers + AI + OG metadata
│   │       ├── loading.tsx           # Loading skeleton
│   │       └── opengraph-image.tsx   # Dynamic OG image per term
│   ├── components/
│   │   ├── GlossaryAI.tsx            # Inline AI chat panel
│   │   ├── KnowledgeGraph.tsx        # Force graph (dynamic import, no SSR)
│   │   ├── Quiz.tsx                  # Quiz orchestrator
│   │   ├── CopyContextButton.tsx     # Copy category context for LLMs
│   │   ├── TermProgress.tsx          # Exploration progress tracker
│   │   └── LocaleSwitcher.tsx        # Language switcher
│   ├── hooks/
│   │   └── useLocale.ts              # Locale state + localStorage
│   └── lib/
│       ├── i18n.ts                   # Localized term lookup
│       ├── categories.ts             # Labels and brand colors
│       └── term-context.ts           # 76 hand-written context entries
├── vercel.json
└── next.config.ts
```

**Rendering strategy:**
- `/` — Static (search runs client-side)
- `/grafo` — Static (graph computed client-side)
- `/quiz` — Static (ephemeral state)
- `/termo/[id]` — Dynamic (supports `?lang=`, full per-term metadata + AI)
- `/api/ask` — Dynamic edge function (Gemini call)
- `/termo/[id]/opengraph-image` — Dynamic (generated per term)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI | Gemini 2.5 Flash via REST API |
| Graph | `react-force-graph-2d` |
| Font | Inter (Google Fonts) |
| Deploy | Vercel |

---

## Running Locally

**Prerequisites:** Node.js 18+, npm

```bash
# Clone the monorepo
git clone https://github.com/solanabr/solana-glossary.git
cd solana-glossary

# Build the SDK first
npm install && npm run build

# Set up the web app
cd apps/glossary-site
npm install

# Optional: AI assistant (get free key at aistudio.google.com/apikey)
echo "GEMINI_API_KEY=your_key_here" > .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Live demo (no setup needed):** [solana-glossary-lek6.vercel.app](https://solana-glossary-lek6.vercel.app)

---

## Deploying to Vercel

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && npm install && npm run build && cd apps/glossary-site && npm install",
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

1. Import `solanabr/solana-glossary` fork on [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** → `apps/glossary-site`
3. Add environment variable: `GEMINI_API_KEY` (free at [aistudio.google.com](https://aistudio.google.com/apikey))
4. Deploy

---

## Design Decisions

**Why a glossary-grounded AI instead of a generic chatbot?**
LLMs hallucinate Solana-specific details constantly — wrong account sizes, invented program addresses, outdated API signatures. By assembling the system prompt from `getTerm()` and `getTermsByCategory()` data, every answer is anchored to verified glossary content. The AI can't invent a PDA derivation it didn't read from the SDK.

**Why a knowledge graph?**
The `related` field creates 2,000+ cross-references. Rendering this visually reveals how tightly coupled Solana concepts are — DeFi, ZK, and infrastructure clusters emerge naturally from the data structure.

**Why dynamic OG images?**
1001 terms means 1001 shareable moments. When a developer tweets "just learned about Tower BFT", the link should render a polished preview card — not a generic site thumbnail.

**Why i18n on a glossary?**
Portuguese and Spanish are the primary languages of the Solana ecosystem in Latin America. This bounty is by Superteam Brazil — the first glossary that actually works in PT is a direct value-add for the community it's meant to serve.

---

## Bounty Submission

This is a submission for the [Superteam Brazil Solana Glossary Bounty](https://earn.superteam.fun).

- ✅ Frontend web application with full SDK integration
- ✅ Glossary-grounded AI assistant (Gemini 2.5 Flash) on every term page
- ✅ Interactive knowledge graph (1001 nodes, 2000+ edges from `related` field)
- ✅ Quiz with multiple-choice + 3D flashcard modes
- ✅ 4-layer context for 76 key terms (analogy, builder use, common mistake)
- ✅ Dynamic OG images for all 1001 term pages
- ✅ Full i18n: PT / ES / EN
- ✅ Live deployed demo on Vercel

---

## License

MIT — same as the parent repository.
