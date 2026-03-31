# Solana Glossary Bounty

## The OG Glossary is Back

The Solana Glossary accompanied us devs for years — a real reference that actually helped you understand what was going on. Then it got quietly replaced by a generic "Terminology" page. Flat. Boring. Forgettable. No glow to the ssary.

We're bringing it back. Expanded to 1000+ terms, structured as an SDK, ready for the new scale of consumer-app Solana and the agentic economy.

## Overview

We've built the data layer: **1000+ terms**, cross-referenced, categorized, with i18n support (pt-BR + es). It's packaged as an npm package (hopefully released after your contribution) and available at:

**Repository: [github.com/solanabr/solana-glossary](https://github.com/solanabr/solana-glossary)**

Now we need **you** to build something cool on top of it. And useful.

Some ideas to get you started (but don't let us limit you):

- A frontend for the glossary — searchable, browsable, beautiful. Something we can actually host and point people to
- Agentic tooling — MCP servers, RAG pipelines, Claude/GPT tools that use the glossary as context
- Data expansion — automate adding more terms, keep definitions fresh, pull from Solana docs/repos
- Developer integrations — VS Code extensions, CLI tools, Anchor template generators with inline glossary context
- Educational tools — interactive quizzes, learning paths, onboarding flows for new Solana devs

**The bar**: it has to look great and work great. Otherwise you could just go read the boring Terminology page.

Be creative. Surprise us. Turn a boring list of terms into something useful for all kinds of Solana devs & aspiring builders.

## Rewards

| Place | Prize |
|-------|-------|
| 🥇 1st | $1,500 USDG |
| 🥈 2nd | $1,000 USDG |
| 🥉 3rd | $800 USDG |

**Total Prize Pool: $3,300 USDG**

Rankings are based on total contribution value across all submitted PRs — quality, creativity, and usefulness all factor in.

## Judging Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| Usefulness & Impact | 30% | Does it solve a real problem? Would Solana devs actually use this? |
| Quality & Polish | 25% | Does it work well? Clean code, good UX, no rough edges |
| Creativity | 20% | Novel approach, surprising use of the data, something we didn't expect |
| SDK Integration | 15% | Proper use of the `@stbr/solana-glossary` SDK or data layer |
| Documentation | 10% | Clear README, setup instructions, demo (video or screenshots) |

**Bonus factors** (can elevate your ranking):

- Multiple high-quality submissions across different categories
- i18n support (pt-BR, es) in your project
- Live deployed demo
- Deep dive writeup or video walkthrough of your implementation

## Rules

**✅ Allowed**

- AI-assisted development (must be reviewed, tested, and production-quality)
- Multiple submissions (separate PRs for distinct contributions)
- Teams submitting under a single account
- Building on any framework/language as long as it uses the glossary SDK or data

**❌ Not Allowed**

- Submissions that don't use `@stbr/solana-glossary` or its data (`data/terms/*.json`)
- Low-effort wrappers with no real value added
- Breaking or modifying the core glossary data without a PR to the glossary repo itself
- Closed-source submissions

## Submission Requirements

Submit through Superteam Earn with:

- **PR Link(s)** — One PR per distinct contribution to [github.com/solanabr/solana-glossary](https://github.com/solanabr/solana-glossary)
- PR should include setup instructions and/or a short demo (video or screenshots)
- **Twitter Post** — Share your submission and tag @SuperteamBR and @SuperteamEarn
- **Brief Summary** — 3-5 sentences explaining your approach and what makes it useful

Your final ranking will be the sum of all your contributions.

## Getting Started

```bash
npm install @stbr/solana-glossary
```

```typescript
import { getTerm, searchTerms, allTerms } from '@stbr/solana-glossary'

// 1001 terms at your fingertips
const pda = getTerm('pda')
const results = searchTerms('proof of history')
console.log(`${allTerms.length} terms ready to go`)
```

Check the [README](https://github.com/solanabr/solana-glossary#readme) for the full API reference.

## Timeline

- **Submission Deadline**: 10 days from listing
- **Review Period**: 7 days after deadline
- **Winner Announcement**: Within 10 days after deadline

## Terms & Conditions

- All submissions must be original work
- Code must be open-source (MIT license preferred)
- Winning submissions may be featured and extended by Superteam Brazil
- By submitting, you agree to potential follow-up collaboration
- Judges' decisions are final

## Questions?

- **GitHub**: Open an issue on the [repo](https://github.com/solanabr/solana-glossary), tag @kauenet
- **Discord**: [discord.gg/superteambrasil](https://discord.gg/superteambrasil)
- **Twitter**: [@SuperteamBR](https://twitter.com/SuperteamBR) / [@kauenet](https://twitter.com/kauenet)

**Skills**: TypeScript, Frontend/Backend, AI/LLM tooling, Data Engineering, UX Design

**Eligibility**: Brazil
