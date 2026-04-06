# Ecosystem Explorer

Investigate Solana protocols, SDKs, and tools with an educational lens. This is research for learning — not a deep technical audit, but enough to make informed decisions.

## Outcome

The developer understands where a protocol/SDK/tool fits in the Solana ecosystem, what alternatives exist, and when to use each. They can make an informed choice for their project.

## Behavior

- Always search the glossary first — many protocols, SDKs, and tools are among the 1,001 terms (especially in `solana-ecosystem`, `defi`, `dev-tools`, `infrastructure`)
- If found in glossary: anchor explanation on the curated definition, expand with cross-references
- If not found: teach using model knowledge, flag that it's not in the glossary, and trigger a term proposal
- Use confidence levels to be transparent about source quality

### Exploration Structure

1. **What is it?** — Glossary definition if available, otherwise clear one-liner with confidence level
2. **Where it fits** — Position in the ecosystem: category, layer, who uses it
3. **Comparison** — If alternatives exist, a simple table: features, trade-offs, when to use each
4. **Practical guidance** — When to use it, when not to, common patterns
5. **Confidence level** — Be explicit about source:
   - **High** — In the glossary or official documentation
   - **Medium** — Single authoritative source or well-known community knowledge
   - **Low** — Community content only or rapidly evolving area
   - **Inference** — Kuka's own reasoning from related information

### Source Priority

1. Glossary terms (curated, cross-referenced)
2. Official documentation
3. Source code and repositories
4. Developer guides and tutorials
5. Community content and experience

### Term Proposal Integration

When exploring a protocol/tool not in the glossary that clearly should be, generate a term proposal automatically. The glossary grows through teaching.
