# Solana WTF - What The Fork?!

> **Live demo:** [giulopesgalvao.com.br/solana-wtf](https://giulopesgalvao.com.br/solana-wtf)

An interactive developer tool that transforms the [@stbr/solana-glossary](https://github.com/solanabr/solana-glossary) SDK into a learning experience with AI-powered decoding, personality guides, and gamified retention.

## What it does

**Decoder** - Paste any Solana error, transaction log, code snippet, or question. The decoder identifies glossary terms in your text and explains them through one of 4 AI personality guides:

- **Maid-chan** - Kawaii explanations with emoji
- **Degen Sensei** - CT slang, "ser", "few understand this"
- **GLaDOS** - Passive-aggressive, sarcastic precision
- **DnD Master** - Epic fantasy narration for every concept

**Glossary Browser** - Browse, search, and filter 1001 terms across 14 categories. Full i18n support with English, Portuguese (PT-BR), and Spanish.

**5 Learning Games:**

| Game | Description |
|------|-------------|
| **WTF Daily** | Guess a term from its censored definition. One per day. |
| **Speed Run** | 60 seconds. Definition appears. Pick the correct term from 4 options. |
| **Connections** | Group 16 terms into 4 categories (like NYT Connections). |
| **Lost in Translation** | PT-BR definition shown. Find the matching English term. |
| **Category Blitz** | 45 seconds. A term appears. Pick its category. |

## SDK Integration

This project uses `@stbr/solana-glossary` as the data layer:

- **1001 terms** loaded from `data/terms/*.json`
- **14 categories** with label mappings
- **i18n data** from `data/i18n/pt.json` and `data/i18n/es.json`
- Custom wrapper (`src/lib/glossary.ts`) provides server-side functions:
  - `getAllTerms()` - All terms, cached in memory
  - `getTerm(id)` - O(1) lookup by ID
  - `searchTerms(query)` - Search by term name, definition, aliases
  - `getTermsByCategory(category)` - Filter by category
  - `getLocalizedTerms(locale)` - Get terms with PT-BR/ES translations applied
  - `getRelatedTerms(id)` - Resolve related term references
  - `getCategories()` - All category slugs
  - `getRandomTerm()` - Random term selection

## Tech Stack

- **Next.js 16** with App Router and Turbopack
- **React 19** with Server Components
- **Tailwind CSS v4** with inline theme configuration
- **TypeScript** throughout
- **Static generation** - 1001+ pages pre-rendered at build time
- **No external AI API** - Personality responses are template-based, zero cost

## Project Structure

```
src/
  app/
    page.tsx                  Homepage with decode bar hero, categories, games
    hero-decode.tsx           Interactive decode bar (client component)
    globals.css               Full design system (Solana palette, glow effects)
    layout.tsx                Root layout with fonts
    decoder/page.tsx          Decoder page with personality system
    glossary/
      page.tsx                Server component - loads all locale data
      glossary-client.tsx     Client component - search, filter, i18n switch
      [id]/page.tsx           Term detail (1001 static pages)
    games/
      page.tsx                Games hub
      speedrun/page.tsx       Speed Run game
      daily/page.tsx          WTF Daily game
      connections/page.tsx    Connections game
      translation/page.tsx    Lost in Translation game
      blitz/page.tsx          Category Blitz game
    api/
      decode/route.ts         POST - term detection + personality explanation
      games/terms/route.ts    GET - shuffled terms for games
  lib/
    glossary.ts               Server-side SDK wrapper (reads JSON from data/)
    glossary-client.ts        Client-side types and category labels
```

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 to see the app.

```bash
# Production build
npm run build
npm start
```

### Environment Variables (optional)

Cloud progress sync requires a Supabase project:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The app works fully without these — progress is stored in localStorage by default.

## Design System

Deep navy palette with Solana's official accent colors:

- Background: `#0b0d1a` to `#161b35`
- Purple: `#9945FF` (Solana primary)
- Green: `#14F195` (Solana secondary)
- Blue: `#03E1FF`
- Magenta: `#DC1FFF`
- Pink: `#ff6b9d`

Custom CSS classes: `glow-card`, `neon-btn`, `gradient-text`, `pixel-badge`, `search-glow`, `category-pill`, ambient `orb` backgrounds.

Font stack: Inter (body), Fira Code (mono), Press Start 2P (pixel badges).

## i18n Support

The glossary supports 3 languages:
- **English** (default) - All 1001 terms
- **Portuguese (PT-BR)** - Localized definitions
- **Spanish (ES)** - Localized definitions

Language switching is instant - all locale data is pre-loaded server-side and passed to the client.

## Built for

[Superteam Brazil - Solana Glossary Challenge](https://earn.superteam.fun)

---

Built with the [@stbr/solana-glossary](https://github.com/solanabr/solana-glossary) SDK.
