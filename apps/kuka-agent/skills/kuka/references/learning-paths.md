# Learning Paths

Generate progressive learning sequences from glossary categories. Each path takes the developer from foundational terms to advanced concepts within a domain, building understanding layer by layer.

## Outcome

The developer has a structured roadmap for mastering a Solana domain — not a random list of terms, but a pedagogically sound sequence where each concept builds on the previous ones. Paths adapt to what the developer already knows and what they're building.

## Behavior

- Build paths from any of the 14 categories (core-protocol, defi, security, zk-compression, etc.)
- Sequence terms so prerequisites come before dependent concepts — PDAs before CPIs, accounts before programs
- Use the `related` cross-references to determine natural ordering
- Adapt path length and depth to the developer's level (from memory): beginners get shorter paths with more explanation, advanced devs get comprehensive coverage
- Mark terms the developer has already explored (from memory progress) as completed
- Suggest the next path based on what they've learned and what they're building
- Each path step includes: term, why it matters at this point, and a one-line connection to the next term

## Coverage Integration

Run `./scripts/glossary-coverage.ts` when building paths to identify the developer's actual knowledge gaps and prioritize unexplored terms that are prerequisites for their goals.

## Path Templates

### Beginner — Solana Fundamentals (4-6 weeks)

```
Week 1-2: Core Concepts
  accounts → transactions → instructions → rent

Week 3-4: First Program
  program → anchor-framework → state-management → pda

Week 5-6: Building Features
  cpi → spl-token → error-handling → security-basics
```

### Intermediate — Advanced Patterns

```
Module 1: Program Architecture
  account-design-patterns → state-machine → access-control

Module 2: Cross-Program Integration
  cpi-mechanics → pda-signing → composability

Module 3: Optimization
  compute-units → zero-copy → account-compression
```

### Advanced — Specialization Tracks

```
Track A: DeFi
  amm → liquidity-pool → oracle → flash-loan → mev

Track B: ZK Compression
  zk-proofs → merkle-tree → state-tree → light-protocol → compressed-token

Track C: AI x Blockchain
  ai-agent → solana-agent-kit → autonomous-on-chain-agent → depin → gpu-compute
```

## Adaptation

- **Beginners:** Shorter paths (10-15 terms), more checkpoints, suggest deep dives at each step
- **Intermediate:** Full category paths (20-30 terms), comparison points, trade-off discussions
- **Advanced:** Cross-category paths, edge cases, suggest ecosystem exploration for cutting-edge topics

## Completion Tracking

Update memory `progress.md` as the developer completes path steps. Celebrate milestones: "Boa demais! Terminou o módulo de DeFi — teu conhecimento tá ficando sólido."
