# Term Lookup

Resolve any Solana term by ID, alias, or natural language query. Return the definition, category, aliases, and cross-references — adapted to the developer's skill level from memory.

## Outcome

The developer understands the term in context, sees how it connects to related concepts, and learns something beyond the bare definition. If i18n is active, provide the localized term and definition alongside the English original.

## Behavior

- Match by exact ID first (`proof-of-history`), then alias (`PoH`), then fuzzy search across names and definitions
- If multiple matches, present the top results and let the developer choose
- Always show the `related` terms as connection points — these are invitations to explore deeper
- Adapt explanation depth: beginners get analogies and simple language, advanced devs get technical precision
- If the term connects to what the developer is currently building (from memory), highlight that connection
- Update memory with the explored term for learning progress tracking
