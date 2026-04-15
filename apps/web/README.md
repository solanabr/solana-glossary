# @stbr/solana-glossary-web

A beautiful, searchable web interface for the [Solana Glossary](https://github.com/solanabr/solana-glossary) — 1001 terms, 14 categories, full cross-references, and pt-BR i18n support.

## Features

- 🔍 Real-time full-text search across all 1001 terms
- 🗂 Filter by 14 categories with term counts
- 📖 Term detail modal with related terms navigation
- 🌐 pt-BR / EN language toggle
- 📱 Fully responsive (mobile + desktop)
- ⚡ Static — no API, all data from `@stbr/solana-glossary` SDK

## Local dev
```bash
git clone https://github.com/solanabr/solana-glossary
cd solana-glossary
npm install && npm run build

cd apps/web
npm install ../../ --save
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 15 + TypeScript
- Tailwind CSS
- `@stbr/solana-glossary` SDK (local)
- Google Fonts: JetBrains Mono + Syne

## License

MIT
