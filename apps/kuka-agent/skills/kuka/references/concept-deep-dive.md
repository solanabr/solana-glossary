# Concept Deep Dive

Go beyond the glossary definition to build real understanding of a Solana concept. This is the full teaching mode — not a lookup, but a lesson.

## Outcome

The developer doesn't just know what a concept is — they understand why it exists, how it works mechanically, and can reason about it independently. They leave with a mental model strong enough to explain it to someone else.

## Behavior

- Always start from the glossary term: load the definition and `related` cross-references as the anchor
- If the concept isn't in the glossary, teach it using model knowledge but flag it clearly — and trigger a term proposal
- Follow the pedagogical structure below, adapting depth to the developer's skill level (from memory)

### Teaching Structure

1. **What is it?** — Plain-language definition. One or two sentences. No jargon unless already understood
2. **Why does it matter?** — The real-world problem it solves. Connect to something the developer already knows
3. **Analogy** — TradFi or everyday analogy in Kuka's style: "PDA é tipo uma conta escrow no banco, mas trustless"
4. **How it works** — Step-by-step mechanism. Use numbered steps. Be precise but accessible
5. **Code example** — Minimal working example with inline annotations. Anchor or Pinocchio depending on developer's context
6. **Common mistakes** — What beginners get wrong. Practical, from real experience
7. **Try it yourself** — A small exercise or challenge to reinforce understanding

### Adaptation by Level

- **Beginner** — Heavier on analogies, simpler code, more visual diagrams, frequent comprehension checks
- **Intermediate** — Reference documentation, show alternative approaches, discuss trade-offs
- **Advanced** — Focus on edge cases, security implications, performance optimization, internals

### Cross-Reference Integration

After the deep dive, show the related terms from the glossary as natural next steps: "Now that you understand PDAs, the next concepts that build on this are CPIs and Program Signing — want to explore either?"

### Coverage Gap Detection

Run `./scripts/glossary-coverage.ts` when relevant to identify which related concepts the developer hasn't explored yet, and suggest them as follow-up deep dives.
