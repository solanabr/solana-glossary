# Solana Atlas

An interactive 3D knowledge graph of the Solana ecosystem, powered by the [`@stbr/solana-glossary`](https://github.com/solanabr/solana-glossary) data layer.

Explore **1001 terms** across **14 categories** as a live, force-directed 3D graph — hover to highlight connections, click any node to read its definition and navigate related concepts, search to jump straight to what you need.

## Features

- **3D force graph** — 1001 nodes, edges drawn from cross-term `related` references, physics-settled on load
- **Full-text search** — instant results across all terms, keyboard shortcut `⌘K / Ctrl+K`
- **Term panel** — definition, aliases, related terms with one-click navigation
- **Category legend** — 14 color-coded categories with live toggle
- **Dark / light mode** — persisted in `localStorage`, no flash on reload
- **Responsive** — right-side panel on desktop, centered bottom sheet on mobile

## Running locally

```bash
cd apps/solana-atlas
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it uses the SDK

All term data is sourced directly from `data/terms/*.json` in this repository — the same structured data that backs `@stbr/solana-glossary`. The app builds a graph where:

- Each **node** is a `GlossaryTerm`, colored by `category`
- Each **edge** is a `related` reference between two terms
- Node size scales with the number of connections

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| 3D graph | react-force-graph-3d + Three.js |
| State | Zustand |
| Styling | Tailwind CSS v4 |
