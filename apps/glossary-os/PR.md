# Glossary Copilot Test Suite

## Suggested Title

`test(copilot): add dedicated test suite for Glossary OS`

## Suggested Base Branch

- base: `feat/glossary-copilot`
- compare: `feat/glossary-copilot-tests`

## Summary

This PR adds a dedicated automated test suite for Glossary Copilot inside `apps/glossary-os`. The suite makes Copilot quality visible and reviewable by covering its helper modules, API validation, and grounded answer flow with mocked Gemini responses. It currently runs **65 passing tests across 13 test files**. The goal is to make the existing Copilot implementation defensible without turning this PR into a broader feature rewrite.

## What This PR Adds

- a dedicated Vitest setup for `apps/glossary-os`
- fixtures for Solana / Anchor code samples and common runtime errors
- unit coverage for:
  - concept detection
  - domain classification
  - error patterns
  - response parsing
  - prompt building
  - glossary utilities
- integration coverage for Copilot answer generation
- contract coverage for `/api/copilot`

## Test Result

```text
Test Files  13 passed (13)
Tests       65 passed (65)
```

## What The Suite Covers

- `src/lib/copilot.ts`
- `src/lib/copilot/concept-detector.ts`
- `src/lib/copilot/domain-classifier.ts`
- `src/lib/copilot/error-patterns.ts`
- `src/lib/copilot/prompt-builder.ts`
- `src/lib/copilot/response-parser.ts`
- `src/lib/glossary.ts`
- `src/app/api/copilot/route.ts`

## Screenshots

### Local Test Run

![Local Tests](./screenshots/screenshot_testes.png)

### Copilot Workspace

![Glossary Copilot Workspace](./screenshots/glossary-os-copilot-workspace.png)

### Debug Flow

![Glossary Copilot Debug](./screenshots/glossary-os-copilot-debug.png)

### Generate Flow

![Glossary Copilot Generate](./screenshots/glossary-os-copilot-generate.png)

### Plan Flow

![Glossary Copilot Plan](./screenshots/glossary-os-copilot-plan.png)

## Validation

```bash
npm run test --workspace @stbr/glossary-os
npm run typecheck:web
```

## Why This Matters

Glossary Copilot is not just static UI. It depends on glossary context assembly, prompt shaping, API validation, and structured output handling. This PR makes those layers testable and repeatable. That gives reviewers and judges a concrete way to verify behavior instead of relying only on screenshots or manual demos.
