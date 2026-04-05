# atlas-context

A CLI and SDK module that turns free-form text or code into structured Solana glossary context, ready to inject into any LLM prompt.

```bash
npx tsx src/cli/atlas-context.ts "how does a PDA work in Anchor" --optimize
```

Output:

```
You are a Solana developer assistant.

Use the following glossary context:

Program Derived Address (PDA): An account address derived deterministically from a
program ID and a set of seeds, with no corresponding private key...
Program: Executable code deployed on-chain, equivalent to a smart contract...

Instructions:
- Be precise and technical
- Focus on Solana-specific concepts
- Do not explain terms that are already defined above

Request:
how does a PDA work in Anchor
```

## How it works

```
input → detectTerms → rankTerms → expandTerms (optional) → buildContext → optimizePrompt (optional)
```

Detection matches against `term` and `aliases` with normalization, so "PoH", "proof of history", and "Proof of History (PoH)" all resolve to the same term.

Ranking scores each match: exact hit (+5), alias match (+3), frequency of occurrence, position in input, category priority (`core-protocol` and `programming-model` get +2), and connectivity — terms with more than 5 related entries get +1.

Expansion does a depth-1 traversal of the `related` graph, capped at 12 total terms, original matches first.

## Modules

| File | Purpose |
|------|---------|
| `detectTerms.ts` | Matches terms and aliases against input using normalization and token matching |
| `rankTerms.ts` | Deterministic scoring, no mutation of original data |
| `expandTerms.ts` | Related-graph expansion, cycle-safe, capped |
| `buildContext.ts` | Three output modes: `concise`, `expanded`, `structured` |
| `optimizePrompt.ts` | Wraps context and input into a ready-to-use LLM prompt |
| `index.ts` | `injectGlossaryContext` — single function for the full pipeline |

## CLI usage

```bash
# Default (concise) — one line per term
npx tsx src/cli/atlas-context.ts "how does rent exemption work"

# Expanded — definition + related term IDs
npx tsx src/cli/atlas-context.ts "explain validator voting" --mode=expanded

# Structured — JSON output
npx tsx src/cli/atlas-context.ts "what is an account in Solana" --mode=structured

# Pull in connected terms via the related graph
npx tsx src/cli/atlas-context.ts "how does staking work" --expand

# Full optimized LLM prompt
npx tsx src/cli/atlas-context.ts "difference between a program and a smart contract" --optimize

# Localized context
npx tsx src/cli/atlas-context.ts "como funciona um PDA" --lang=pt --mode=expanded
```

## SDK usage

```ts
import { injectGlossaryContext } from "@stbr/solana-glossary";

const prompt = injectGlossaryContext("explain rent exemption with PDAs", {
  mode: "expanded",
  expand: true,
  optimize: true,
});

// Or use individual pipeline steps
import { detectTerms, rankTerms, buildContext } from "@stbr/solana-glossary";

const detected = detectTerms("how does Tower BFT reach consensus");
const ranked = rankTerms("how does Tower BFT reach consensus", detected);
const context = buildContext(ranked, "structured");
```

## How it reads the data

Uses `allTerms` from the existing SDK index and `getLocalizedTerms` from `src/i18n.ts`. No hardcoded definitions, no copied data, no extra dependencies.
