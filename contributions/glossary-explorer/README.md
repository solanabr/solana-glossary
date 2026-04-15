# solexicon — The Solana Knowledge Platform

> 1001 terms. 14 categories. 3 languages. One platform to learn, explore, and master Solana.

**Live Demo:** _deploy URL_
**MCP Endpoint:** `https://solana-glossary-production-5f40.up.railway.app/mcp`

## What Is This

solexicon is a full-featured learning platform built on top of the `@stbr/solana-glossary` SDK. It transforms a static list of terms into an interactive, AI-powered knowledge base that developers actually want to use.

This is not just a frontend — it's a product with spaced repetition learning, 3D knowledge graphs, live Solana network data, an AI tutor, and curated learning paths.

## Features

### Core Experience
- **1001 terms** statically generated with full SEO, OpenGraph images, and social sharing
- **14 categories** with descriptions, term counts, and preview cards
- **Fuzzy search** powered by Fuse.js across terms, definitions, and aliases
- **i18n** — Full EN / PT-BR / ES support with lazy-loaded translations

### Interactive Knowledge Graph (`/explore`)
- **2D force-directed graph** with `react-force-graph-2d` — 1001 nodes, color-coded by category
- **3D immersive graph** with Three.js (`@react-three/fiber` + `@react-three/drei`) — orbit controls, auto-rotate, hover tooltips
- **Toggle between 2D/3D** with a single click
- Category filtering, search highlighting, click-to-navigate

### Spaced Repetition Flashcards (`/learn/flashcards`)
- **SM-2 algorithm** — the same scientifically proven method used by Anki
- Card states: New → Learning → Review → Mastered
- Difficulty ratings: Again (1), Hard (2), Good (3), Easy (5)
- **Keyboard shortcuts**: Space to reveal, 1-4 to rate
- Daily review queue with optimal intervals
- Progress persisted in localStorage (zero backend required)

### Learning Paths (`/learn/path/[slug]`)
- **5 curated journeys**: Zero to Solana, DeFi Deep Dive, Security Auditor, Token Master, AI & Solana
- Ordered sequence of glossary terms per path
- Per-term completion tracking with progress bars
- Difficulty levels and estimated study hours

