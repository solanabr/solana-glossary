# Lightweight RAG Pipeline

This repo includes a local, file-based RAG pipeline to turn glossary terms into compact context packs for LLMs.

## What it does

- Reads `data/terms/*.json` (+ locale overrides from `data/i18n/pt.json` and `data/i18n/es.json`)
- Builds short chunks per term (`en`, `pt-BR`, `es`)
- Generates embeddings for chunks
- Stores local index at `.rag/index.json`
- Retrieves top-k chunks for a query using:
  - semantic similarity (cosine)
  - simple lexical rerank
  - small related-term boost

## Setup

1. Export your embedding API key:

```bash
export OPENAI_API_KEY="your_key_here"
```

2. Install dependencies:

```bash
npm install
```

## Build index

```bash
npm run rag:build
```

Optional flags:

- `--model text-embedding-3-small` (default)
- `--batch 64` (default)

Example:

```bash
npm run rag:build -- --model text-embedding-3-small --batch 96
```

## Query index

```bash
npm run rag:query -- "how do PDAs and CPIs relate?"
```

Optional flags:

- `--lang en|pt-BR|es`
- `--k 8` (default top-k)
- `--max-chars 1800` (default context cap)
- `--json` (machine-readable output)
- `--index .rag/index.json` (custom index path)

Examples:

```bash
npm run rag:query -- "o que e fine tuning?" --lang pt-BR --k 6 --max-chars 1400
npm run rag:query -- "what is compressed nft?" --lang en --json
```

## Output

- Human mode: Markdown context block ready to paste into prompts
- JSON mode: includes hits, scores, and context string for tool integration

## Notes

- `.rag/` is gitignored by default (index can be regenerated).
- This is intentionally simple and local-first (no vector DB required).
