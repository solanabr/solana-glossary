# Contributing to Solana Glossary

Thanks for helping expand the Solana knowledge base! Here's how to contribute.

## Adding a New Term

1. Find the right category file under `packages/glossary/data/terms/<category>.json`
2. Add your term object:

```json
{
  "id": "your-term-id",
  "term": "Your Term Name",
  "definition": "A clear, factual, 1-3 sentence definition.",
  "category": "<category>",
  "depth": 3,
  "related": ["existing-term-1", "existing-term-2"],
  "aliases": ["Abbreviation"]
}
```

### ID Conventions
- URL-safe, kebab-case: `proof-of-history`, `tower-bft`
- Unique across the entire dataset
- Descriptive and lowercase

### Rules
- `definition` must be plain text (no Markdown/HTML)
- Keep definitions factual and concise (1-3 sentences)
- `depth` is required, integer 1-5 (1=surface, 2=shallow, 3=deep, 4=abyss, 5=bottom — see README for details)
- `related` must reference existing term IDs
- Only include `aliases` if the term has common abbreviations
- Do not include empty arrays for optional fields — omit them instead

## Adding a Translation

1. Create or edit `packages/glossary/data/i18n/<locale>.json` (e.g., `pt.json`, `es.json`)
2. Add entries keyed by term ID:

```json
{
  "proof-of-history": {
    "term": "Prova de História (PoH)",
    "definition": "Um mecanismo de relógio criptográfico que..."
  }
}
```

Only `term` and `definition` can be translated. Other fields (`id`, `category`, `related`, `aliases`) stay in English.

## Validation

Before submitting a PR:

```bash
npm test        # Run test suite
npm run build   # Verify build
npm run lint    # Type check
npm run validate # Check for duplicates and dangling refs
```

## PR Requirements

- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] No duplicate IDs
- [ ] No dangling related references
- [ ] All terms have a valid depth (1-5)
- [ ] Definitions are plain text, factual, 1-3 sentences

## Categories

| Category | File |
|----------|------|
| core-protocol | `packages/glossary/data/terms/core-protocol.json` |
| programming-model | `packages/glossary/data/terms/programming-model.json` |
| token-ecosystem | `packages/glossary/data/terms/token-ecosystem.json` |
| defi | `packages/glossary/data/terms/defi.json` |
| zk-compression | `packages/glossary/data/terms/zk-compression.json` |
| infrastructure | `packages/glossary/data/terms/infrastructure.json` |
| security | `packages/glossary/data/terms/security.json` |
| dev-tools | `packages/glossary/data/terms/dev-tools.json` |
| network | `packages/glossary/data/terms/network.json` |
| blockchain-general | `packages/glossary/data/terms/blockchain-general.json` |
| web3 | `packages/glossary/data/terms/web3.json` |
| programming-fundamentals | `packages/glossary/data/terms/programming-fundamentals.json` |
| ai-ml | `packages/glossary/data/terms/ai-ml.json` |
| solana-ecosystem | `packages/glossary/data/terms/solana-ecosystem.json` |
