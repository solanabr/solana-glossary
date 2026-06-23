# Solana Glossary — VS Code Extension

**1001 Solana terms at your fingertips.** Hover any term in your code to see its definition, search via Command Palette, browse by category — all without leaving your editor.

## Features

### Hover Definitions

Write Rust, TypeScript, or any Solana-related code — hover over terms like `PDA`, `CPI`, `epoch`, `rent`, `AccountInfo` to see their definition inline.

- **1001 terms** from the `@stbr/solana-glossary` SDK
- **Case-insensitive** matching including aliases (`PoH` → Proof of History)
- **camelCase/snake_case aware** — `programDerivedAddress` matches `program-derived-address`
- Works in `.rs`, `.ts`, `.js`, `.toml`, `.json`, `.md`, `.yaml`

### Command Palette Search

`Ctrl+Shift+P` → `Solana Glossary: Search Term`

Real-time fuzzy search across all 1001 terms with ranked results. See term name, category, and definition preview.

### Browse by Category

`Ctrl+Shift+P` → `Solana Glossary: Browse by Category`

Pick from 14 categories (DeFi, Core Protocol, Security, Dev Tools...) and explore all terms in that category.

### Random Term

`Ctrl+Shift+P` → `Solana Glossary: Random Term`

Discover a random Solana term — great for learning.

### i18n Support

Switch between **English**, **Português (BR)**, and **Español** in settings:

```
Settings → Solana Glossary → Language
```

### Status Bar

Shows "📖 1001 Solana terms" in the status bar — click to open search.

## Setup

### From source (for development / bounty review)

```bash
# 1. Clone and build the SDK (repo root)
cd solana-glossary
npm install
npm run build

# 2. Build the extension
cd apps/vscode
npm install
npm run build

# 3. Install in VS Code
code --install-extension . --force
# Or: open VS Code → Extensions → "..." → "Install from VSIX"
# Or: F5 to launch Extension Development Host
```

### Quick test (Extension Development Host)

```bash
cd apps/vscode
npm run build
# Press F5 in VS Code with this folder open
```

## Configuration

| Setting | Default | Description |
|---|---|---|
| `solanaGlossary.language` | `en` | Language: `en`, `pt`, `es` |
| `solanaGlossary.enableHover` | `true` | Show definitions on hover |
| `solanaGlossary.showCategory` | `true` | Show category badge in tooltip |
| `solanaGlossary.showRelated` | `true` | Show related terms in tooltip |

## How It Works

1. **Build step** (`npm run build:bundle`) reads all `data/terms/*.json` and `data/i18n/*.json` from the SDK and bundles them into a single `dist/glossary-bundle.json`
2. On activation, the extension loads this bundle into memory — O(1) lookups via alias map
3. The `HoverProvider` checks words under the cursor against the alias map (including camelCase → kebab-case conversion)
4. Commands use the same in-memory index for instant search

No network requests. No API keys. Everything is local.

## SDK Integration

Uses `@stbr/solana-glossary` data layer:
- Terms from `data/terms/*.json` (14 category files, 1001 terms)
- Translations from `data/i18n/pt.json` and `data/i18n/es.json`
- Alias map built from term IDs + aliases for O(1) lookup

## What Makes This Different

| | VS Code Extension | Browser Extension (PR #12) | MCP Servers |
|---|---|---|---|
| **Context** | Inside your code editor | Any web page | AI chat |
| **Target user** | Solana devs writing code | Anyone browsing | AI-assisted devs |
| **Activation** | Hover over code tokens | Highlights on page | Tool call |
| **Zero config** | ✅ works on install | ✅ | Needs config file |
| **Offline** | ✅ fully local | ✅ | ✅ |

## License

MIT
