# Kuka — Solana Glossary AI Teaching Companion

A Claude Code plugin that turns the Solana Glossary into an intelligent, persistent teaching companion. Named after Pedro Marafiotti ([@kukasolana](https://x.com/kukasolana)), Superteam Brasil Lead.

## Video Demo

[![Kuka Demo](https://img.youtube.com/vi/Y-PWPEL4MYY/maxresdefault.jpg)](https://www.youtube.com/watch?v=Y-PWPEL4MYY)

## What Kuka Does

- **Term Lookup** — Resolve any of the 1,001 glossary terms by ID, alias, or natural language search
- **Knowledge Graph** — Walk cross-reference relationships to reveal how Solana concepts connect
- **Learning Paths** — Progressive learning sequences across 14 categories, with beginner/intermediate/advanced templates
- **Quiz Mode** — Adaptive quizzes with code challenges, scenario-based questions, and score tracking
- **Context Injection** — Token-optimized glossary blocks for LLM system prompts (save tokens!)
- **Concept Deep Dive** — Full teaching lessons: definition, TradFi analogy, mechanism, code example, exercise
- **Code Walkthrough** — Break down Solana code step-by-step, mapping every concept to glossary terms
- **Ecosystem Explorer** — Research protocols, SDKs, and tools with comparisons and confidence levels
- **Term Proposal** — Automatically propose new glossary terms discovered through conversations (data expansion!)
- **Persistent Memory** — Kuka remembers your skill level, progress, and what you're building
- **Headless Mode** — Autonomous context preparation, daily term briefings, and progress reports
- **i18n** — Speaks English, Portuguese, and Spanish natively

## Install

### Option 1: Clone and Use (Recommended)

```bash
# Clone the glossary repo (includes all 1,001 terms + Kuka)
git clone https://github.com/solanabr/solana-glossary.git
cd solana-glossary

# Symlink the skill into Claude Code
ln -s $(pwd)/apps/kuka-agent/skills/kuka .claude/skills/kuka

# Start Claude Code
claude
```

### Option 2: Add to Any Project

```bash
# Clone the glossary repo
git clone https://github.com/solanabr/solana-glossary.git

# Copy skill + glossary data to your project
cp -r solana-glossary/apps/kuka-agent/skills/kuka your-project/.claude/skills/kuka
cp -r solana-glossary/data your-project/data
```

### Option 3: Claude Code Plugin

```bash
# From inside Claude Code:
/plugin marketplace add solanabr/solana-glossary
/plugin install kuka-glossary@solanabr-solana-glossary
/reload-plugins
```

**Glossary data:** Kuka needs the glossary data files to work. It searches in this order:
1. `data/terms/*.json` in your project root — if inside the solana-glossary repo
2. `node_modules/@stbr/solana-glossary/data/terms/*.json` — if SDK installed via npm
3. Plugin cache directory — if installed as Claude Code plugin

## Usage

### Interactive Mode

Start Claude Code and invoke Kuka:

```
/kuka
```

Or ask directly:

```
Talk to Kuka
What is Proof of History?
Explain PDAs to me
```

### First Run

On first use, Kuka will ask you:
1. Your name
2. Your Solana experience level (beginner / intermediate / advanced)
3. What you're building
4. Preferred language (English, Portuguese, or Spanish)

This creates persistent memory at `.kuka/memory/` so Kuka remembers you across sessions.

### Capabilities

| Command | What It Does |
|---------|-------------|
| Look up a term | "What is a PDA?" — resolves by ID, alias, or search |
| Explore connections | "How does PoH connect to slots?" — walks the knowledge graph |
| Start a learning path | "Teach me DeFi" — progressive path through 135 DeFi terms |
| Deep dive | "Explain PDAs deeply" — full lesson with analogy, code, and exercise |
| Code walkthrough | "Explain this program" — step-by-step breakdown mapped to glossary |
| Explore ecosystem | "Compare Anchor vs Pinocchio" — research with confidence levels |
| Take a quiz | "Quiz me on security" — code challenges, scenario questions, scored |
| Generate context | "Give me context for my AMM project" — token-optimized LLM block |
| Save memory | "Save" — explicitly persist current session to memory |

### Headless Mode (Autonomous)

Run Kuka without interaction for automated context preparation:

```bash
# Default: scan code, prepare glossary briefing
claude --skill kuka --headless

# Daily term of the day
claude --skill kuka --headless:daily-term

# Learning progress report
claude --skill kuka --headless:progress
```

## Glossary Coverage

| Category | Terms | Topics |
|----------|-------|--------|
| core-protocol | 86 | Consensus, PoH, validators, slots, epochs |
| defi | 135 | AMMs, liquidity pools, lending protocols |
| solana-ecosystem | 138 | Projects, protocols, and tooling |
| blockchain-general | 84 | Shared blockchain concepts |
| web3 | 80 | Wallets, dApps, signing, key management |
| programming-model | 69 | Accounts, instructions, programs, PDAs |
| dev-tools | 64 | Anchor, Solana CLI, explorers, testing |
| token-ecosystem | 59 | SPL tokens, Token-2022, metadata, NFTs |
| network | 58 | Mainnet, devnet, testnet, cluster config |
| ai-ml | 55 | AI agents, inference on-chain, model integration |
| security | 48 | Attack vectors, audit practices, reentrancy |
| programming-fundamentals | 47 | Data structures, serialization, Borsh |
| infrastructure | 44 | RPC, validators, staking, snapshots |
| zk-compression | 34 | ZK proofs, compressed accounts, Light Protocol |

**Total: 1,001 terms across 14 categories**

## How It Works

Kuka loads the glossary data from `data/terms/*.json` (14 category files) and i18n translations from `data/i18n/{locale}.json`. It builds a knowledge graph from the `related` cross-references in each term, enabling deep concept traversal.

### Memory System

Kuka stores persistent memory at `.kuka/memory/`:

```
.kuka/memory/
├── index.md          # Profile, active project, recent explorations
├── access-boundaries.md  # Read/write permissions
├── progress.md       # Terms explored, quiz scores, learning streaks
├── patterns.md       # Your preferences (explanation depth, quiz style)
└── chronology.md     # Session timeline and milestones
```

Memory is automatically updated during interactions and can be explicitly saved with the Save Memory capability.

### Token Efficiency

The Context Injection capability produces formatted glossary blocks optimized for LLM consumption. Instead of re-explaining Solana concepts every session, inject a context block:

```
# Example: inject DeFi context (saves ~2,000 tokens per session)
"Generate a context block for DeFi development"

# Output: compact, structured text ready for system prompts
```

### Term Proposals (Data Expansion)

Kuka automatically detects glossary gaps during conversations and proposes new terms:

```
You: "What are Jito bundles?"
Kuka: teaches the concept, then...
  → Detects "jito-bundles" is not in the glossary
  → Generates a structured term proposal (JSON, matching glossary schema)
  → Validates via script (schema, duplicates, related terms)
  → Saves to .kuka/proposals/jito-bundles.json

You: "Show my pending proposals"
Kuka: lists all proposals with validation status

You: "Apply proposals locally"
Kuka: injects into your glossary copy (instant, you benefit right away)

You: "Submit proposals as PR"
Kuka: opens a PR to solanabr/solana-glossary via gh CLI
```

Every conversation makes the glossary better. The data expands through teaching.

## Scripts

Two TypeScript scripts power the deterministic operations:

| Script | Purpose |
|--------|---------|
| `scripts/glossary-coverage.ts` | Match topics/code against 1,001 terms, cross-reference with developer progress, identify knowledge gaps |
| `scripts/validate-term-proposal.ts` | Validate proposed new terms against glossary JSON schema and existing data |
| `scripts/submit-proposals.ts` | Inject validated proposals into glossary files and optionally open a PR via gh CLI |

Both import directly from the `@stbr/solana-glossary` SDK — zero extra dependencies.

```bash
# Find glossary gaps for a topic
npx tsx apps/kuka-agent/skills/kuka/scripts/glossary-coverage.ts \
  --topic "compressed tokens with light protocol" \
  --progress .kuka/memory/progress.md

# Validate a term proposal
npx tsx apps/kuka-agent/skills/kuka/scripts/validate-term-proposal.ts \
  --proposal .kuka/proposals/jito-bundles.json

# Dry run — see what would change
npx tsx apps/kuka-agent/skills/kuka/scripts/submit-proposals.ts \
  --proposals-dir .kuka/proposals --dry-run

# Apply locally — inject into your glossary copy
npx tsx apps/kuka-agent/skills/kuka/scripts/submit-proposals.ts \
  --proposals-dir .kuka/proposals --apply

# Apply and open a PR to the community glossary
npx tsx apps/kuka-agent/skills/kuka/scripts/submit-proposals.ts \
  --proposals-dir .kuka/proposals --pr --pr-repo solanabr/solana-glossary
```

## Tech Stack

- **Runtime:** Pure markdown skill — zero npm dependencies for the agent
- **Scripts:** TypeScript, importing from the project's own SDK
- **Data:** `@stbr/solana-glossary` SDK data files (1,001 terms, JSON)
- **i18n:** Glossary's own translation layer (Portuguese, Spanish)
- **Memory:** File-based persistent sidecar (`.kuka/memory/`)
- **Proposals:** Term expansion staging area (`.kuka/proposals/`)
- **Platform:** Claude Code plugin system

## Contributing

Issues and PRs welcome! Tag [@kauenet](https://github.com/kauenet) for questions.

## License

MIT — see [LICENSE](../../LICENSE) for details.

## Author

**Fabio Martinelli** ([@androidado](https://x.com/androidado)) — Founder at [ZuPY](https://zupy.com), building Z$ Social Loyalty on Solana.

- GitHub: [zupy-fmartinelli](https://github.com/zupy-fmartinelli)
- Twitter: [@androidado](https://x.com/androidado)

---

Built with care for the Solana developer community.
Inspired by Pedro "Kuka" Marafiotti — [@kukasolana](https://x.com/kukasolana) — Superteam Brasil Lead.
