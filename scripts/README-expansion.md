# Glossary Data Expansion Script

Automatically identifies missing Solana terms from official docs and generates new glossary entries using Claude AI.

## How it works

1. Fetches content from Solana docs, Anchor book, and other sources
2. Loads all existing 1001 terms to avoid duplicates
3. Asks Claude to identify new terms not yet in the glossary
4. Generates entries in the correct format with `id`, `term`, `definition`, `category`, `aliases`, `related`
5. Saves candidates to `data/terms/expansion-candidates.json` for review

## Usage
```bash
export ANTHROPIC_API_KEY=your_key_here
node scripts/expand-glossary.mjs
```

## Output

Generates `data/terms/expansion-candidates.json` with new term candidates ready for review and merging into the appropriate category files.

## Sources

- Solana Docs (docs.solana.com)
- Anchor Book
- Solana Foundation GitHub

## Adding new sources

Add entries to the `SOURCES` array in `expand-glossary.mjs`:
```js
{
  name: "Source Name",
  url: "https://raw.githubusercontent.com/...",
  category: "target-category",
}
```
