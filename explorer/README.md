# Solana Glossary Explorer

A premium, interactive frontend for browsing the **1001+ terms** in the `@stbr/solana-glossary` SDK. Built as a production-grade discovery engine with a dark-mode-first glassmorphism design, debounced search, multi-language support, and responsive layouts.

> **Live Demo**: [https://solana-glossary-explorer.vercel.app](https://solana-glossary-explorer.vercel.app)

---

## Features

| Feature | Description |
| :--- | :--- |
| **Real-time Search** | Debounced (300ms) filtering across terms, definitions, and aliases |
| **Category Filtering** | Browse by 14 categories with responsive horizontal scrolling on mobile |
| **i18n Support** | Switch between English, Portuguese (pt-BR), and Spanish (es) |
| **Premium UI** | Glassmorphism cards, animated background orbs, gradient hover effects |
| **Performance** | `React.memo` on cards, debounced input, zero layout thrashing |
| **Keyboard Shortcuts** | `Cmd+K` / `Ctrl+K` to focus search instantly |
| **Responsive** | Mobile-first design with adaptive grid (1–3 columns) |
| **SDK Integration** | Consumes `@stbr/solana-glossary` directly via local link |

## New Terms Added

This contribution also enriches the glossary data layer with **5 modern Solana ecosystem terms** (with full PT and ES translations):

- **Agave 2.0** — Next-gen Anza validator client with Central Scheduler and SIMD-0123
- **Solana Seeker** — Second-generation Solana mobile device with Seed Vault
- **Vibe Station** — Community-driven physical+digital hubs for builders
- **Kyiv Scheduler** — Dynamic transaction scheduler reducing lock contention
- **HyperGrid** — Native scaling framework for high-performance AppChains

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Routing | React Router DOM v7 |
| Data | `@stbr/solana-glossary` SDK (local link) |
| Fonts | Plus Jakarta Sans, Space Grotesk (Google Fonts) |
| Deployment | Vercel |

## Architecture

```
explorer/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # Logo, language switcher, external link
│   │   ├── SearchBar.tsx       # Debounced Cmd+K search with glow effect
│   │   ├── CategoryFilter.tsx  # Scrollable pill-based category filter
│   │   └── TermCard.tsx        # Memoized glassmorphism term card
│   ├── context/
│   │   └── GlossaryContext.tsx # Central state: terms, filtering, i18n
│   ├── lib/
│   │   └── sdk.ts              # SDK wrapper re-exporting glossary functions
│   ├── App.tsx                 # Main layout with animated background
│   ├── index.css               # Tailwind theme tokens + custom animations
│   └── main.tsx                # React entry point
├── vercel.json                 # SPA rewrite rules for react-router
├── index.html                  # Google Fonts preconnect + meta tags
└── package.json                # Dependencies + build scripts
```

## Setup

```bash
# From the repository root
cd explorer
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Production Build

```bash
npm run build    # outputs to explorer/dist/
npm run preview  # preview the production build locally
```

### Vercel Deployment

Because the explorer depends on the parent SDK via `file:..`, use this build command in Vercel:

| Setting | Value |
| :--- | :--- |
| Root Directory | `explorer` |
| Framework | Vite |
| Build Command | `cd .. && npm install && npm run build && cd explorer && npm install && npm run build` |
| Output Directory | `dist` |

## SDK Usage

The explorer consumes the glossary SDK through a thin wrapper at `src/lib/sdk.ts`:

```typescript
import { allTerms, getTerm, searchTerms, getCategories, getTermsByCategory } from '@stbr/solana-glossary';

// 1001+ terms, 14 categories, full i18n
const terms = allTerms;
const results = searchTerms('proof of history');
const categories = getCategories();
```

## Performance Optimizations

- **Debounced search** — 300ms delay prevents re-renders on every keystroke
- **React.memo** — TermCard only re-renders when its specific term data changes
- **No layout animations on grid** — removed expensive `AnimatePresence` + `layout` props
- **Static locale imports** — PT/ES translations loaded at build time, not runtime

## License

MIT
