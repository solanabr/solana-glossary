# @stbr/solana-glossary-mcp

An MCP (Model Context Protocol) server that exposes the [Solana Glossary](https://github.com/solanabr/solana-glossary) as AI tools — giving Claude, Cursor, and any MCP-compatible client instant access to 1001 Solana terms without burning context tokens.

## Tools

| Tool | Description |
|---|---|
| `lookup_term` | Look up a term by ID or alias with full definition |
| `search_glossary` | Full-text search across all 1001 terms |
| `get_category` | List all terms in a category |
| `get_related_terms` | Get related terms with full definitions |
| `list_categories` | List all 14 categories with term counts |

## Setup — Claude Desktop

Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "npx",
      "args": ["-y", "@stbr/solana-glossary-mcp"]
    }
  }
}
```

Claude Desktop config location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

## Setup — Cursor

Add to your `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "npx",
      "args": ["-y", "@stbr/solana-glossary-mcp"]
    }
  }
}
```

## Example usage in Claude

Once connected, Claude can answer questions like:

- *"What is a PDA?"* → uses `lookup_term`
- *"Find all terms related to liquidity"* → uses `search_glossary`
- *"List all DeFi terms"* → uses `get_category`
- *"What concepts are related to proof-of-history?"* → uses `get_related_terms`

## Local dev
```bash
git clone https://github.com/solanabr/solana-glossary
cd solana-glossary
npm install && npm run build

cd apps/mcp
npm install ../../ --save
npm install
npm run dev
```

## Why this exists

LLMs waste tokens re-explaining Solana concepts every prompt. This MCP server lets Claude look up precise definitions on demand — no hallucinations, no wasted context, straight from the canonical glossary.

## License

MIT
