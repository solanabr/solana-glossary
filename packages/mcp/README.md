# solana-glossary-mcp

An MCP (Model Context Protocol) server that gives AI assistants instant access to the **[Solana Glossary](https://github.com/solanabr/solana-glossary)** — 1001 terms, 14 categories, cross-references, and i18n support (pt-BR + es).

Stop burning tokens re-explaining Solana concepts. Just plug this server in and your AI knows the whole ecosystem.

---

## Demo

https://github.com/solanabr/solana-glossary/assets/demo.gif

> Example: asking Claude "what is a PDA and what's related to it?" — the MCP server resolves `get_term("pda")` + `get_related_terms("pda")` in milliseconds, no hallucination.

---

## Tools

| Tool | Description |
|------|-------------|
| `get_term` | Look up any term by ID or alias (`"PoH"`, `"pda"`, `"proof-of-history"`) |
| `search_terms` | Full-text search across all 1001 terms |
| `get_terms_by_category` | Get all terms in a category (e.g. `"defi"`, `"core-protocol"`) |
| `list_categories` | List all 14 categories with counts and descriptions |
| `get_related_terms` | Follow cross-references from a term (depth 1 or 2) |
| `get_context_for_llm` | Generate a compact glossary context block for LLM system prompts |
| `glossary_stats` | Stats: total terms, category breakdown, available locales |

All tools support a `locale` parameter: `"en"` (default), `"pt"` (Portuguese), `"es"` (Spanish).

---

## Quick Start

### 1. Clone and build

```bash
git clone https://github.com/solanabr/solana-glossary
cd solana-glossary/packages/mcp  # or wherever this lives
npm install
npm run build
```

### 2. Add to Claude Desktop

Edit your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "solana-glossary": {
      "command": "node",
      "args": ["/absolute/path/to/solana-glossary-mcp/dist/index.js"]
    }
  }
}
```

**Config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### 3. Add to Cursor

In Cursor settings → MCP → Add server:

```json
{
  "solana-glossary": {
    "command": "node",
    "args": ["/absolute/path/to/dist/index.js"]
  }
}
```

### 4. Use via npx (no install)

```bash
npx @stbr/solana-glossary-mcp
```

---

## Example Interactions

**Look up a term:**
```
User: What is Proof of History?
→ MCP calls get_term("proof-of-history")
→ Returns full definition, category, related terms
```

**Search:**
```
User: Explain account model on Solana
→ MCP calls search_terms("account model")
→ Returns top 5 matching terms
```

**Build LLM context:**
```typescript
// In your AI app:
// Call get_context_for_llm({ category: "defi" })
// Inject the result into your system prompt
// Your model now understands all 135 DeFi terms without wasting tokens
```

**Explore a topic:**
```
User: What's related to PDAs?
→ MCP calls get_related_terms("pda", depth: 2)
→ Returns cross-reference graph
```

**Portuguese support:**
```
User: O que é um validador?
→ MCP calls get_term("validator", locale: "pt")
→ Returns definition in Portuguese
```

---

## Why This Matters

- **No hallucination** on Solana-specific terms — the model gets ground truth from the glossary
- **Token savings** — feed 50 terms as context instead of describing each one in your prompt
- **i18n** — works in English, Portuguese, and Spanish out of the box
- **1001 terms** across 14 categories: from core protocol to DeFi, ZK compression, AI/ML integration, and the full Solana ecosystem

---

## SDK Used

Built on top of [`@stbr/solana-glossary`](https://www.npmjs.com/package/@stbr/solana-glossary):

```typescript
import { getTerm, searchTerms, getTermsByCategory, getLocalizedTerms } from "@stbr/solana-glossary";
```

---

## Contributing

Open issues or PRs at [github.com/solanabr/solana-glossary](https://github.com/solanabr/solana-glossary).

---

## License

MIT — Built with ❤️ for [Superteam Brazil](https://twitter.com/SuperteamBR)
