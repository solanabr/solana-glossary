# Atlas Builder

Glossary-driven Solana project scaffolder. Describe what you want to build in plain English — Atlas Builder maps your intent to `@stbr/solana-glossary` concepts and generates an architecture plan with a ready-to-use folder structure.

Available as both a **web UI** (`apps/atlas-builder`) and a **CLI** (`atlas-builder` bin).

---

## What it does

1. **Detect intent** — parses your description for known Solana project patterns (escrow, staking, NFT, DeFi, DAO, oracle, lending, and more)
2. **Resolve concepts** — maps each detected intent to real `GlossaryTerm` objects from the `@stbr/solana-glossary` SDK
3. **Expand concepts** — optionally follows `related` links one level deep to surface adjacent terms
4. **Generate architecture** — derives components, data flows, and implementation notes from the concept set
5. **Generate structure** — produces a ready-to-scaffold folder tree for an Anchor/Solana project

---

## Web UI

### Setup

```bash
cd apps/atlas-builder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Usage

Type a description of your project in the input field. Results appear live across three panels:

| Panel | Content |
|-------|---------|
| **Concepts** | Resolved glossary terms, grouped by category, with optional definitions |
| **Architecture** | Components, data flows, and implementation notes |
| **Structure** | Copyable folder tree for your Anchor project |

Toggle **Expand concepts** to include related terms one hop away. Each panel has a **Copy** button for quick clipboard access.

---

## CLI

### Install

```bash
# From the glossary repo root
npm run build
npm link
```

### Usage

```bash
atlas-builder <description> [--expand] [--lang=en|es|pt]
```

### Examples

```bash
atlas-builder "build escrow program"
atlas-builder "nft marketplace with royalties" --expand
atlas-builder "defi lending protocol" --lang=pt
```

### Sample output

```
Concepts:
  - Program Derived Address [programming-model]
  - Account [programming-model]
  - Instruction [programming-model]
  - Transaction [core-protocol]
  ...

Architecture:
  Components:
    - Program logic
    - On-chain program
  Flows:
    - Client → RPC → Program → Account read/write
    - Instruction → derive PDA → validate seeds → mutate state
  Notes:
    - PDAs require deterministic seed derivation and bump storage

Structure:
/program
  /src
    /instructions
    /state
    /errors
  Cargo.toml
/tests
  /integration
/scripts
  deploy.ts
```

---

## SDK integration

The builder pipeline is fully exported from `@stbr/solana-glossary`:

```ts
import { buildProject } from "@stbr/solana-glossary";

const result = buildProject("escrow program", { expand: true, lang: "pt" });

result.concepts;       // GlossaryTerm[]
result.architecture;   // { components, flows, notes }
result.structure;      // folder tree string
```

The `lang` option returns localized term names and definitions using the i18n layer (`pt` / `es` supported).

---

## Project structure

```
apps/atlas-builder/
  app/
    layout.tsx          # Title, global styles
    page.tsx            # Interactive builder UI (client component)
    globals.css         # Tailwind v4 + dark background
  components/
    ConceptsPanel.tsx   # Category-grouped term tags + definitions toggle
    ArchitecturePanel.tsx  # Components / Flows / Notes display
    StructurePanel.tsx     # Monospace folder tree + copy
  lib/
    builder.ts          # Thin re-export from src/builder/*

src/builder/            # Core pipeline (part of @stbr/solana-glossary)
  intentMap.ts          # Keyword → glossary term ID mapping (12 intents)
  detectIntent.ts       # Normalizes input, matches against intent map
  resolveConcepts.ts    # Converts intents → GlossaryTerm objects
  expandConcepts.ts     # Depth-1 expansion via `related` field
  generateArchitecture.ts  # Derives components, flows, notes from concepts
  generateStructure.ts     # Produces folder tree from architecture
  builder.ts            # Orchestrates the full pipeline

src/cli/
  atlas-builder.ts      # CLI entry point
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
