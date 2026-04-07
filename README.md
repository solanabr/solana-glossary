# @stbr/solana-glossary

[![npm version](https://img.shields.io/npm/v/@stbr/solana-glossary)](https://www.npmjs.com/package/@stbr/solana-glossary)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Terms](https://img.shields.io/badge/terms-1004-brightgreen)
![Categories](https://img.shields.io/badge/categories-14-blue)

**The most comprehensive Solana glossary ever built — 1004 terms, 14 categories, full cross-references, and i18n support. Packaged as an SDK.**

## Apps Built on Top

- [Glossary OS](./apps/glossary-os/README.md): a multilingual premium frontend for exploring the glossary as a hostable product.
- Glossary OS also includes onboarding quizzes, builder paths, concept graphs, and AI-ready context handoff.

## Data Expansion Tooling

The repository also includes a lightweight expansion pipeline for discovering candidate terms and flagging existing entries for freshness review.

What it does:

- scans a manifest of watched Solana docs, repos, and blogs
- extracts candidate phrases that are not already in the glossary
- flags existing terms that appear repeatedly in watched sources
- writes a JSON report that can be reviewed before opening a data PR

Run the real manifest:

```bash
npm run expand:data
```

Run the local fixture:

```bash
npm run expand:data:fixture
```

Outputs:

- `data/expansion/last-report.json`
- `data/expansion/fixture-report.json`

Source manifest:

- `data/expansion/sources.json`

---

## Why This Exists

The original Solana Glossary was one of the most loved resources in the ecosystem — a single place where any developer could look up unfamiliar Solana concepts and immediately get context.

Over time, it got absorbed into generic "Terminology" docs and lost its identity.

**Superteam Brazil is bringing it back** — expanded from ~200 terms to 1004, structured as a proper npm package, and designed to actually ship value:

- **Onboarding** — New devs get instant context on 1004 Solana concepts
- **Go deeper** — Seasoned devs explore cross-referenced technical relationships between terms
- **Vibe coders** — AI-assisted builders can understand what's behind the abstractions
- **Save tokens** — Feed glossary context to LLMs instead of burning tokens re-explaining Solana concepts every prompt
- **Keep growing** — Data expansion tooling can surface new candidate terms and freshness reviews before a data PR lands

---

## Install

```bash
npm i @stbr/solana-glossary
```

```bash
pnpm add @stbr/solana-glossary
```

```bash
yarn add @stbr/solana-glossary
```

---

## Quick Start

```typescript
import { getTerm, searchTerms, getTermsByCategory, allTerms } from "@stbr/solana-glossary";

// Look up a term by ID
const poh = getTerm("proof-of-history");
console.log(poh?.definition);

// Look up by alias
const same = getTerm("PoH"); // Same result

// Search across names, definitions, and aliases
const results = searchTerms("account");

// Get all terms in a category
const defiTerms = getTermsByCategory("defi");

// Access everything
console.log(`${allTerms.length} terms loaded`); // 1004
```

---

## API Reference

### `getTerm(idOrAlias: string): GlossaryTerm | undefined`

Look up a term by its exact ID or any of its aliases (case-insensitive for aliases).

```typescript
getTerm("pda");           // by ID
getTerm("PDA");           // by alias → same term
getTerm("nonexistent");   // undefined
```

### `searchTerms(query: string): GlossaryTerm[]`

Full-text search across term names, definitions, IDs, and aliases. Case-insensitive.

```typescript
searchTerms("proof of history"); // finds PoH and related terms
searchTerms("AMM");              // finds AMM-related terms
```

### `getTermsByCategory(category: Category): GlossaryTerm[]`

Get all terms belonging to a specific category.

```typescript
getTermsByCategory("defi");           // 135 terms
getTermsByCategory("core-protocol");  // 86 terms
```

### `getCategories(): Category[]`

Returns all 14 category identifiers.

### `allTerms: GlossaryTerm[]`

The complete array of all 1004 terms. Useful for building custom indexes or feeding to LLMs.

---

## Categories

| Category | Terms | Description |
|----------|-------|-------------|
| `core-protocol` | 86 | Consensus, PoH, validators, slots, epochs |
| `programming-model` | 70 | Accounts, instructions, programs, PDAs |
| `token-ecosystem` | 59 | SPL tokens, Token-2022, metadata, NFTs |
| `defi` | 135 | AMMs, liquidity pools, lending protocols |
| `zk-compression` | 34 | ZK proofs, compressed accounts, Light Protocol |
| `infrastructure` | 45 | RPC, validators, staking, snapshots |
| `security` | 48 | Attack vectors, audit practices, reentrancy |
| `dev-tools` | 65 | Anchor, Solana CLI, explorers, testing |
| `network` | 58 | Mainnet, devnet, testnet, cluster config |
| `blockchain-general` | 84 | Shared blockchain concepts |
| `web3` | 80 | Wallets, dApps, signing, key management |
| `programming-fundamentals` | 47 | Data structures, serialization, Borsh |
| `ai-ml` | 55 | AI agents, inference on-chain, model integration |
| `solana-ecosystem` | 138 | Projects, protocols, and tooling |

---

## i18n

The glossary ships with internationalization support. Translations override `term` and `definition` while keeping all structural fields (`id`, `category`, `related`, `aliases`) in English.

```typescript
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";

const ptTerms = getLocalizedTerms("pt"); // Portuguese
const esTerms = getLocalizedTerms("es"); // Spanish
```

**Available locales**: `pt` (Portuguese), `es` (Spanish)

Terms without a translation automatically fall back to English.

### Translation file format

`data/i18n/<locale>.json`:

```json
{
  "proof-of-history": {
    "term": "Prova de História (PoH)",
    "definition": "Um mecanismo de relógio criptográfico que..."
  }
}
```

---

## Term Schema

```typescript
interface GlossaryTerm {
  id: string;          // URL-safe kebab-case identifier
  term: string;        // Display name
  definition: string;  // Plain-text definition (1-3 sentences)
  category: Category;  // One of 14 categories
  related?: string[];  // Cross-reference IDs
  aliases?: string[];  // Abbreviations and alternate names
}
```

---

## Use Cases

### Feed context to LLMs

```typescript
import { getTermsByCategory } from "@stbr/solana-glossary";

const context = getTermsByCategory("defi")
  .map(t => `${t.term}: ${t.definition}`)
  .join("\n");

// Add to your system prompt — no more wasting tokens explaining basics
```

### Build a search index

```typescript
import { allTerms } from "@stbr/solana-glossary";

// Feed into Algolia, MeiliSearch, or any search engine
const searchDocs = allTerms.map(t => ({
  objectID: t.id,
  title: t.term,
  content: t.definition,
  category: t.category,
  tags: t.aliases ?? [],
}));
```

### Onboarding tooltips

```typescript
import { getTerm } from "@stbr/solana-glossary";

// In your UI component
const tooltip = getTerm("pda")?.definition;
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding terms, translations, and submitting PRs.

```bash
npm test        # Run tests
npm run build   # Build package
npm run lint    # Type check
npm run validate # Check data integrity
npm run expand:data # Generate candidate/freshness report
```

---

## License

MIT. See [LICENSE](LICENSE).

---

Built with care by [Superteam Brazil](https://twitter.com/SuperteamBR).