### AI Tutor (`/chat`)
- **Streaming responses** via Vercel AI SDK + OpenAI
- **MCP-grounded** — uses all 6 glossary tools for accurate answers
- **3 modes**: Normal (concise), Professor (teaching), Solana Bro (casual)
- **Persistent floating widget** + full-page chat view
- Route-aware context (knows what term/page you're viewing)
- Resilient local fallback if MCP is unavailable

### Code Lab (per-term)
- Real code examples for key terms (Anchor/Rust + TypeScript)
- Syntax highlighting with language tabs
- Copy-to-clipboard
- "Open in Solana Playground" links

### Live Solana Data (per-term)
- Real-time network stats from public Solana mainnet RPC
- Current slot/epoch for protocol terms
- Active validator count, TPS, supply data
- Auto-refresh every 30 seconds with live indicator

### Social Sharing
- **Dynamic OG images** per term (Next.js Edge runtime + `next/og`)
- Twitter/X share with pre-filled text mentioning @SuperteamBR
- Copy link button

### Daily Challenge
- Featured random term each day
- Quick-review quiz format
- Streak tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind CSS 4 + Framer Motion |
| 3D Graph | Three.js + @react-three/fiber + @react-three/drei |
| 2D Graph | react-force-graph-2d |
| AI Chat | Vercel AI SDK + @ai-sdk/openai |
| Search | Fuse.js (client-side fuzzy) |
| Data | @stbr/solana-glossary SDK |
| MCP | Streamable HTTP to Railway-deployed server |
| SRS | Custom SM-2 implementation |
| Storage | localStorage (zero backend) |

## SDK Integration

Every SDK function is used:

| SDK Function | Where Used |
|-------------|-----------|
| `allTerms` | Search, graph, flashcards, learning paths, homepage |
| `getTerm(id)` | Term detail pages, code lab, live data, OG images |
| `searchTerms(query)` | Search bar with Fuse.js enhancement |
| `getTermsByCategory(cat)` | Category pages, learning paths |
| `getCategories()` | Navigation, category grid, graph filtering |
| `getLocalizedTerms(locale)` | i18n throughout all pages |

MCP tools used in AI chat:
- `lookup_term`, `search_terms`, `get_category_terms`
- `get_related_terms`, `explain_concept`, `glossary_stats`

## Pages

```
/                              Landing: search + categories + graph CTA + learn cards
/term/[id]                     Term detail: definition, code lab, live data, share
/category/[slug]               Category: all terms sorted, description
/explore                       2D/3D knowledge graph (full-screen)
/learn                         Learning hub: stats, flashcards CTA, paths
/learn/flashcards              SRS flashcard session
/learn/path/[slug]             Specific learning path with progress
/chat                          Full-page AI tutor
/api/chat                      Streaming AI endpoint
/api/og/[id]                   Dynamic OG image generation (Edge)
```

## Setup

```bash
cd contributions/glossary-explorer
npm install
npm run dev
```

### Environment

Create `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
GLOSSARY_MCP_URL=https://solana-glossary-production-5f40.up.railway.app/mcp
```

`GLOSSARY_MCP_URL` is optional — the deployed Railway endpoint is the default.
`OPENAI_API_KEY` is only needed for the AI chat feature.

## Build

```bash
npm run build    # Generates 1029+ static pages
npm start        # Production server
```

## Architecture

```
src/
  app/
    layout.tsx                  Root layout with dark theme + orb background
    page.tsx                    Landing page (server component)
    globals.css                 Tailwind 4 + glassmorphism + animations
    term/[id]/page.tsx          Static term pages with OG metadata
    category/[slug]/page.tsx    Static category pages
    explore/page.tsx            Knowledge graph
    learn/page.tsx              Learning hub
    learn/flashcards/page.tsx   SRS flashcard session
    learn/path/[slug]/page.tsx  Learning path view
    chat/page.tsx               Full-page AI chat
    api/chat/route.ts           MCP-backed streaming chat endpoint
    api/og/[id]/route.tsx       Dynamic OG image generation (Edge)
  components/
    AppShell.tsx                Layout shell with providers
    Navigation.tsx              Top nav with locale toggle
    HomeClient.tsx              Landing page client component
    SearchBar.tsx               Fuzzy search with keyboard nav
    CategoryGrid.tsx            Category cards with previews
    TermDetail.tsx              Full term page with code lab + live data
    ExploreWrapper.tsx          2D/3D graph toggle wrapper
    ExploreClient.tsx           2D force-directed graph
    KnowledgeGraph3D.tsx        Three.js 3D knowledge graph
    FlashcardSession.tsx        SRS flashcard UI
    LearnHub.tsx                Learning dashboard
    LearningPathView.tsx        Path progress view
    CodeLab.tsx                 Code examples with syntax highlighting
    LiveDataBadge.tsx           Real-time Solana network stats
    ShareButton.tsx             Twitter/X + copy link sharing
    ChatPanel.tsx               Shared chat UI
    ChatWidget.tsx              Floating AI assistant
  contexts/
    LocaleContext.tsx            Global i18n state
    ChatContext.tsx              Shared chat session
    LearningContext.tsx          SRS + learning paths state
  lib/
    glossary.ts                 SDK wrapper (re-exports)
    i18n.ts                     Locale definitions + translations
    i18n.server.ts              Server-side localization
    srs.ts                      SM-2 spaced repetition engine
    learning-paths.ts           5 curated learning paths
    code-examples.ts            Term → code snippet mapping
    solana-rpc.ts               Live Solana RPC data fetching
    chat-tools.ts               MCP tool wrappers with fallback
    mcp.ts                      JSON-RPC Streamable HTTP client
    categories.ts               Category metadata
    types.ts                    TypeScript type definitions
```

## What Makes This Different

| Feature | Us | Typical Competitor |
|---------|----|--------------------|
| SM-2 Spaced Repetition | Scientifically proven Anki method | Basic flashcard flip |
| 3D Knowledge Graph | Three.js immersive + 2D toggle | Static list or flat graph |
| Live Solana Data | Real-time RPC per term | No network data |
| Code Lab | Real Anchor + TS examples per term | No code |
| AI Tutor | MCP-grounded streaming chat | Generic AI or none |
| Learning Paths | 5 curated journeys with progress | No guided learning |
| Widget SDK | Embeddable on any page | Single-site only |
| i18n | EN + PT-BR + ES | English only |
| OG Images | Dynamic per-term social cards | Generic or none |

## Verification

```bash
# Build (generates 1029+ pages)
cd contributions/glossary-explorer && npm run build

# Root SDK tests
cd <repo-root> && npm test

# Widget build
cd contributions/glossary-widget && npm run build
```

## License

MIT
