# Kuka MCP Server — Solana Glossary for Any AI Tool

An MCP (Model Context Protocol) server that exposes the Solana Glossary as 7 tools — usable from Claude, GPT, Cursor, Windsurf, or any MCP-compatible AI tool.

**1,001 terms | 14 categories | Knowledge graph | Quizzes | Context injection | i18n (pt/es/en)**

## Install

```bash
cd apps/kuka-mcp
npm install
npm run build
```

## Configure

### Claude Code

Add to your project's `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "kuka-glossary": {
      "command": "node",
      "args": ["apps/kuka-mcp/dist/server.js"],
      "cwd": "<path-to-solana-glossary>"
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kuka-glossary": {
      "command": "node",
      "args": ["<path-to-solana-glossary>/apps/kuka-mcp/dist/server.js"]
    }
  }
}
```

### Development

```bash
npm run dev
```

## Tools

### `glossary_lookup`

Look up a term by ID or alias.

```
glossary_lookup({ term: "PoH" })
glossary_lookup({ term: "proof-of-history", locale: "pt" })
```

### `glossary_search`

Full-text search across all 1,001 terms.

```
glossary_search({ query: "liquidity pool" })
glossary_search({ query: "AMM", locale: "es" })
```

### `glossary_category`

List all terms in a category.

```
glossary_category({ category: "defi" })
glossary_category({ category: "list" })  // lists all 14 categories
```

### `glossary_related`

Walk the cross-reference knowledge graph.

```
glossary_related({ term: "proof-of-history", depth: 3 })
```

Returns the root term plus all connected terms up to N levels deep, revealing how Solana concepts interconnect.

### `glossary_quiz`

Generate quiz questions for learning.

```
glossary_quiz({ category: "security", count: 10, locale: "pt" })
```

### `glossary_context`

Token-optimized context block for LLM system prompts.

```
glossary_context({ category: "defi" })
glossary_context({ terms: ["pda", "cpi", "account-model"] })
```

Returns a formatted block with term count and estimated token usage — perfect for injecting into system prompts to save tokens.

### `glossary_explain`

Teaching-ready explanation with full related context.

```
glossary_explain({ term: "pda", locale: "pt" })
```

Returns the term definition plus all related terms with their definitions — one call for complete understanding.

## i18n

All tools accept a `locale` parameter: `"en"` (default), `"pt"` (Portuguese), `"es"` (Spanish).

Translations come from `data/i18n/{locale}.json`. Terms without translations fall back to English.

## What Makes This Different

| Feature | Basic MCP Servers | Kuka MCP |
|---------|------------------|----------|
| Term lookup | Yes | Yes + alias resolution + i18n |
| Search | Yes | Yes + truncated previews |
| Categories | Yes | Yes + list command |
| **Knowledge graph** | No | **Cross-reference traversal up to 4 levels** |
| **Quiz generation** | No | **Random quiz from any category, i18n** |
| **Context injection** | No | **Token-optimized blocks with estimates** |
| **Teaching mode** | No | **Full explain with all related terms** |

## Author

**Fabio Martinelli** ([@androidado](https://x.com/androidado)) — Founder at [ZuPY](https://zupy.com), building Z$ Social Loyalty on Solana.

## License

MIT
