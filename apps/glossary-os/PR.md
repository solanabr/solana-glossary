# PR #35 — Agent Mode For Glossary Copilot

## Suggested Title

`feat(copilot): add Agent Mode workflow to Glossary OS`

## Suggested Base Branch

- base: `feat/glossary-copilot-tests`
- compare: `feat/glossary-agent-mode`

## Summary

This PR adds **Agent Mode** to the existing Glossary Copilot workspace inside `apps/glossary-os`.

Instead of asking one question at a time, the user can now describe a Solana build goal and run a visible multi-step workflow inside the product:

1. plan the work
2. generate starter code
3. explain the generated code
4. run deterministic issue checks
5. suggest the next glossary concepts to learn

This closes the gap between "grounded Copilot" and "workflow system" without inventing a new backend surface.

## What This PR Adds

- `src/lib/copilot/agent-mode.ts`
  - orchestrates `plan -> generate -> explain -> debug -> learn`
  - reuses the existing `/api/copilot` endpoint
- `src/lib/copilot/agent-issues.ts`
  - deterministic issue detection for the debug step
- `src/components/agent-mode.tsx`
  - UI for step-by-step execution and consolidated output
- `src/components/copilot-hub.tsx`
  - mode switch between standard Copilot and Agent Mode
- `src/app/[locale]/copilot/page.tsx`
  - deep-link support for `view`, `goal`, and `autorun`
- screenshot capture and docs updates for the new flow

## Why This Matters

The earlier Copilot work already supported grounded answers and action-style prompts. What was missing was a single product surface that made those capabilities feel like one system.

Agent Mode provides that missing layer:

`describe what you want to build -> get a plan, starter code, explanation, issue checks, and next terms`

It is intentionally pragmatic:

- uses the current grounded Copilot backend
- keeps the orchestration visible in the UI
- avoids fake complexity or overclaiming "full autonomy"

## Screenshots

### Copilot Workspace

![Glossary Copilot Workspace](./screenshots/glossary-os-copilot-workspace.png)

### Agent Mode

![Glossary Copilot Agent Mode](./screenshots/glossary-os-copilot-agent.png)

## Validation

```bash
npm run typecheck:web
npm run build --workspace @stbr/glossary-os
```

If the local test suite from PR #33 is present on the branch:

```bash
npm run test --workspace @stbr/glossary-os
```
