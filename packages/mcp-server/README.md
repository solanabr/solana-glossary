# Solana Glossary Actions MCP Server

Composable MCP workflow server built on top of the official Solana Glossary dataset.

This package is not just a glossary lookup server. It turns glossary knowledge into agent-consumable development workflows:

- explain Solana / Anchor code
- debug runtime and constraint failures
- generate starter implementations
- plan learning or build work
- compose those steps through `glossary_build_feature`

It also exposes lightweight read surfaces for agents:

- `glossary://term/{termId}?locale={locale}`
- `glossary://context/{termIds}?locale={locale}&maxRelated={n}`

The implementation is grounded in the real glossary shape in this repository. It uses deterministic concept detection, domain classification, and error pattern matching before invoking Gemini for structured reasoning.

## Why This Package Exists

Most glossary MCP servers stop at:

- search
- lookup
- related terms

This server goes one layer higher:

- **primitive tools** for deterministic glossary access
- **workflow tools** for code explanation, debugging, generation, and planning
- **a composed tool** for end-to-end feature-building workflows
- **resource-like endpoints** for reusable context reads
- **evaluation hooks** for lightweight output validation

## Tool Layers

### `glossary_search`
Search terms by id, title, alias, or definition.

### `glossary_related`
Return the related concepts for a term or alias.

### `glossary_multi_context`
Build a concise multi-term context bundle for downstream prompts or agents.

### `glossary_explain_code`
Explain Solana / Anchor / Rust code step by step using glossary-grounded context.

### `glossary_debug_error`
Diagnose errors, explain root cause, and suggest a fix grounded in glossary concepts.

### `glossary_generate_code`
Generate starter code from a natural-language request with concept mapping and notes.

### `glossary_plan_learning`
Turn a build goal into a structured concept roadmap and implementation plan.

### `glossary_build_feature`
Compose plan → context → generate → explain into a single workflow tool for feature building.

## Structured Tool Metadata

`tools/list` now returns richer metadata for every tool:

- `kind`
- `purpose`
- `whenToUse`
- `outputs`
- `constraints`
- `nextTools`
- `deterministicSignals`

This improves agent-side tool selection and makes chaining more explicit without changing the tool call shape.

## Resource-Like Endpoints

This package still treats the workflow layer as tools, but now also exposes read-only glossary resources through the MCP catalog.

Available resources:

- `glossary://term/{termId}?locale={locale}`
  - read a single term as JSON
- `glossary://context/{termIds}?locale={locale}&maxRelated={n}`
  - read a prompt-ready multi-term context bundle as JSON

These are intentionally lightweight and do not add caching, session state, or full resource orchestration yet.

## Evaluation Hooks

Workflow tools append a lightweight `evaluation` block to the result.

These checks validate simple quality signals such as:

- does the result contain glossary concepts
- does it include steps or plan structure
- does it suggest next terms or next steps
- does the composed workflow include all expected stages

This is intentionally simple runtime QA, not a benchmark framework.

## Environment

Create a local env file in this package:

```bash
cp packages/mcp-server/.env.example packages/mcp-server/.env.local
```

