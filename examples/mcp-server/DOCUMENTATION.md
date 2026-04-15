# Solana Intelligence MCP Server — Documentation

A comprehensive MCP server that combines 1001 Solana glossary terms with live blockchain data. It exposes 16 tools, 16 resources, 3 resource templates, and 3 prompts over the Model Context Protocol. Supports English, Portuguese, and Spanish.

Built on top of `@stbr/solana-glossary`, `@solana/web3.js`, and the Jupiter Lite API.

## Table of Contents

1. [What This Is](#what-this-is)
2. [Why It Exists](#why-it-exists)
3. [What v2.0 Adds](#what-v20-adds)
4. [Architecture](#architecture)
5. [Glossary Tools (9)](#glossary-tools-9)
6. [Solana Live Tools (7)](#solana-live-tools-7)
7. [Resources](#resources)
8. [Prompts](#prompts)
9. [The Graph Engine](#the-graph-engine)
10. [Search Engines](#search-engines)
11. [Known Programs](#known-programs)
12. [i18n](#i18n)
13. [Setup](#setup)
14. [Connecting to MCP Clients](#connecting-to-mcp-clients)
15. [Tests](#tests)
16. [Project Structure](#project-structure)
17. [Tech Stack](#tech-stack)

## What This Is

The Solana Glossary SDK (`@stbr/solana-glossary`) has 1001 terms organized in 14 categories with cross-references and translations. As a library, it works well when you write code against it. But LLMs can't import npm packages.

This server bridges that gap — and goes further. It wraps the SDK with the Model Context Protocol and adds live blockchain data, so any MCP-compatible client (Claude Desktop, Cursor, Antigravity, or anything that speaks MCP) can query terms, check wallet balances, simulate swaps, and analyze transactions without the user writing a single line of code.

## Why It Exists

The original Solana Glossary was a go-to reference for developers. It got absorbed into a generic terminology page and lost its value. Superteam Brazil rebuilt it as an SDK with 1000+ structured terms.

The SDK is solid, but it only works at the code level. LLMs need tools. MCP is the standard for connecting LLMs to external data. This server makes the full glossary and the live Solana blockchain available as native tools that any AI assistant can call on demand.

## What v2.0 Adds

Version 2.0 transforms the server from a static glossary tool into a live Solana intelligence backend:

**Fuzzy search engine.** Users misspell things. The new `suggest_terms` tool uses Levenshtein distance and Dice coefficient to find what they meant. Type "valdator" and it suggests "Validator" with a 89% confidence score.

**Semantic search engine.** Instead of exact keyword matching, the new `semantic_search` tool builds a TF-IDF index over all 1001 term definitions at startup and uses cosine similarity to answer natural language questions like "how does staking work?" — zero external dependencies.

**Live wallet data.** `get_wallet_balance` and `get_token_balance` query the Solana blockchain in real-time via Helius RPC. Balances come with USD conversion powered by Jupiter.

**Token prices.** `get_token_price` derives real-time USD prices for 14 known tokens (SOL, USDC, JUP, BONK, etc.) or any mint address, using Jupiter Lite API quote-based derivation.

**Transaction analysis.** `get_recent_transactions` lists recent activity for any address. `explain_transaction` parses a transaction signature and identifies the programs involved (24 known programs), decodes instructions, and shows SOL balance changes.

**Address classification.** `what_is_this_address` determines if an address is a wallet, program, token mint, token account, stake account, or vote account — with contextual follow-up suggestions.

**Swap simulation.** `simulate_swap` gets a Jupiter swap quote without executing. Shows expected output, minimum received, price impact, slippage, and the full DEX route.

**Practical code examples.** `lookup_term` now includes code snippets for key terms (PDA derivation, CPI calls, SPL transfers, etc.), making answers immediately actionable.

**Tag system.** Terms are enriched with tags (`defi`, `core`, `accounts`, `security`, etc.) for better categorization and discovery.

## Architecture

```
MCP Client (Claude Desktop, Cursor, Antigravity)
    |
    | stdio (stdin/stdout)
    v
+----------------------------------------------------+
|        Solana Intelligence MCP Server v2.0         |
|                                                    |
|  +-------------+ +----------+ +--------+          |
|  | Tools (16)  | | Resources| | Prompts|          |
|  |             | |  (16+3)  | |  (3)   |          |
|  +------+------+ +----+-----+ +---+----+          |
|         |              |           |               |
|  +------+-----+  +----+-----+ +---+----+          |
|  | Graph      |  | i18n     | | Fuzzy  |          |
|  | Engine     |  | Resolver | | Search |          |
|  | BFS / DFS  |  | (cached) | | Engine |          |
|  +------+-----+  +----------+ +--------+          |
|         |                                          |
|  +------+-----+  +-----------+ +--------+         |
|  | TF-IDF     |  | Solana    | | Jupiter|         |
|  | Semantic   |  | RPC      | | Lite   |         |
|  | Search     |  | (Helius) | | API    |         |
|  +------------+  +-----+----+ +---+----+         |
|                        |           |               |
|  +---------------------+-----------+---+           |
|  |    @stbr/solana-glossary SDK       |           |
|  |    (1001 terms, 14 categories)     |           |
|  +------------------------------------+           |
+----------------------------------------------------+
         |                    |
         v                    v
   Solana Mainnet       Jupiter Lite API
   (via Helius RPC)     (swap/v1/quote)
```

On startup, the server loads all 1001 terms, builds the adjacency graph, initializes the TF-IDF index, computes graph stats, registers all tools/resources/prompts, and connects via stdio transport.

## Glossary Tools (9)

All glossary tools accept an optional `locale` parameter (`"en"`, `"pt"`, `"es"`).

### lookup_term

Finds a term by ID, name, or alias. Returns the definition, category, aliases, practical code examples, tags, and related terms with previews. If the term is not found, suggests similar terms via fuzzy matching.

**Successful lookup:**

```
> lookup_term({ term: "pda" })

📖 **Program Derived Address (PDA)**

An account address derived deterministically from a program ID and a set
of seeds, without needing a corresponding private key.

🏷️ Category: programming-model
🔤 Aliases: PDA
🏷️ Tags: accounts, security, anchor, seeds

💡 **Use case:** Deterministic account addresses derived from seeds — no private key needed

📝 **Code Example:**
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("user"), wallet.toBuffer()],
  programId
);

🔗 Related Terms:
  • Seeds: Byte arrays used as inputs to derive a PDA...
  • Bump Seed: A single byte appended to PDA seeds...
```

**Misspelled term (fuzzy fallback):**

```
> lookup_term({ term: "valdator" })

❌ Term "valdator" not found.

💡 Did you mean:
  1. **Validator** (89% match)
  2. **Validator Client** (62% match)
  3. **Vote Account** (41% match)
```

**Portuguese lookup:**

```
> lookup_term({ term: "pda", locale: "pt" })

📖 **Endereço Derivado de Programa (PDA)**

Um endereço de conta derivado deterministicamente de um ID de programa...

🌐 Language: Português
```

### search_glossary

Full-text search across names, definitions, IDs, and aliases. Returns ranked results.

```
> search_glossary({ query: "proof of history", limit: 3 })

🔍 Found 3 results for "proof of history":

1. **Proof of History (PoH)** [core-protocol]
   A cryptographic clock mechanism that provides a verifiable ordering of events...

2. **Tower BFT** [core-protocol]
   Solana's custom PBFT implementation that leverages Proof of History...

3. **Leader Schedule** [core-protocol]
   A predetermined sequence of validators assigned to produce blocks...
```

### suggest_terms

Fuzzy suggestions for misspelled or partial queries. Combines Levenshtein distance (edit distance) and Dice coefficient (bigram overlap) for robust matching.

```
> suggest_terms({ query: "pruf of histori", limit: 5 })

💡 **Suggestions for "pruf of histori"** (3 matches):

1. **Proof of History** (72% match)
   A cryptographic clock mechanism that provides a verifiable ordering...

2. **Proof of Stake** (45% match)
   A consensus mechanism where validators stake tokens to participate...

3. **History Proof** (38% match)
   A verifiable entry in the Proof of History sequence...
```

### semantic_search

Natural language search using TF-IDF (term frequency-inverse document frequency) with cosine similarity. Ask questions instead of keywords.

```
> semantic_search({ query: "how does staking work on solana?" })

🧠 **Semantic Search Results** for "how does staking work on solana?" (5 matches):

1. **Staking** [core-protocol] — 82% relevance
   The process of locking SOL tokens to support network security...

2. **Stake Account** [core-protocol] — 71% relevance
   A special account type that holds staked SOL tokens...

3. **Delegation** [core-protocol] — 65% relevance
   Assigning staked tokens to a validator without transferring ownership...

4. **Stake Weight** [core-protocol] — 58% relevance
   The amount of staked SOL that determines a validator's influence...

5. **Warmup Period** [core-protocol] — 42% relevance
   The time delay before newly staked tokens become active...
```

### list_category

Lists all terms in one of the 14 categories.

Categories: `core-protocol`, `programming-model`, `token-ecosystem`, `defi`, `zk-compression`, `infrastructure`, `security`, `dev-tools`, `network`, `blockchain-general`, `web3`, `programming-fundamentals`, `ai-ml`, `solana-ecosystem`.

```
> list_category({ category: "defi" })

📂 **defi** (87 terms):

1. **Automated Market Maker (AMM)** — A smart contract that provides liquidity...
2. **Liquidity Pool** — A collection of funds locked in a smart contract...
3. **Yield Farming** — The practice of depositing tokens into DeFi protocols...
...
```

### explain_concept

Runs DFS from a root term through the knowledge graph. Finds connected concepts up to N levels deep and groups them by category.

```
> explain_concept({ term: "validator", depth: 2 })

🔍 **Deep Dive: Validator**

📖 A node that validates transactions and produces blocks on the Solana network.
🏷️ Category: core-protocol

🌐 **Connected Concepts** (depth: 2, found 8 terms):

**core-protocol:**
  • Leader Schedule: A predetermined sequence of validators...
  • Stake Weight: The amount of staked SOL that determines...
  • Vote Account: An account used by validators to submit votes...

**infrastructure:**
  • RPC Node: A server that provides an API for interacting...
  • Gossip Protocol: The peer-to-peer protocol validators use...
```

### get_learning_path

BFS shortest path between two concepts.

```
> get_learning_path({ from: "pda", to: "cpi" })

🛤️ **Learning Path: Program Derived Address (PDA) → Cross-Program Invocation (CPI)**
📏 Distance: 2 steps

🟢 Step 1 (start): **Program Derived Address (PDA)** [programming-model]
   An account address derived deterministically from a program ID...
   ↓
🔵 Step 2: **invoke_signed** [programming-model]
   A function that allows a program to sign CPIs using a PDA...
   ↓
🎯 Step 3 (goal): **Cross-Program Invocation (CPI)** [programming-model]
   Calling one program from another within a transaction...
```

### compare_terms

Side-by-side comparison of 2 to 5 terms. Shows definitions, categories, aliases, shared relationships, and category overlap.

```
> compare_terms({ terms: ["pda", "keypair"] })

⚖️ **Comparing 2 Terms:**

1️⃣ **Program Derived Address (PDA)** [programming-model]
   An account address derived deterministically...
   Aliases: PDA

2️⃣ **Keypair** [programming-model]
   A pair of public and private keys used for signing...

🔗 **Shared relationships:** pubkey, account
📊 **Category overlap:** 100% (both programming-model)
```

### random_term

Returns random terms for discovery. Optional category filter.

```
> random_term({ count: 2, category: "defi" })

🎲 **2 Random Terms** from _defi_:

### Automated Market Maker (AMM)
📖 A smart contract that provides liquidity by using mathematical formulas...
🏷️ Category: defi
🔤 Aliases: AMM
🔗 Related: liquidity-pool, swap, slippage

### Flash Loan
📖 An uncollateralized loan that must be borrowed and repaid within a single transaction...
🏷️ Category: defi
🔗 Related: arbitrage, liquidation
```

## Solana Live Tools (7)

These tools interact with the live Solana blockchain. No API keys are required from the user.

### get_wallet_balance

Gets the SOL balance of any Solana wallet, with USD conversion.

```
> get_wallet_balance({ address: "vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg" })

💰 **Wallet Balance**

  • **Address:** vine...PTg
  • **SOL:** 45.2351 ($7,689.97 @ $170.05/SOL)
  • **Lamports:** 45,235,100,000
```

### get_token_balance

Lists all SPL token holdings for a wallet with USD values.

```
> get_token_balance({ address: "vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg" })

🪙 **Token Holdings for vine...PTg** (4 tokens):

  • **USDC:** 1,250.00 — $1,250.00
  • **JUP:** 5,000.00 — $4,250.00
  • **BONK:** 15,000,000 — $375.00
  • **mSOL:** 10.50 — $1,890.00

💵 **Estimated total value:** $7,765.00
```

### get_token_price

Real-time USD price of any Solana token. Supports 14 known symbols or any mint address.

Known tokens: SOL, USDC, USDT, JUP, RAY, BONK, PYTH, WIF, ORCA, MNDE, mSOL, jitoSOL, RENDER, HNT.

```
> get_token_price({ token: "SOL" })

📊 **SOL Price**

  • **Price:** $170.05
  • **Mint:** So11...1112
  • **Name:** Solana
  • **Decimals:** 9

_Source: Jupiter Lite API (quote-derived)_
```

```
> get_token_price({ token: "BONK" })

📊 **BONK Price**

  • **Price:** $0.000025
  • **Mint:** DezX...B263
  • **Name:** Bonk
  • **Decimals:** 5

_Source: Jupiter Lite API (quote-derived)_
```

### get_recent_transactions

Lists recent transactions for any address.

```
> get_recent_transactions({ address: "vines1vzr...", limit: 3 })

📋 **Recent Transactions for vine...PTg** (3):

1. ✅ Success — 2026-04-02 14:30:00 UTC
   Signature: `5Kz2...xM3f`
   Slot: 312,456,789

2. ✅ Success — 2026-04-02 14:25:12 UTC
   Signature: `3Rn8...kP2a`
   Slot: 312,456,650

3. ❌ Failed — 2026-04-02 14:20:45 UTC
   Signature: `7Jw4...mN9c`
   Slot: 312,456,500

_Use 'explain_transaction' with a signature for detailed analysis._
```

### explain_transaction

Parses and explains a transaction in detail. Identifies all programs involved, decodes instructions, and shows balance changes.

```
> explain_transaction({ signature: "5Kz2...xM3f" })

🔍 **Transaction Analysis**

  • **Status:** ✅ Success
  • **Signature:** `5Kz2...xM3f`
  • **Slot:** 312,456,789
  • **Time:** 2026-04-02 14:30:00 UTC
  • **Fee:** 0.000005 SOL (5,000 lamports)

🔧 **Programs Involved** (3):
  ✅ System Program — `1111...1111`
  ✅ Token Program — `Toke...5DA`
  ✅ Jupiter v6 — `JUP6...aV4`

📝 **Instructions** (2):
  1. **Jupiter v6** → Route
     inputMint: So11...1112
     outputMint: EPjF...Dt1v
     inAmount: 1000000000

  2. **Token Program** → Transfer
     amount: 170250000

💰 **SOL Balance Changes:**
  Account 0: -1.000005 SOL
```

### what_is_this_address

Classifies any Solana address — identifies its type and provides contextual details.

```
> what_is_this_address({ address: "11111111111111111111111111111111" })

🏛️ **System Program**

  • **Address:** `11111111111111111111111111111111`
  • **Type:** known-program
  • **Description:** Core Solana runtime program for creating accounts and transferring SOL

💡 _This is a program (smart contract). Use 'lookup_term' to learn more about Solana programs._
```

```
> what_is_this_address({ address: "FhVdXkREhnMFw6FwKiBbsRPJv2BFbRmxj88JA2ND2G8R" })

👛 **Wallet Account**

  • **Address:** `FhVd...2G8R`
  • **Type:** wallet
  • **Balance:** 12.50 SOL

💡 _Try 'get_wallet_balance' for SOL balance or 'get_token_balance' for token holdings._
```

### simulate_swap

Simulates a token swap via Jupiter without executing. Shows expected output, price impact, and route.

```
> simulate_swap({ inputToken: "SOL", outputToken: "USDC", amount: 10 })

🔄 **Swap Simulation** (read-only, no execution)

  • **Input:** 10 SOL
  • **Output:** ~1,702.50 USDC
  • **Minimum received:** 1,694.00 USDC
  • **Rate:** 1 SOL = 170.25 USDC
  • **Price impact:** 0.0042%
  • **Slippage:** 0.50%

🗺️ **Route** (2 steps):
  80% → Raydium AMM
  20% → Orca Whirlpool

⚠️ _This is a simulation only. No tokens were swapped. Prices may change._
```

```
> simulate_swap({ inputToken: "BONK", outputToken: "SOL", amount: 1000000, slippageBps: 100 })

🔄 **Swap Simulation** (read-only, no execution)

  • **Input:** 1,000,000 BONK
  • **Output:** ~0.1471 SOL
  • **Minimum received:** 0.1456 SOL
  • **Rate:** 1 BONK = 0.000000147 SOL
  • **Price impact:** 0.0183%
  • **Slippage:** 1.00%

🗺️ **Route** (1 step):
  100% → Raydium AMM
```

## Resources

Resources are data accessible by URI.

### Static resources (16 total)

| URI | What it returns |
|-----|-----------------|
| `solana-glossary://glossary/full` | All 1001 terms as JSON |
| `solana-glossary://glossary/stats` | Term counts, category breakdown, relationship density |
| `solana-glossary://category/{name}` | All terms in a category (one resource per category, 14 total) |

### Resource templates (3 total)

Templates support autocompletion in MCP clients.

| Template | Description |
|----------|-------------|
| `solana-glossary://term/{termId}` | Look up any term by ID. Autocompletes all 1001 IDs. |
| `solana-glossary://{locale}/term/{termId}` | Localized term lookup. Autocompletes languages and IDs. |
| `solana-glossary://{locale}/category/{category}` | Localized category listing. Autocompletes languages and categories. |

## Prompts

### solana-context

Takes a topic or category name and generates a system prompt with up to 30 relevant definitions. Grounds any LLM conversation in accurate Solana terminology.

```
> Prompt: solana-context({ topic: "defi" })

→ Produces a system prompt like:
"You are a Solana expert. Use the following glossary definitions as reference:
- AMM: A smart contract that provides liquidity by using mathematical formulas...
- Liquidity Pool: A collection of funds locked in a smart contract...
- Yield Farming: The practice of depositing tokens into DeFi protocols...
[...up to 30 terms]"
```

### explain-solana-code

Paste Solana code and automatically get definitions for every Solana-specific term found in it.

```
> Prompt: explain-solana-code({
    code: `
      const [pda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), mint.toBuffer()],
        programId
      );
      const tx = new Transaction().add(
        createTransferInstruction(source, pda, owner, amount)
      );
    `
  })

→ Detects: PDA, bump seed, PublicKey, program ID, seeds, Transaction, transfer
→ Returns code + definitions for all detected terms
```

### solana-quiz

Generates interactive multiple-choice quizzes from glossary definitions.

```
> Prompt: solana-quiz({ category: "core-protocol", count: "3" })

# 🧠 Solana Knowledge Quiz

**3 questions** — Category: core-protocol

## Question 1

> A cryptographic clock mechanism that provides a verifiable ordering of events...

A) Tower BFT
B) Proof of History (PoH)
C) Leader Schedule
D) Slot

<details><summary>Answer</summary>
✅ **B) Proof of History (PoH)** [core-protocol]
</details>
```

## The Graph Engine

Implemented in `src/graph.ts`. This is the core differentiator from the raw SDK.

### How it works

At startup, the engine iterates over all 1001 terms and their `related` arrays. For each reference, it creates edges in both directions, building a `Map<string, Set<string>>`.

```
pda -> [seeds, bump-seed, cpi]
seeds -> [pda]      // reverse edge added automatically
bump-seed -> [pda]  // reverse edge added automatically
```

### Operations

| Function | Algorithm | What it does |
|----------|-----------|--------------|
| `findLearningPath()` | BFS | Shortest path between two terms |
| `explainConcept()` | DFS with depth limit | Explore related concepts from a root |
| `getGraphStats()` | Full iteration | Node count, edge count, average degree |
| `getHubTerms()` | Sort by degree | Most connected terms in the glossary |

## Search Engines

### Fuzzy Search (`src/utils/fuzzy.ts`)

Zero-dependency implementation combining two string similarity algorithms:

- **Levenshtein distance**: counts minimum single-character edits (insertions, deletions, substitutions) to transform one string into another. Good for typos.
- **Dice coefficient**: compares bigram (2-character substring) overlap between strings. Good for partial matches and word reordering.

The final score is a weighted average: `0.4 * levenshtein_normalized + 0.6 * dice`. Terms, aliases, and IDs are all searched.

### Semantic Search (`src/services/embeddings.ts`)

Zero-dependency TF-IDF (Term Frequency-Inverse Document Frequency) implementation:

1. At startup, builds a document corpus from all 1001 term definitions
2. Tokenizes, removes stopwords, and computes TF-IDF vectors
3. At query time, vectorizes the query and computes cosine similarity against all documents
4. Returns results ranked by relevance score

No external NLP libraries, embedding APIs, or vector databases required.

## Known Programs

The server maintains a registry of 24 well-known Solana programs in `src/data/known-programs.ts`. These are used by `explain_transaction` and `what_is_this_address` to identify programs by name.

Categories covered: System, SPL Token (v1 + Token-2022), Associated Token, Memo, Compute Budget, Metaplex, Jupiter, Raydium, Orca, Marinade, Jito, Pyth, Serum/OpenBook, Tensor, Magic Eden, Stake, Vote, BPF Loader, and more.

## i18n

The glossary SDK ships with translation files for Portuguese and Spanish, each covering all 1001 terms.

The `i18n-resolver.ts` module loads each translation file once, indexes entries by term ID in a Map, and caches the result. All subsequent lookups are O(1).

If a term has no translation, the English version is returned. No errors, no special handling needed.

Every glossary tool, resource, and prompt accepts a `locale` parameter. The language propagates through the entire chain automatically.

## Setup

Requirements: Node.js 20+, npm.

```bash
git clone https://github.com/lamericano/Solana-Glossary-MCP-Server.git
cd Solana-Glossary-MCP-Server
npm install
npm run build
```

### Environment Variables

All services work with defaults (no configuration required), but can be overridden:

| Variable | Default | Description |
|----------|---------|-------------|
| `SOLANA_RPC_URL` | Helius mainnet | Solana RPC endpoint |
| `JUPITER_API_KEY` | Included | Jupiter API key |
| `REQUEST_TIMEOUT_MS` | `10000` | HTTP request timeout |

### Commands

| Command | What it does |
|---------|--------------|
| `npm run build` | Compile TypeScript with tsup |
| `npm run dev` | Start with auto-reload (tsx) |
| `npm start` | Start the compiled server |
| `npm test` | Run all 108 tests |
| `npm run lint` | TypeScript type checking |
| `npm run inspector` | Open MCP Inspector for visual debugging |

## Connecting to MCP Clients

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "node",
      "args": ["/absolute/path/to/Solana-Glossary-MCP-Server/dist/server.js"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "node",
      "args": ["/absolute/path/to/Solana-Glossary-MCP-Server/dist/server.js"]
    }
  }
}
```

### Any MCP client

The server uses stdio transport. Point any MCP client to:

```bash
node /path/to/dist/server.js
```

### Visual debugging

```bash
npm run inspector
```

Opens a web UI where you can test all tools, resources, and prompts interactively.

## Tests

108 tests covering all components. Framework: Vitest.

| Area | What's tested |
|------|---------------|
| Glossary tools (9) | Valid input, error handling, i18n, edge cases, fuzzy fallback |
| Solana live tools (7) | Real RPC calls, address validation, error handling |
| Fuzzy search engine | Levenshtein, Dice coefficient, combined scoring, search |
| TF-IDF semantic search | Index building, cosine similarity, relevance ranking |
| Graph engine | BFS, DFS, stats, hub detection |
| i18n resolver | Locale validation, caching, fallback |
| Resources | All URI patterns, localized variants |
| Known programs | Program identification, registry completeness |
| Glossary index | Enrichment data, tags, code examples |
| Jupiter service | Token resolution, case sensitivity |
| Solana RPC service | Address validation |
| Format utilities | SOL/USD formatting, address shortening, timestamps |
| SDK integration | Term count, category count, schema validation |

```bash
npm test
```

## Project Structure

```
Solana-Glossary-MCP-Server/
  src/
    server.ts                  # MCP server — 16 tools, resources, prompts
    graph.ts                   # BFS/DFS graph engine
    i18n-resolver.ts           # Locale resolution with caching
    utils/
      config.ts                # RPC + Jupiter config + health check
      format.ts                # SOL/USD formatters, address shortener
      fuzzy.ts                 # Levenshtein + Dice coefficient engine
    services/
      solana-rpc.ts            # @solana/web3.js wrapper
      jupiter.ts               # Jupiter Lite API (prices, swap quotes)
      embeddings.ts            # TF-IDF semantic search engine
    data/
      known-programs.ts        # 24 known Solana program IDs
      glossary-index.ts        # Code examples + tag system
    tools/
      lookup.ts                # lookup_term (enhanced with examples)
      search.ts                # search_glossary
      category.ts              # list_category
      explain.ts               # explain_concept (DFS)
      learning-path.ts         # get_learning_path (BFS)
      compare.ts               # compare_terms
      random.ts                # random_term
      glossary/
        suggest.ts             # suggest_terms (fuzzy)
        semantic-search.ts     # semantic_search (TF-IDF)
      solana/
        wallet.ts              # get_wallet_balance
        tokens.ts              # get_token_balance + get_token_price
        transactions.ts        # get_recent_transactions + explain_transaction
        address-info.ts        # what_is_this_address
        swap.ts                # simulate_swap
    resources/
      index.ts                 # URI-based resource handlers
  tests/
    server.test.ts             # 108 tests
  package.json
  tsconfig.json
  tsup.config.ts
  vitest.config.ts
  DOCUMENTATION.md
  README.md
  LICENSE
```

## Tech Stack

| Technology | Role |
|------------|------|
| TypeScript | Primary language |
| @modelcontextprotocol/sdk | Official MCP SDK (v1.12+) |
| @stbr/solana-glossary | Glossary data layer (1001 terms) |
| @solana/web3.js | Solana blockchain interaction |
| Jupiter Lite API | Token prices and swap simulation |
| Zod | Tool input validation |
| tsup | Bundler (ESM) |
| Vitest | Test framework (108 tests) |
| Node.js 20+ | Runtime |

## License

MIT. See [LICENSE](LICENSE).

Built by [Lamericano](https://github.com/lamericano) for the [Superteam Brazil](https://twitter.com/SuperteamBR) Solana Glossary Bounty.
