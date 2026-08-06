# Solana Glossary — Dev Copilot

> An AI-powered Solana developer assistant built on the official `@stbr/solana-glossary` SDK.

![Terms](https://img.shields.io/badge/terms-1059-brightgreen)
![Categories](https://img.shields.io/badge/categories-14-blue)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple)

## What is this?

A production web app that helps you understand Solana concepts in real time. It combines:

- **1059 official glossary terms** from `@stbr/solana-glossary`
- **AI responses** powered by Google Gemini
- **Instant search** across terms, definitions, and aliases
- **Code explanation** — paste Solana/Anchor code, get concept breakdowns
- **Clickable term highlighting** in AI responses
- **Category explorer** across all 14 official categories

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Data | `@stbr/solana-glossary` (1059 terms, 14 categories) |
| AI | Google Gemini |
| Backend | Vercel serverless functions (Gemini) |
| Animation | Framer Motion |
| Markdown | react-markdown |

## Glossary SDK

The app consumes the official `@stbr/solana-glossary` package directly (resolved via the monorepo workspace):

```typescript
import { getTerm, searchTerms, getTermsByCategory, allTerms } from "@stbr/solana-glossary";

const pda = getTerm("pda");               // by ID
const same = getTerm("PoH");              // by alias
const results = searchTerms("account");   // matches name, definition, aliases
const defiTerms = getTermsByCategory("defi");

console.log(allTerms.length); // 1059
```

## Getting Started

This app is part of an npm-workspaces monorepo. Install from the repo root so the `@stbr/solana-glossary` workspace symlink resolves:

```bash
npm install                 # from the repo root
npm run dev -w apps/web     # dev server on http://localhost:8080
```

Other scripts: `npm run build -w apps/web`, `npm run lint -w apps/web`, `npm run test -w apps/web`.

## Architecture

The SPA browses, searches, and localizes entirely client-side off the bundled SDK. AI features (copilot chat, code explanation, quiz) call same-origin **Vercel serverless functions** that build RAG context from the SDK and proxy to Google Gemini.

## License

MIT

---

Built for the Solana ecosystem by [Superteam Brazil](https://twitter.com/SuperteamBR).

Frontend originally created by [eduardo3071](https://github.com/eduardo3071) ("Solana Dev Copilot"); ported and re-architected here.