Add:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_MODEL` is optional. If omitted, the package falls back to `gemini-2.5-flash`.

## Build And Typecheck

From the repository root:

```bash
npm run typecheck:mcp
npm run build:mcp
```

This compiles the package to:

- [`packages/mcp-server/dist`](/home/paolla/repos/solana/solana-glossary/packages/mcp-server/dist)

## Start The Server

From the repository root:

```bash
npm run start:mcp
```

Or directly from the package:

```bash
cd packages/mcp-server
node dist/index.js
```

The server runs over `stdio`.

## How To Test Locally

There are two useful levels of testing.

### 1. Smoke Test The MCP Protocol

This verifies:

- the server starts
- `initialize` works
- `tools/list` works
- the base tools respond

Run from `packages/mcp-server`:

```bash
msg='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
printf 'Content-Length: %s\r\n\r\n%s' "$(printf '%s' "$msg" | wc -c)" "$msg" | node dist/index.js
```

You should get a JSON-RPC response with:

- `protocolVersion`
- `serverInfo`
- `capabilities.tools`

List tools:

```bash
msg='{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
printf 'Content-Length: %s\r\n\r\n%s' "$(printf '%s' "$msg" | wc -c)" "$msg" | node dist/index.js
```

List resources:

```bash
msg='{"jsonrpc":"2.0","id":21,"method":"resources/list","params":{}}'
printf 'Content-Length: %s\r\n\r\n%s' "$(printf '%s' "$msg" | wc -c)" "$msg" | node dist/index.js
```

Read a term resource:

```bash
msg='{"jsonrpc":"2.0","id":22,"method":"resources/read","params":{"uri":"glossary://term/pda?locale=en"}}'
printf 'Content-Length: %s\r\n\r\n%s' "$(printf '%s' "$msg" | wc -c)" "$msg" | node dist/index.js
```

Read a context resource:

```bash
msg='{"jsonrpc":"2.0","id":23,"method":"resources/read","params":{"uri":"glossary://context/pda,signer?locale=en&maxRelated=4"}}'
printf 'Content-Length: %s\r\n\r\n%s' "$(printf '%s' "$msg" | wc -c)" "$msg" | node dist/index.js
```

Search for a term:

```bash
msg='{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"glossary_search","arguments":{"query":"pda","locale":"en","limit":2}}}'
printf 'Content-Length: %s\r\n\r\n%s' "$(printf '%s' "$msg" | wc -c)" "$msg" | node dist/index.js
```

Get related terms:

```bash
msg='{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"glossary_related","arguments":{"term":"pda","locale":"en"}}}'
printf 'Content-Length: %s\r\n\r\n%s' "$(printf '%s' "$msg" | wc -c)" "$msg" | node dist/index.js
```

Build multi-term context:

```bash
msg='{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"glossary_multi_context","arguments":{"terms":["pda","signer"],"locale":"en","maxRelated":4}}}'
printf 'Content-Length: %s\r\n\r\n%s' "$(printf '%s' "$msg" | wc -c)" "$msg" | node dist/index.js
```

### 2. Test The Gemini-Backed Workflow Tools

These require `GEMINI_API_KEY` to be available in the shell that starts the server.

Because the server reads from `process.env`, the safest way to test is:

```bash
cd packages/mcp-server
export $(grep -v '^#' .env.local | xargs)
node dist/index.js
```

Then, from another terminal, use a client that can speak MCP over stdio, or temporarily test by wrapping the server in a small local harness.

You can also run the packaged smoke tests directly from the repository root:

```bash
npm run smoke:actions --workspace @stbr/glossary-mcp-server
npm run smoke:catalog --workspace @stbr/glossary-mcp-server
```

`smoke:actions` covers the four workflow tools individually.

`smoke:catalog` covers:

- `resources/list`
- `resources/read`
- `glossary_build_feature`

If you want quick manual examples to send through an MCP client, use these payloads.

#### Explain Code

Arguments:

```json
{
  "code": "#[derive(Accounts)]\npub struct CreateVault<'info> {\n  #[account(init, payer = signer, seeds=[b\"vault\", signer.key().as_ref()], bump, space = 8 + 32)]\n  pub vault: Account<'info, Vault>,\n  #[account(mut)]\n  pub signer: Signer<'info>,\n  pub system_program: Program<'info, System>\n}",
  "locale": "en"
}
```

#### Debug Error

Arguments:

```json
{
  "error": "AnchorError caused by account: vault. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.",
  "code": "let (vault, bump) = Pubkey::find_program_address(&[b\"vault\", authority.key().as_ref()], program_id);",
  "locale": "en"
}
```

#### Generate Code

Arguments:

```json
{
  "request": "Create a PDA with Anchor for a user profile account",
  "locale": "en"
}
```

#### Plan Learning

Arguments:

```json
{
  "goal": "I want to build a DeFi app on Solana with swaps and liquidity pools",
  "currentLevel": "intermediate",
  "locale": "en"
}
```

#### Build Feature

Arguments:

```json
{
  "goal": "Build a Solana user profile feature with an Anchor PDA account",
  "currentLevel": "intermediate",
  "locale": "en"
}
```

## What To Expect In The Responses

### `glossary_explain_code`

Returns:

- `summary`
- `stepByStep`
- `conceptsUsed`
- `whatItDoes`
- `potentialIssues`
- `nextConcepts`

### `glossary_debug_error`

Returns:

- `problem`
- `whyItHappens`
- `involvedConcepts`
- `fix`
- `improvedCode`
- `preventionTips`

### `glossary_generate_code`

Returns:

- `code`
- `language`
- `explanation`
- `conceptsUsed`
- `implementationNotes`
- `requiredDependencies`
- `nextSteps`

### `glossary_plan_learning`

Returns:

- `goalBreakdown`
- `requiredConcepts`
- `plan`
- `implementationApproach`
- `recommendedNextTerms`
- `estimatedTotalTime`

### `glossary_build_feature`

Returns:

- `workflow`
- `plan`
- `context`
- `generation`
- `explanation`
- `suggestedNextTools`
- `evaluation`

## Current Limits

- no vector DB
- no semantic embeddings
- no streaming responses
- no session memory
- no semantic cache
- no official `@modelcontextprotocol/sdk` dependency yet

That is deliberate for this PR stage. The package stays runnable now while proving a stronger idea than “glossary lookup”: glossary-grounded workflow execution for Solana agents.
