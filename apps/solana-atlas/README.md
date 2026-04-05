# Solana Atlas

A 3D knowledge graph built on top of the glossary data. Every term is a node, every `related` reference is an edge — all 1001 of them rendered in a live force-directed scene using Three.js and react-force-graph-3d.

The idea is simple: a flat list of terms is hard to reason about. A graph shows you the shape of the ecosystem at a glance. Core concepts like `account`, `transaction`, and `PDA` end up at the center because they have the most connections. Niche terms like specific DeFi protocols or ZK primitives sit at the edges. You can see that just by looking.

## Features

- 3D force graph — nodes laid out by physics, color-coded by the 14 categories from the `category` field
- Click any node to open a panel with the full definition, aliases, and clickable related terms
- Full-text search with `Ctrl+K` / `Cmd+K`
- Category legend
- Dark and light mode, saved across sessions
- Responsive — right-side panel on desktop, centered bottom sheet on mobile

## Setup

```bash
cd apps/solana-atlas
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables needed.

## How it reads the data

Imports directly from `data/terms/*.json` in this repo — no copy, no package install required. Each `GlossaryTerm` becomes a graph node. The `related` array becomes edges. Node size scales with connection count.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| 3D graph | react-force-graph-3d + Three.js |
| State | Zustand |
| Styling | Tailwind CSS v4 |
