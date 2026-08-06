# Solana Glossary

You have access to a comprehensive Solana glossary with 1,059 terms across 14 categories, with depth ratings (1-5) and 16 cross-cutting tags. Use these tools to ground your Solana knowledge.

## When to use

- **User mentions an unfamiliar Solana term** → `lookup_term` with the term name or abbreviation
- **Explaining Solana code** → `inject_context` with relevant term IDs to ground your explanation
- **Onboarding a new developer** → `filter_by_depth` with depth 1-2 (surface/shallow terms)
- **Debugging an error** → `search_glossary` for the error concept, then `get_related` to explore context
- **Comparing concepts** → `lookup_term` each concept, or `get_related` to see how they connect
- **Understanding a category** → `browse_category` to see all terms in that domain
- **Finding ecosystem terms** → `filter_by_tag` (e.g., "token-2022", "jito", "vulnerability")

## Tool reference

| Tool | Use when |
|------|----------|
| `lookup_term` | You need the definition of a specific term |
| `search_glossary` | You're not sure of the exact term ID |
| `browse_category` | You want to see all terms in a domain |
| `filter_by_depth` | You want terms at a specific knowledge level |
| `filter_by_tag` | You want terms sharing a cross-cutting concern |
| `get_related` | You want to explore connections between concepts |
| `inject_context` | You need to add glossary context to your response |
| `glossary_stats` | You need metadata about the glossary |
| `list_categories` | You need to know available categories |
| `list_tags` | You need to know available tags |

## Depth levels

| Depth | Audience | Example |
|-------|----------|---------|
| 1 | Anyone in crypto | wallet, NFT, SOL |
| 2 | Solana beginners | validator, RPC, SPL token |
| 3 | Intermediate devs | Anchor, Turbine, CPI |
| 4 | Advanced devs | PoH internals, BPF, PDAs |
| 5 | Core / researchers | syscalls, ZK compression internals |

## Tags

`token-2022`, `metaplex`, `nft`, `jito`, `jupiter`, `security`, `vulnerability`, `dev`, `lst`, `oracle`, `mobile`, `validator`, `depin`, `simd`, `zk`, `deprecated`

## Localization

All tools accept an optional `locale` parameter (`"pt"` for Portuguese, `"es"` for Spanish). Definitions and term names are fully translated.

## Guidelines

- Prefer `lookup_term` over `search_glossary` when you know the exact term
- Use `inject_context` with compact format to save tokens in system prompts
- When exploring a topic, start with `get_related` at depth 1, increase if needed
- Don't dump entire categories — use depth or tag filters to narrow results
