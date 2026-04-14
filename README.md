# @stbr/solana-glossary

[![npm version](https://img.shields.io/npm/v/@stbr/solana-glossary)](https://www.npmjs.com/package/@stbr/solana-glossary)
[![npm downloads](https://img.shields.io/npm/dm/@stbr/solana-glossary)](https://www.npmjs.com/package/@stbr/solana-glossary)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Terms](https://img.shields.io/badge/terms-1059-brightgreen)
![Categories](https://img.shields.io/badge/categories-14-blue)
![Tags](https://img.shields.io/badge/tags-16-orange)
![i18n](https://img.shields.io/badge/i18n-pt%20%7C%20es-yellow)

> **[View on npm](https://www.npmjs.com/package/@stbr/solana-glossary)**

**The most comprehensive Solana glossary ever built — 1059 terms, 14 categories, full cross-references, and i18n support. Packaged as an SDK.**

---

## Why This Exists

The original Solana Glossary was one of the most loved resources in the ecosystem — a single place where any developer could look up unfamiliar Solana concepts and immediately get context.

Over time, it got absorbed into generic "Terminology" docs and lost its identity.

**Superteam Brazil is bringing it back** — expanded from ~200 terms to 1059, structured as a proper npm package, and designed to actually ship value:

- **Onboarding** — New devs get instant context on 1059 Solana concepts
- **Go deeper** — Seasoned devs explore cross-referenced technical relationships between terms
- **Vibe coders** — AI-assisted builders can understand what's behind the abstractions
- **Save tokens** — Feed glossary context to LLMs instead of burning tokens re-explaining Solana concepts every prompt

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
console.log(`${allTerms.length} terms loaded`); // 1059
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

### `getTermsByDepth(depth: Depth): GlossaryTerm[]`

Get all terms at a specific depth level.

```typescript
getTermsByDepth(1); // 110 surface-level terms
getTermsByDepth(5); // 56 bottom-level terms
```

### `getTermsByMaxDepth(maxDepth: Depth): GlossaryTerm[]`

Get all terms at or below a given depth level. Useful for progressive disclosure.

```typescript
getTermsByMaxDepth(2); // 382 terms (surface + shallow)
getTermsByMaxDepth(5); // all 1059 terms
```

### `getTermsByTag(tag: string): GlossaryTerm[]`

Get all terms with a specific tag. Tags are cross-cutting concerns that span categories.

```typescript
getTermsByTag("token-2022");   // all Token-2022 extension terms
getTermsByTag("vulnerability"); // all known attack vectors
getTermsByTag("jito");          // Jito ecosystem terms
```

### `getAllTags(): string[]`

Returns all unique tags used across terms, sorted alphabetically.

### `getCategories(): Category[]`

Returns all 14 category identifiers.

### `allTerms: GlossaryTerm[]`

The complete array of all 1059 terms. Useful for building custom indexes or feeding to LLMs.

---

## Categories

| Category | Terms | Description |
|----------|-------|-------------|
| `core-protocol` | 96 | Consensus, PoH, validators, slots, epochs |
| `programming-model` | 82 | Accounts, instructions, programs, PDAs |
| `token-ecosystem` | 70 | SPL tokens, Token-2022, metadata, NFTs |
| `defi` | 144 | AMMs, liquidity pools, lending protocols |
| `zk-compression` | 37 | ZK proofs, compressed accounts, Light Protocol |
| `infrastructure` | 47 | RPC, validators, staking, snapshots |
| `security` | 56 | Attack vectors, audit practices, reentrancy |
| `dev-tools` | 64 | Anchor, Solana CLI, explorers, testing |
| `network` | 58 | Mainnet, devnet, testnet, cluster config |
| `blockchain-general` | 84 | Shared blockchain concepts |
| `web3` | 80 | Wallets, dApps, signing, key management |
| `programming-fundamentals` | 47 | Data structures, serialization, Borsh |
| `ai-ml` | 55 | AI agents, inference on-chain, model integration |
| `solana-ecosystem` | 139 | Projects, protocols, and tooling |

---

## i18n

The glossary ships with internationalization support. Translations override `term` and `definition` while keeping all structural fields (`id`, `category`, `depth`, `related`, `aliases`) in English.

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
    "definition": "Um mecanismo de relogio que prova criptograficamente a passagem de tempo entre eventos..."
  }
}
```

---

## Term Schema

```typescript
type Depth = 1 | 2 | 3 | 4 | 5;

interface GlossaryTerm {
  id: string;          // URL-safe kebab-case identifier
  term: string;        // Display name
  definition: string;  // Plain-text definition (1-3 sentences)
  category: Category;  // One of 14 categories
  depth: Depth;        // Knowledge depth: 1 (surface) to 5 (bottom)
  related?: string[];  // Cross-reference IDs
  aliases?: string[];  // Abbreviations and alternate names
  tags?: string[];     // Cross-cutting concerns (e.g. "token-2022", "jito", "deprecated")
}
```

---

## Depth Levels

Each term has a `depth` rating indicating the knowledge level needed to understand it:

| Depth | Label | Audience | Examples |
|-------|-------|----------|----------|
| 1 | surface | Anyone in crypto | wallet, NFT, SOL, transaction |
| 2 | shallow | Solana beginners | stake, validator, RPC, SPL token |
| 3 | deep | Intermediate devs | Sealevel, Gulf Stream, Turbine, Anchor |
| 4 | abyss | Advanced devs | PoH internals, BPF, CPI, PDAs |
| 5 | bottom | Core / researchers | runtime syscalls, ZK compression internals |

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

### Progressive onboarding

```typescript
import { getTermsByMaxDepth } from "@stbr/solana-glossary";

// Show only beginner-friendly terms
const beginnerTerms = getTermsByMaxDepth(2);

// Unlock more as the user progresses
const intermediateTerms = getTermsByMaxDepth(3);
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
```

---

## License

MIT. See [LICENSE](LICENSE).

---

Built with care by [Superteam Brazil](https://twitter.com/SuperteamBR).
