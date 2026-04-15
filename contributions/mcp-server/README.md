# Solana Glossary MCP Server

An MCP (Model Context Protocol) server that exposes the **1001 Solana Glossary terms** to AI assistants via **Streamable HTTP transport** — the only MCP server in this bounty using HTTP instead of STDIO.

**Live Endpoint:** `https://solana-glossary-production-5f40.up.railway.app/mcp`

## Why Streamable HTTP?

Every other glossary MCP server uses STDIO transport, requiring local installation and process management. Our server uses **Streamable HTTP**, which means:

- **No local install required** — connect from any MCP client via a URL
- **Web-accessible** — works with cloud-hosted AI tools
- **Stateless** — each request is self-contained, no session management
- **Deploy anywhere** — Railway, Docker, any Node.js host

## 6 Tools

| Tool | Description |
|------|-------------|
| `lookup_term` | Look up a term by ID or alias (e.g., "PDA", "proof-of-history"). Supports `en`, `pt`, `es` locales. |
| `search_terms` | Full-text search across names, definitions, IDs, and aliases. Configurable limit. |
| `get_category_terms` | Get all terms in one of 14 categories (e.g., "defi", "core-protocol"). |
| `get_related_terms` | BFS traversal of the knowledge graph at depth 1-3 with cycle detection. |
| `explain_concept` | Rich explanation with the term's definition + all related terms expanded inline. |
| `glossary_stats` | Total terms, category breakdown, relationship edges, available locales. |

## Setup

```bash
# From repository root
cd contributions/mcp-server

# Install dependencies
npm install

# Build
npm run build

# Start server
npm start
# → MCP endpoint: POST http://localhost:3000/mcp
# → Health check: GET http://localhost:3000/health
```

## Connect to Claude Desktop

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "solana-glossary": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Or connect to the live deployed endpoint:

```json
{
  "mcpServers": {
    "solana-glossary": {
      "url": "https://solana-glossary-production-5f40.up.railway.app/mcp"
    }
  }
}
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/mcp` | MCP Streamable HTTP endpoint |
| GET | `/health` | Health check with term count |
| GET | `/` | Server info and tool listing |

## Example: MCP Initialize

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": { "name": "test", "version": "1.0" }
    }
  }'
```

## Example: Look Up a Term

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "lookup_term",
      "arguments": { "id": "pda", "locale": "pt" }
    }
  }'
```

## Deploy with Docker

```bash
npm run build
docker build -t solana-glossary-mcp .
docker run -p 3000:3000 solana-glossary-mcp
```

## Architecture

```
src/
  index.ts          # Express + MCP Server + all 6 tools
  lib/
    glossary.ts     # Data loader, lookup maps, BFS traversal
    types.ts        # GlossaryTerm, Category types
data/
  terms/*.json      # 14 category files, 1001 terms
  i18n/pt.json      # Portuguese translations
  i18n/es.json      # Spanish translations
```

## Tech Stack

- **MCP SDK**: `@modelcontextprotocol/sdk` with StreamableHTTPServerTransport
- **HTTP**: Express
- **Validation**: Zod schemas for all tool inputs
- **i18n**: Full pt-BR and es support across all tools

## License

MIT
