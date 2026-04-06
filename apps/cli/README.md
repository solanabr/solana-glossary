# @stbr/solana-glossary-cli

A terminal CLI to search and explore the Solana Glossary without leaving your editor.

## Install & Run
```bash
cd apps/cli
npm install
npm run dev -- pda
```

## Commands

| Command | Alias | Description |
|---|---|---|
| `lookup <term>` | `l` | Look up a term by ID or alias |
| `search <query>` | `s` | Full-text search across all terms |
| `category <id>` | `c` | List all terms in a category |
| `categories` | — | List all categories with counts |
| `related <term>` | `r` | Knowledge graph traversal (`--depth 1-3`) |
| `quiz` | `q` | Interactive multiple-choice quiz |

## Options

| Flag | Description |
|---|---|
| `--lang pt` | Portuguese output |
| `--lang es` | Spanish output |
| `--depth <n>` | Traversal depth for `related` (1-3) |
| `--limit <n>` | Max results for search/category |
| `--count <n>` | Number of quiz questions |
| `--category <id>` | Quiz from specific category |

## Design Decisions

- **Dynamic counts**: Term and category counts derived from SDK at runtime — no hardcoded values.
- **SDK-first**: All data from `@stbr/solana-glossary` — CLI is a thin presentation layer.
- **i18n**: Translations use the SDK's `getLocalizedTerms()` with graceful fallback to English.

## Stack

- TypeScript, Commander, Chalk, Boxen
- `@stbr/solana-glossary` SDK
