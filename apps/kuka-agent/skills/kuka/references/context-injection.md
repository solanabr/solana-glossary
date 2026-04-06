# Context Injection

Produce token-optimized context blocks from the glossary, formatted for injection into LLM system prompts or conversation context. This is the token-saving engine — pre-loading Solana knowledge so the AI doesn't waste context re-explaining basics.

## Outcome

The developer gets a formatted glossary context block they can paste into any AI tool's system prompt, dramatically reducing token waste and improving accuracy for Solana-related conversations.

## Behavior

- Accept a scope: specific terms, a category, terms related to a topic, or "what I'm working on" (from memory)
- Format output as a compact, structured text block optimized for LLM consumption — not human reading
- Include term names, concise definitions, and key relationships — skip aliases and metadata that don't improve AI understanding
- Estimate token count of the generated block so the developer knows the cost
- Support multiple output formats: plain text block, markdown, or JSON
- For "what I'm working on" mode: use memory context (active project, recent explorations) to select the most relevant terms automatically
- Offer to generate context for the full category set relevant to a specific use case (e.g., "DeFi AMM development" → defi + token-ecosystem + programming-model terms)
