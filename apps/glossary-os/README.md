# Glossary OS: Copilot Addition

This PR adds **Glossary Copilot** to the existing Glossary OS frontend.

Glossary OS already turned the Solana Glossary into a navigable product with search, term relationships, builder paths, quizzes, mental models, and multilingual onboarding. This contribution adds an AI-native layer on top of that foundation: a glossary-grounded copilot for understanding Solana concepts inside the product itself.

## Live Demo

https://solana-glossary-two.vercel.app/en

## What This PR Adds

- `Ask AI` inside each term page
- a dedicated Copilot workspace at `/[locale]/copilot`
- glossary-grounded answers using Gemini
- structured responses with:
  - explanation
  - key concepts
  - suggested next terms
- optional `Explain this code` flow for Anchor / Solana snippets
- clickable glossary mentions in Copilot answers
- localized Copilot UI for `en`, `pt`, and `es`

## Why This Matters

This is not a generic chatbot bolted onto the site.

The Copilot uses the glossary dataset as structured context, so the answer is built from:

- the current term
- aliases
- related concepts
- commonly confused terms
- next-step terms
- builder paths
- mental models
- concept graph branches

That makes the Copilot useful for real Solana learning and developer workflows:

- explain a concept in plain language
- connect it to adjacent concepts
- clarify common confusions
- suggest what to study next
- explain Anchor or Solana code using glossary vocabulary

## How It Works

The implementation follows a simple RAG-style pattern, without a vector database:

1. The user asks a question from a term page or the dedicated Copilot page.
2. The server builds glossary context dynamically for the selected term.
3. That context is injected into a prompt sent to Gemini.
4. Gemini returns structured JSON.
5. The UI renders the answer with linked glossary terms and next-step navigation.

This keeps the feature grounded in the existing glossary instead of turning it into a free-form chat UI.

## Existing Glossary OS Foundation

The Copilot was added on top of an existing frontend that already provides:

- instant search across glossary terms
- term pages with relationships and contextual navigation
- builder paths for `Runtime`, `Anchor`, `DeFi`, and `Agents`
- mental models and concept graph exploration
- quizzes and onboarding flows
- multilingual support for `en`, `pt`, `es`
- dark and light mode
- `Copy context for AI`

## Copilot Entry Points

- `/en/term/[slug]` -> inline Copilot panel for the current term
- `/pt/term/[slug]` -> inline Copilot panel in Portuguese UI
- `/es/term/[slug]` -> inline Copilot panel in Spanish UI
- `/en/copilot` -> full-page Copilot workspace
- `/pt/copilot` -> full-page Copilot workspace
- `/es/copilot` -> full-page Copilot workspace

## Screenshots

### Copilot Workspace
![Glossary OS Copilot workspace](./screenshots/glossary-os-copilot-workspace.png)

### Copilot Inline on Term Page
![Glossary OS Copilot inline](./screenshots/glossary-os-copilot-inline.png)

### Landing
![Glossary OS landing](./screenshots/glossary-os-home.png)

### Explore
![Glossary OS explore](./screenshots/glossary-os-explore.png)

### Term Page
![Glossary OS term page](./screenshots/glossary-os-term-pda.png)

### Builder Paths
![Glossary OS builder paths](./screenshots/glossary-os-paths.png)

### Builder Path Detail
![Glossary OS builder path detail](./screenshots/glossary-os-path-anchor.png)

## Local Setup

From the repository root:

```bash
npm install
npm run dev:web
```

Then open:

- `http://localhost:3000/en`
- `http://localhost:3000/pt`
- `http://localhost:3000/es`

## Gemini Setup

Create `apps/glossary-os/.env.local`:

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_MODEL` is optional. The Copilot defaults to `gemini-2.5-flash`.

Important:

- the key must be in `apps/glossary-os/.env.local`.

## Validation

```bash
npm run validate
npm run typecheck:web
npm run build --workspace @stbr/glossary-os
```

