# Bounty Delivery Hardening — Design Spec
**Date:** 2026-04-04  
**Bounty deadline:** 2026-04-06  
**Status:** Approved for implementation  
**Goal:** Maximize delivery quality and product perception in 2 days by strengthening the bot’s highest-value flows and removing “glossary wrapper” risk

---

## Problem

The core feedback is:

> "I don't know if just having a glossary on Telegram brings that much value.  
> Try to go one step further. Right now it feels like just a wrapper around the glossary."

This means the project will not win on breadth of commands alone.

For the bounty, the bot must feel like:
- something people want to add to a Telegram group
- something that helps users learn, not only search
- something that creates real value in-context and over time

The current risk is not "missing features".  
The real risk is:
- the flagship flow is not polished enough
- the onboarding is too feature-shaped instead of use-case-shaped
- the product still smells like "glossary in chat"

---

## Delivery Principle

For the next 2 days, the project should optimize for one clear story:

1. **Explain in context**
2. **Learn in paths**
3. **Practice with quiz**

Everything else should support this story.

---

## Must Ship

These items are mandatory before the bounty submission is considered complete.

### 1. Harden `/explain`

#### Why this is mandatory

`/explain` is the single best answer to the "mere wrapper" critique.

It creates a real reason to use the bot *inside Telegram*:
- in group conversations
- without leaving the chat
- with social visibility

If this flow is weak, the bot loses its strongest differentiator.

#### Requirements

- Detect localized glossary names in Portuguese and Spanish, not only English names and aliases
- Detect 4+ token phrases
- Keep false positives low
- Return up to 3 explanation cards, ordered by appearance in the message
- Work in both groups and private chats
- Respond clearly when no replied message exists
- Respond clearly when no terms are found

#### Product rule

If a user replies to a real Solana discussion with `/explicar`, the bot must feel reliable.

#### Technical design

Primary files:
- `apps/telegram-bot/src/commands/explain.ts`
- `apps/telegram-bot/src/utils/search.ts`
- `apps/telegram-bot/src/glossary/index.ts`
- `apps/telegram-bot/src/glossary/data/i18n/pt.json`
- `apps/telegram-bot/src/glossary/data/i18n/es.json`

#### Implementation notes

Add localized term matching in `findTermsInText()`:
- English term name
- English aliases
- term `id`
- Portuguese localized `term`
- Spanish localized `term`

Phrase scanning should support the longest realistic term span in the dataset, not cap at 3.

Suggested approach:
- tokenize normalized text
- generate spans from `MAX_TERM_TOKENS` down to 1
- match exact normalized phrases against indexed name/alias/localized-name variants
- deduplicate by glossary term id
- prioritize:
  1. exact primary name
  2. exact localized primary name
  3. exact alias

#### Validation

Must pass these cases:
- English: `"Proof of History"` → `proof-of-history`
- Portuguese: `"Prova de Participação"` → `proof-of-stake`
- Spanish: `"Prueba de Participación"` → `proof-of-stake`
- Long phrase: `"Byzantine Fault Tolerance"` → `byzantine-fault-tolerance`

---

### 2. Make enrichment non-blocking

#### Why this is mandatory

The bot used to be a fast, local glossary surface.

After adding RPC and CoinGecko enrichment, the product now depends on third-party networks for many core card flows:
- `/glossary`
- `/random`
- `/termofday`
- `/explain`
- path steps
- quiz result cards

If these become slow, the product becomes less trustworthy.

#### Requirements

- Base term card must always render fast
- Enrichment must never stall the whole response
- External failures must degrade silently
- Timeouts must be strict and low

#### Technical design

Primary files:
- `apps/telegram-bot/src/utils/term-card.ts`
- `apps/telegram-bot/src/utils/solana-rpc.ts`
- `apps/telegram-bot/src/utils/coingecko.ts`

#### Implementation notes

Add timeout wrappers around all network fetches.

Suggested timeout targets:
- RPC: `1500ms`
- CoinGecko: `1500ms`
- total enrichment budget per card: `2000ms max`

Preferred behavior:
- build base glossary card synchronously
- race enrichment helpers with timeout
- append lines only if they resolve within budget
- otherwise send base card only

#### Product rule

No user should ever think:
"The glossary bot is hanging because CoinGecko is slow."

---

### 3. Rework onboarding around 3 hero actions

#### Why this is mandatory

The current bot has many commands, but the product cannot present itself as a list of features.

It must present itself as a set of high-value actions.

#### Hero actions

1. `/explain` — use in a live conversation
2. `/path` — learn with guided steps
3. `/quiz` — practice and retain

#### Requirements

These hero actions must be the first thing users see in:
- `/start`
- help
- group welcome

The copy should emphasize *what users do*, not *what the bot has*.

#### Technical design

Primary files:
- `apps/telegram-bot/src/commands/start.ts`
- `apps/telegram-bot/src/commands/help.ts`
- `apps/telegram-bot/src/handlers/group.ts`
- `apps/telegram-bot/src/i18n/locales/en.ftl`
- `apps/telegram-bot/src/i18n/locales/pt.ftl`
- `apps/telegram-bot/src/i18n/locales/es.ftl`

#### Content direction

Bad:
- search
- categories
- favorites
- history

Better:
- explain terms from a message
- follow a learning path
- take a quiz to practice

#### Product rule

A new user should understand the bot’s value in under 10 seconds.

---

### 4. Make learning paths feel more intentional

#### Why this is mandatory

Learning paths already exist, but for the bounty they must feel like an educational journey, not a paginated traversal of cards.

#### Requirements

- Each path should communicate what it teaches
- Step screens should feel like progress through a curriculum
- Last step should clearly celebrate completion
- Completion should strongly point to the path quiz

#### Technical design

