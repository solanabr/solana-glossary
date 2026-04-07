# `@stbr/glossary-cli` — Solana Glossary CLI

> Search, explore, and quiz yourself on 1001 Solana terms directly from your terminal.

Built on top of the [`@stbr/solana-glossary`](https://github.com/solanabr/solana-glossary) SDK for the [Superteam Brazil Bounty](https://earn.superteam.fun).

---

## Usage

```bash
npx @stbr/glossary-cli <command> [options]
```

Or install globally:

```bash
npm install -g @stbr/glossary-cli
solana-glossary <command>
```

---

## Commands

### `search <query>`

Full-text search across term names, definitions, and aliases.

```bash
$ solana-glossary search pda

  ◆ Solana Glossary  1001 terms · 14 categories

  8 results for "pda"

  ▸ Program Derived Address (PDA)  (PDA)
    Programming Model  An account address derived deterministically from a program…
    id: pda

  ▸ PDA Seeds
    Programming Model  The combination of byte arrays used to derive a PDA address…
    id: seeds
  …
```

### `get <id-or-alias>`

Show full details for a specific term by ID or alias.

```bash
$ solana-glossary get proof-of-history
$ solana-glossary get PoH      # alias lookup
$ solana-glossary get AMM      # also works
```

### `cat <category>`

List all terms in a category.

```bash
$ solana-glossary cat defi
$ solana-glossary cat security
$ solana-glossary cat core-protocol
```

Available categories: `core-protocol`, `programming-model`, `token-ecosystem`, `defi`, `zk-compression`, `infrastructure`, `security`, `dev-tools`, `network`, `blockchain-general`, `web3`, `programming-fundamentals`, `ai-ml`, `solana-ecosystem`

### `random`

Show a random term — great for daily learning.

```bash
$ solana-glossary random
```

### `quiz`

Interactive multiple-choice quiz in the terminal.

```bash
$ solana-glossary quiz                        # 10 questions, all terms, Portuguese
$ solana-glossary quiz --count 20             # 20 questions
$ solana-glossary quiz --cat security         # quiz only security terms
$ solana-glossary quiz --lang en              # English definitions
$ solana-glossary quiz --lang es              # Spanish definitions
$ solana-glossary quiz --count 50 --cat defi  # 50 DeFi questions
```

Example session:

```
  ◆ Solana Glossary  1001 terms · 14 categories

  Quiz  10 questions

  Q1/10  Core Protocol

  "A clock mechanism that cryptographically proves the passage of time
  between events using a sequential SHA-256 hash chain."

  1. Proof of History (PoH)
  2. Tower BFT
  3. Gossip Protocol
  4. Gulf Stream

  Your answer (1-4): 1

  ✓ Correct!  Proof of History (PoH)

  Score: 1/1  (100%)  ██████████
```

### `stats`

Show term counts by category with a visual bar chart.

```bash
$ solana-glossary stats

  Terms by category:

  Solana Ecosystem      ████████████████████  138
  DeFi                  ████████████████████  135
  Core Protocol         ████████████          86
  …

  Total: 1001 terms
```

### `list`

Output all 1001 term IDs as tab-separated values — pipe-friendly for scripting.

```bash
$ solana-glossary list
$ solana-glossary list | grep defi
$ solana-glossary list | wc -l
```

---

## SDK Integration

This CLI uses the full `@stbr/solana-glossary` API:

```typescript
import {
  allTerms,          // All 1001 terms
  getTerm,           // Lookup by ID or alias
  searchTerms,       // Full-text search
  getTermsByCategory,// Category filter
  getCategories,     // All 14 categories
} from "@stbr/solana-glossary";

import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
// getLocalizedTerms("pt") → Portuguese translations
// getLocalizedTerms("es") → Spanish translations
```

---

## Running Locally

```bash
# Clone the monorepo
git clone https://github.com/solanabr/solana-glossary.git
cd solana-glossary

# Build the SDK
npm install && npm run build

# Set up the CLI
cd apps/cli
npm install
npm run build

# Run
node dist/index.js --help
node dist/index.js search "account model"
node dist/index.js quiz --count 10 --cat defi
```

---

## Use Cases for Builders

- **Daily learning**: `solana-glossary random` every morning
- **Pre-audit prep**: `solana-glossary cat security` to review all 48 security terms
- **Code review**: `solana-glossary get reentrancy` to look up a term while reading code
- **Script integration**: `solana-glossary list | grep defi` to get term IDs for automation
- **Team quizzes**: `solana-glossary quiz --count 20` for onboarding sessions
- **i18n support**: `--lang pt` or `--lang es` for Portuguese/Spanish teams

---

## License

MIT — same as the parent repository.
