# Solana Intelligence MCP Server

[![MCP](https://img.shields.io/badge/MCP-2.0-blueviolet)](https://modelcontextprotocol.io)
[![Terms](https://img.shields.io/badge/terms-1001-brightgreen)](https://github.com/solanabr/solana-glossary)
[![Tools](https://img.shields.io/badge/tools-16-blue)](./)
[![Tests](https://img.shields.io/badge/tests-108%20passing-green)](./)
[![i18n](https://img.shields.io/badge/i18n-en%20pt%20es-orange)](./)

**A comprehensive MCP server that combines 1001 Solana glossary terms with live blockchain data. 16 tools covering term lookup, fuzzy/semantic search, graph-based concept exploration, real-time wallet balances, token prices, transaction analysis, address classification, and swap simulation. Full i18n support (🇺🇸 🇧🇷 🇪🇸).**

Built on [`@stbr/solana-glossary`](https://github.com/solanabr/solana-glossary), [`@solana/web3.js`](https://github.com/solana-labs/solana-web3.js), and [Jupiter Lite API](https://lite-api.jup.ag).

---

## What's Inside

| Feature | Description |
|---------|-------------|
| **16 tools** | 9 glossary + 7 live Solana (see full list below) |
| **Fuzzy search** | Levenshtein + Dice coefficient for typo-tolerant matching |
| **Semantic search** | TF-IDF + cosine similarity for natural language queries |
| **Live blockchain** | SOL/token balances, transaction history, address classification via Helius RPC |
| **DeFi integration** | Real-time token prices and swap simulation via Jupiter |
| **Knowledge graph** | BFS/DFS traversal on 1200+ cross-references |
| **Code examples** | Practical Solana code snippets for key terms |
| **24 known programs** | System, SPL, DeFi, NFT, and infrastructure program identification |
| **i18n** | Every glossary tool supports `en`, `pt`, and `es` |

---

## Quick Start

### Install & Run

```bash
git clone https://github.com/solanabr/solana-glossary.git
cd solana-glossary/examples/mcp-server
npm install
npm run build
```

### Add to Your MCP Client

#### Claude (`claude_desktop_config.json` or `.claude/mcp.json`)

```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "node",
      "args": ["/absolute/path/to/solana-glossary/examples/mcp-server/dist/server.js"]
    }
  }
}
```

#### Antigravity (`.gemini/settings.json`)

```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "node",
      "args": ["/absolute/path/to/solana-glossary/examples/mcp-server/dist/server.js"]
    }
  }
}
```

#### Development (with auto-reload)

```bash
npm run dev
```

#### MCP Inspector (visual debugging)

```bash
npm run inspector
```

---

## All 16 Tools

### Glossary Tools (9)

| Tool | Description |
|------|-------------|
| `lookup_term` | Look up by ID, name, or alias. Includes code examples, tags, and fuzzy fallback suggestions |
| `search_glossary` | Full-text search across 1001 terms with ranked results |
| `suggest_terms` | Fuzzy suggestions for misspelled or partial queries (Levenshtein + Dice) |
| `semantic_search` | Natural language search using TF-IDF cosine similarity |
| `list_category` | Browse terms by category (14 available) |
| `explain_concept` | DFS graph traversal for deep concept exploration |
| `get_learning_path` | BFS shortest path between two concepts |
| `compare_terms` | Side-by-side comparison of 2-5 terms |
| `random_term` | Random term discovery and quiz generation |

### Solana Live Tools (7)

| Tool | Description |
|------|-------------|
| `get_wallet_balance` | SOL balance + USD conversion via Jupiter |
| `get_token_balance` | SPL token holdings with USD values |
| `get_token_price` | Real-time token price (14 known tokens + any mint address) |
| `get_recent_transactions` | Transaction history with status and timestamps |
| `explain_transaction` | Parse and decode a transaction with program identification |
| `what_is_this_address` | Classify any address (wallet, program, token mint, stake, vote) |
| `simulate_swap` | Jupiter swap simulation with route details and price impact |

---

## Tool Examples

### `lookup_term` — Enhanced with code examples

```
Input:  { term: "pda" }
```

```
📖 **Program Derived Address (PDA)**

An account address derived deterministically from a program ID...

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
```

**With i18n (`locale: "pt"`):**

```
Input:  { term: "pda", locale: "pt" }
```

```
📖 **Endereço Derivado de Programa (PDA)**

Um endereço de conta derivado deterministicamente de um ID de programa
e um conjunto de seeds, sem necessidade de uma chave privada correspondente.

🏷️ Categoria: programming-model
🌐 Idioma: Português
```

### `suggest_terms` — Fuzzy matching

```
Input:  { query: "valdator" }
```

```
💡 **Suggestions for "valdator"** (3 matches):

1. **Validator** (89% match)
   A node that validates transactions and produces blocks...

2. **Validator Client** (62% match)
   Software that runs on validator hardware...
```

### `semantic_search` — Natural language

```
Input:  { query: "how does staking work on solana?" }
```

```
🧠 **Semantic Search Results** (5 matches):

1. **Staking** [core-protocol] — 82% relevance
2. **Stake Account** [core-protocol] — 71% relevance
3. **Delegation** [core-protocol] — 65% relevance
```

### `get_wallet_balance` — Live SOL balance

```
Input:  { address: "FhVd...2G8R" }
```

```
💰 **Wallet Balance**
  • Address: FhVd...2G8R
  • SOL: 12.5000 ($2,125.00 @ $170.00/SOL)
  • Lamports: 12,500,000,000
```

### `simulate_swap` — Jupiter swap simulation

```
Input:  { inputToken: "SOL", outputToken: "USDC", amount: 1 }
```

```
🔄 **Swap Simulation** (read-only, no execution)
  • Input: 1 SOL
  • Output: ~170.25 USDC
  • Minimum received: 169.40 USDC
  • Rate: 1 SOL = 170.25 USDC
  • Price impact: 0.0012%
  • Slippage: 0.50%

🗺️ **Route** (1 step):
  100% → Raydium AMM

⚠️ This is a simulation only. No tokens were swapped.
```

---

## Architecture

```
src/
├── server.ts                  # MCP server — wires 16 tools, resources, prompts
├── graph.ts                   # BFS/DFS graph engine on term cross-references
├── i18n-resolver.ts           # Locale resolution with caching
├── utils/
│   ├── config.ts              # RPC + Jupiter API config
│   ├── format.ts              # SOL/USD formatters, address shortener
│   └── fuzzy.ts               # Levenshtein + Dice coefficient engine
├── services/
│   ├── solana-rpc.ts          # @solana/web3.js wrapper (balance, tokens, TX)
│   ├── jupiter.ts             # Jupiter Lite API (prices, swap quotes)
│   └── embeddings.ts          # TF-IDF semantic search engine
├── data/
│   ├── known-programs.ts      # 24 known Solana program IDs
│   └── glossary-index.ts      # Code examples + tag system
├── tools/
│   ├── lookup.ts              # lookup_term (enhanced)
│   ├── search.ts              # search_glossary
│   ├── category.ts            # list_category
│   ├── explain.ts             # explain_concept (DFS)
│   ├── learning-path.ts       # get_learning_path (BFS)
│   ├── compare.ts             # compare_terms
│   ├── random.ts              # random_term
│   ├── glossary/
│   │   ├── suggest.ts         # suggest_terms (fuzzy)
│   │   └── semantic-search.ts # semantic_search (TF-IDF)
│   └── solana/
│       ├── wallet.ts          # get_wallet_balance
│       ├── tokens.ts          # get_token_balance + get_token_price
│       ├── transactions.ts    # get_recent_transactions + explain_transaction
│       ├── address-info.ts    # what_is_this_address
│       └── swap.ts            # simulate_swap
└── resources/
    └── index.ts               # URI-based resource handlers
```

---

## Testing

```bash
npm test
```

108 tests covering:
- All 16 tools (valid input, error handling, i18n, edge cases)
- Fuzzy search engine (Levenshtein, Dice, combined scoring)
- TF-IDF semantic search (indexing, cosine similarity, ranking)
- Graph engine (BFS, DFS, stats, hub detection)
- i18n resolver (locale validation, caching, fallback)
- Resources (all URI patterns, localized variants)
- Format utilities, known programs, glossary index, Jupiter service, RPC service
- SDK integration (term count, category count, schema validation)

---

## Environment Variables

All services work with default values (no configuration required), but you can override:

| Variable | Default | Description |
|----------|---------|-------------|
| `SOLANA_RPC_URL` | Helius mainnet | Solana RPC endpoint |
| `JUPITER_API_KEY` | Included | Jupiter API key for authenticated endpoints |
| `REQUEST_TIMEOUT_MS` | `10000` | HTTP request timeout |

---

## Development

```bash
# Type-check
npm run lint

# Build
npm run build

# Run in dev mode (auto-reload)
npm run dev

# Visual debugging with MCP Inspector
npm run inspector

# Run tests
npm test
```

---

## Tech Stack

| Technology | Role |
|------------|------|
| TypeScript | Primary language |
| @modelcontextprotocol/sdk | Official MCP SDK (v1.12+) |
| @stbr/solana-glossary | Glossary data layer (1001 terms) |
| @solana/web3.js | Solana blockchain interaction |
| Jupiter Lite API | Token prices and swap simulation |
| Zod | Input validation |
| tsup | Bundler (ESM) |
| Vitest | Test framework (108 tests) |
| Node.js 20+ | Runtime |

---

## License

MIT. Built by [Lamericano](https://github.com/lamericano) for the [Superteam Brazil](https://twitter.com/SuperteamBR) Solana Glossary Bounty.