Primary files:
- `apps/telegram-bot/src/commands/path.ts`
- `apps/telegram-bot/src/data/paths.ts`
- `apps/telegram-bot/src/utils/keyboard.ts`
- `apps/telegram-bot/src/i18n/locales/en.ftl`
- `apps/telegram-bot/src/i18n/locales/pt.ftl`
- `apps/telegram-bot/src/i18n/locales/es.ftl`

#### Implementation notes

Improve the path menu copy:
- what each path is for
- who it helps

Improve the step header:
- show path name
- show step
- reinforce progression

Improve the completion state:
- congratulate user
- explicitly recommend `Quiz this path`
- hint that progress is saved

#### Product rule

Paths should feel like:
"I’m moving through a course."

Not:
"I’m opening another glossary item."

---

### 5. Produce one excellent demo flow

#### Why this is mandatory

Judges and reviewers remember the story they saw, not the total feature count.

The project needs one polished narrative that demonstrates why it belongs in Telegram.

#### Demo flow

1. Bot is added to a group
2. Group welcome appears
3. A user says a Solana term in normal conversation
4. Another user replies with `/explain`
5. Bot explains the term
6. Same user opens `/path`
7. User advances one path step
8. User launches path quiz

#### Deliverables

- demo script in the README or submission notes
- ideally screenshots or short video that maps exactly to this flow

#### Product rule

The demo should make the product feel like a community learning tool, not a command catalog.

---

## High-Value Polish

These items are strongly recommended if time permits after all must-ship items are stable.

### 1. Improve group welcome tone

Current risk:
- the welcome can sound like a command dump

Desired tone:
- "Add me to explain Solana in real time"
- "Use me when a term appears in conversation"

Primary file:
- `apps/telegram-bot/src/handlers/group.ts`

---

### 2. Tighten the main menu

Current risk:
- menu can still feel feature-first

Desired tone:
- group explanation
- guided learning
- quick quiz

Primary file:
- `apps/telegram-bot/src/commands/start.ts`

---

### 3. Make help less encyclopedic

Current risk:
- help message reads like a command reference

Desired order:
1. Use in a group
2. Learn with paths
3. Practice with quiz
4. Supporting utilities after that

Primary file:
- `apps/telegram-bot/src/i18n/locales/*.ftl`

---

### 4. Ensure PT and ES are first-class in flagship flow

Current risk:
- English-first implementation with translated labels

Requirement:
- `/explicar` must be reliable
- hero copy in PT and ES should sound native, not literal
- welcome and help should preserve the same positioning across locales

Primary files:
- `apps/telegram-bot/src/i18n/locales/pt.ftl`
- `apps/telegram-bot/src/i18n/locales/es.ftl`

---

## Nice If Time

These features are valuable, but should never take priority over the must-ship section.

### 1. `/compare term1 term2`

Why it matters:
- excellent onboarding feature
- helps users understand distinctions, not just definitions

Potential examples:
- `/compare poh pos`
- `/compare account pda`

Impact:
- high

Risk:
- medium

Recommendation:
- only attempt if `/explain` and onboarding are already polished

---

### 2. Review mode

Why it matters:
- reinforces retention
- creates repeat usage beyond search

Potential inputs:
- recent history
- favorites
- path progress

Impact:
- high

Risk:
- medium

Recommendation:
- backlog if core demo is not fully polished

---

### 3. Group term of the day

Why it matters:
- good community signal
- makes the bot feel more present in groups

Impact:
- medium

Risk:
- low to medium

Recommendation:
- only after flagship flow is demo-ready

---

## Explicit Non-Goals Before Deadline

Do not spend deadline time on:

- group leaderboard
- admin control system
- study-plan orchestration
- multi-step conversational `/ask`
- large architecture changes
- storage migration

These are good future ideas, but bad deadline tradeoffs.

---

## Success Criteria

The delivery is successful if:

1. `/explain` works reliably in EN/PT/ES
2. Base card response speed is preserved even when APIs are slow
3. New users immediately understand the 3 hero actions
4. Paths feel educational, not navigational
5. The demo flow is clean enough to tell a sharp story

---

## Recommended Execution Order

1. Harden `/explain`
2. Make enrichment non-blocking
3. Rework onboarding copy
4. Improve path intentionality
5. Prepare demo flow
6. Apply high-value polish if time remains

---

## Files Likely Changed

| File | Change |
|---|---|
| `apps/telegram-bot/src/utils/search.ts` | localized + long-phrase explain matching |
| `apps/telegram-bot/src/commands/explain.ts` | flagship explain flow polish |
| `apps/telegram-bot/src/utils/term-card.ts` | non-blocking enrichment |
| `apps/telegram-bot/src/utils/solana-rpc.ts` | timeout + resilience |
| `apps/telegram-bot/src/utils/coingecko.ts` | timeout + resilience |
| `apps/telegram-bot/src/commands/start.ts` | hero action onboarding |
| `apps/telegram-bot/src/handlers/group.ts` | stronger group CTA |
| `apps/telegram-bot/src/i18n/locales/en.ftl` | hero copy + explain copy |
| `apps/telegram-bot/src/i18n/locales/pt.ftl` | hero copy + explain copy |
| `apps/telegram-bot/src/i18n/locales/es.ftl` | hero copy + explain copy |
| `apps/telegram-bot/src/commands/path.ts` | stronger educational framing |
| `apps/telegram-bot/src/utils/keyboard.ts` | path CTA emphasis |
| `README.md` | sharper delivery narrative and demo framing |

---

## Deliverable

This spec is not a long-term product roadmap.

It is a **2-day bounty delivery plan**.

Its purpose is to make the final submission feel:
- focused
- useful
- intentional
- clearly more valuable than a plain glossary wrapper
