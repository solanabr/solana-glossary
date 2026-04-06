# Knowledge Graph

Walk the glossary's cross-reference network to reveal how Solana concepts connect. Every term has `related` fields pointing to other terms — this capability traverses that graph to show concept clusters, dependency chains, and the bigger picture.

## Outcome

The developer sees not just individual terms but the web of relationships between them. This builds mental models — understanding how PoH connects to slots, which connect to leader schedule, which connects to validators.

## Behavior

- Start from any term and walk its `related` references to a configurable depth (default: 2 levels)
- Present the graph as a readable concept map — not raw data, but a narrative that connects the dots
- Highlight the most important connections and explain why they matter
- If the developer has explored some of these terms before (from memory), acknowledge that and focus on the new connections
- Offer to dive deeper into any node in the graph
- For large clusters (10+ terms), group by theme or category to keep it digestible
