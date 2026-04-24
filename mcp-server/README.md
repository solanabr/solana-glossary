# Solana Glossary MCP Server

An MCP (Model Context Protocol) server that gives AI assistants (Claude, GPT, etc.) instant access to 1,001 Solana ecosystem terms with search, cross-references, quizzes, and i18n support (pt-BR, es).

## Quick Start

### With Claude Code / Claude Desktop

Add to your MCP config (`.claude/mcp.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "node",
      "args": ["/path/to/solana-glossary/mcp-server/dist/index.js"]
    }
  }
}
```

### Standalone

```bash
cd mcp-server
npm install
npm run build
npm start
```

## Tools (8)

| Tool | Description |
|------|-------------|
| **lookup** | Get a term by ID or alias (`pda`, `PoH`, `amm`) |
| **search** | Full-text search across names, definitions, and aliases |
| **browse** | List all terms in a category |
| **categories** | Show all 14 categories with term counts |
| **related** | Traverse the knowledge graph (cross-references, depth 1-3) |
| **quiz** | Generate multiple-choice quiz questions |
| **stats** | Glossary statistics (coverage, languages, links) |
| **explain** | Deep explanation with related terms + reverse references |

All tools support an optional `locale` parameter (`pt` for Portuguese, `es` for Spanish).

## Examples

Ask your AI assistant:

- "What is Proof of History?" → uses `lookup`
- "Search for all DeFi terms about lending" → uses `search`
- "Show me all security-related Solana terms" → uses `browse`
- "Explain PDAs and everything related to them" → uses `explain`
- "Quiz me on Solana core protocol" → uses `quiz`
- "Explain o que e um validador em portugues" → uses `lookup` with `locale: "pt"`

## Architecture

```
mcp-server/
├── src/
│   └── index.ts          # MCP server with 8 tools + 1 resource
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

The server reads term data directly from `../data/terms/*.json` and i18n from `../data/i18n/*.json`, requiring no SDK build step.

## i18n Support

Pass `locale: "pt"` or `locale: "es"` to any tool. Terms with translations show localized names and definitions; untranslated terms fall back to English.

## License

MIT
