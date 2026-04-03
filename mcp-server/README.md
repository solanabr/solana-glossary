# Solana Glossary MCP Server

> Give your AI assistant deep knowledge of the entire Solana ecosystem — 1001 terms, 14 categories, trilingüal (en/pt-BR/es).

Built on the [Model Context Protocol](https://modelcontextprotocol.io) by Superteam Brazil.

---

## What it does

The **Solana Glossary MCP Server** exposes the complete [`@stbr/solana-glossary`](https://github.com/solanabr/solana-glossary) dataset as a set of AI-callable tools. Once installed, Claude (or any MCP-compatible agent) can:

- Instantly look up any of the 1001 Solana terms by name, alias, or natural language query
- Browse all 14 topic categories (DeFi, ZK Compression, Programming Model, etc.)
- Explore the knowledge graph of related concepts
- Get definitions in English, Portuguese (pt-BR), or Spanish

**No hallucinations about Solana terminology** — every definition comes straight from the canonical glossary.

---

## Tools

| Tool | Description |
|------|-------------|
| `search_terms` | Full-text search across names, definitions, and aliases |
| `get_term` | Exact lookup by ID (e.g. `proof-of-history`) or alias (e.g. `PoH`) |
| `get_by_category` | All terms in a category — with pagination |
| `get_related` | Related term graph traversal (depth 1 or 2) |
| `list_categories` | All 14 categories with term counts |
| `explain_concept` | Rich contextual explanation — definition + relations + category context |

All tools support `locale: "en" | "pt" | "es"` for multilingual output.

---

## Installation

### Option A — npx (no install required)

```bash
npx @sjonassa/solana-glossary-mcp
```

### Option B — global install

```bash
npm install -g @sjonassa/solana-glossary-mcp
solana-glossary-mcp
```

### Option C — from source

```bash
git clone https://github.com/solanabr/solana-glossary
cd solana-glossary/mcp-server
npm install
npm run build
node dist/index.js
```

---

## Configure Claude Desktop

Open your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the server:

```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "npx",
      "args": ["-y", "@sjonassa/solana-glossary-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "solana-glossary-mcp"
    }
  }
}
```

Restart Claude Desktop. You'll see a 🔌 icon indicating the MCP server is connected.

---

## Configure Cursor / VS Code (Cline / Continue)

Add to your MCP config (`.cursor/mcp.json` or equivalent):

```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "npx",
      "args": ["-y", "@sjonassa/solana-glossary-mcp"]
    }
  }
}
```

---

## Usage Examples

Once connected, ask Claude (or your agent) naturally:

### Basic lookup
> "What is Proof of History?"

The agent calls `get_term("proof-of-history")` and returns the full canonical definition.

### Search
> "What Solana terms relate to account storage?"

Calls `search_terms("account storage", limit: 10)`.

### Category exploration
> "Show me all ZK Compression terms"

Calls `get_by_category("zk-compression")` — returns all 34 terms.

### Knowledge graph
> "What concepts are related to PDAs?"

Calls `get_related("program-derived-address", depth: 2)`.

### Multilingual
> "Explica o que é um validator em português"

Calls `explain_concept("validator", locale: "pt")` — full explanation in pt-BR.

### Learning flow
> "I'm new to Solana DeFi, give me an overview"

Agent calls `list_categories()` → `get_by_category("defi")` → `explain_concept(...)` for key terms.

---

## The 14 Categories

| Slug | Label | Terms |
|------|-------|-------|
| `core-protocol` | Protocolo Central | 86 |
| `programming-model` | Modelo de Programação | 69 |
| `token-ecosystem` | Ecossistema de Tokens | 59 |
| `defi` | DeFi | 135 |
| `zk-compression` | ZK Compression | 34 |
| `infrastructure` | Infraestrutura | 44 |
| `security` | Segurança | 48 |
| `dev-tools` | Ferramentas de Dev | 64 |
| `network` | Rede | 58 |
| `blockchain-general` | Blockchain Geral | 84 |
| `web3` | Web3 | 80 |
| `programming-fundamentals` | Fundamentos de Programação | 47 |
| `ai-ml` | IA / ML | 55 |
| `solana-ecosystem` | Ecossistema Solana | 138 |

---

## Why MCP?

The Model Context Protocol is the emerging standard for connecting AI assistants to real data sources. By packaging the Solana Glossary as an MCP server:

1. **Any MCP client** (Claude, Cursor, Cline, Continue, custom agents) gets instant access
2. **No context window pollution** — tools are called on demand, not stuffed into the prompt
3. **Always accurate** — responses come from the canonical glossary, not LLM memory
4. **Composable** — combine with other MCP servers (Solana RPC, wallet tools, etc.)

---

## Development

```bash
npm run dev     # Run with tsx (hot reload)
npm run build   # Compile TypeScript → dist/
npm start       # Run compiled server
```

### Testing manually

```bash
# List all tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# Call search_terms
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_terms","arguments":{"query":"AMM","limit":5}}}' | node dist/index.js
```

---

## License

MIT — Superteam Brazil
