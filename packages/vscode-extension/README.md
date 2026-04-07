# Solana Glossary Copilot for VS Code

Developer actions from `Glossary OS`, directly inside VS Code.

This package turns the current glossary and Copilot stack into editor-native workflows:
- explain selected Solana or Anchor code
- debug runtime errors from the editor
- generate starter code from `// @generate:` comments
- open a learning and build planner
- search glossary terms offline with a bundled dataset

## Why This Extension Exists

Hover definitions alone are not enough.

The goal of this extension is to bring the action capabilities of `Glossary OS` into the place where Solana developers already work: the editor.

It complements glossary lookup with developer workflows:
- `Explain` for understanding unfamiliar code
- `Debug` for turning raw errors into grounded explanations
- `Generate` for bootstrapping implementation from intent
- `Plan` for turning vague goals into practical next steps

## Features

### Explain Selection

Select Rust, TypeScript, or Anchor-flavored code and run:

`Solana Glossary: Explain with Solana Glossary`

The extension:
- extracts the current selection
- detects a likely anchor glossary term
- sends the selection to the live `Glossary OS` Copilot API
- opens a side panel with explanation, mapped concepts, suggested next terms, and glossary links

### Debug Error

Run:

`Solana Glossary: Debug with Solana Glossary`

You can trigger it from:
- the command palette
- an inline code action when diagnostics exist

The extension:
- accepts an error message
- optionally includes the selected code
- adds a lightweight anchor hint from local error parsing
- returns a grounded explanation in a side panel

### Generate From Comment

Write a comment such as:

```ts
// @generate: create a PDA-backed profile account
```

Then run:

`Solana Glossary: Generate from @generate comment`

The extension:
- finds the nearest `@generate` comment
- calls the live Copilot API with a generation-focused prompt
- inserts the first fenced code block below the comment
- falls back to commented explanation text when no code block is returned

### Planner

Run:

`Solana Glossary: Open Glossary Planner`

The extension:
- asks for your goal
- asks for your current level
- sends a planning-oriented prompt to Copilot
- opens a side panel with a glossary-grounded build or learning plan

### Offline Glossary Helpers

The extension ships with a bundled glossary dataset for local editor features:
- hover definitions
- quick search
- completion items
- local term and alias detection

This means the non-AI parts still work offline.

## Current Architecture

This package is intentionally aligned to the current `Glossary OS` API contract.

Today, the web app exposes a single Copilot endpoint:

[`route.ts`](/home/paolla/repos/solana/solana-glossary/apps/glossary-os/src/app/api/copilot/route.ts)

So the extension implements `explain`, `debug`, `generate`, and `plan` as client-side action prompts over that single endpoint, instead of assuming separate backend routes that do not exist yet.

The offline glossary bundle is generated from the real glossary dataset and stored at:

[glossary-bundle.json](/home/paolla/repos/solana/solana-glossary/packages/vscode-extension/data/glossary-bundle.json)

## Package Layout

- [src/extension.ts](/home/paolla/repos/solana/solana-glossary/packages/vscode-extension/src/extension.ts): activation entry point
- [src/commands](/home/paolla/repos/solana/solana-glossary/packages/vscode-extension/src/commands): editor actions
- [src/providers](/home/paolla/repos/solana/solana-glossary/packages/vscode-extension/src/providers): hover, code actions, diagnostics, completion
- [src/panels](/home/paolla/repos/solana/solana-glossary/packages/vscode-extension/src/panels): webview results
- [src/api](/home/paolla/repos/solana/solana-glossary/packages/vscode-extension/src/api): local glossary + Glossary OS client
- [media](/home/paolla/repos/solana/solana-glossary/packages/vscode-extension/media): icon and webview styles
- [tests/unit](/home/paolla/repos/solana/solana-glossary/packages/vscode-extension/tests/unit): unit tests for local parsing and glossary helpers

## Setup

Build the extension package:

```bash
npm run build:vscode
```

Then open the repo in VS Code and launch an Extension Development Host from the `packages/vscode-extension` workspace.

If you are not using the public deployment, point the extension to your own Glossary OS instance:

`Settings` → `Solana Glossary Copilot` → `API Base URL`

Default:

```text
https://solana-glossary-two.vercel.app
```

## Commands

- `Solana Glossary: Explain with Solana Glossary`
- `Solana Glossary: Debug with Solana Glossary`
- `Solana Glossary: Generate from @generate comment`
- `Solana Glossary: Open Glossary Planner`
- `Solana Glossary: Search Solana Glossary`

## Keyboard Shortcuts

- `Cmd/Ctrl+Shift+E`: explain current selection
- `Cmd/Ctrl+Shift+G`: glossary search
- `Cmd/Ctrl+Shift+Space`: generate from `@generate`

## Local Development

Typecheck:

```bash
npm run typecheck:vscode
```

Tests:

```bash
npm run test --workspace @stbr/solana-glossary-vscode-extension
```

Build:

```bash
npm run build:vscode
```

## Validation

Validated locally:
- `npm run typecheck:vscode`
- `npm run test --workspace @stbr/solana-glossary-vscode-extension`
- `npm run build:vscode`

The current build path uses `tsc` plus asset copying so the package is buildable in this monorepo even when webpack packaging is not the fastest validation path. `webpack.config.js` is still included for later VSIX bundling.
