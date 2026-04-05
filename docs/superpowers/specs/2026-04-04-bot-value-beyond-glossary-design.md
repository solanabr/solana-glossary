# Bot Value Beyond Glossary — Product Design Spec
**Date:** 2026-04-04  
**Status:** Approved for planning  
**Goal:** Transform the bot from a glossary lookup surface into a Telegram-native Solana learning companion with clear, repeatable user value

---

## Problem

Current feedback on the project is directionally correct:

> "I don't know if just having a glossary on Telegram brings that much value."

Even with quiz, favorites, history, and multilingual support, the product can still be perceived as:
- a more convenient search box for glossary terms
- a Telegram wrapper around static glossary content
- useful, but not compelling enough to justify opening Telegram specifically for the bot

This is a product-positioning problem, not just an implementation problem.

---

## Product Thesis

The bot should not be "a glossary in Telegram".

It should be:

**A Telegram-native onboarding and learning companion for Solana communities.**

That means every major feature should do at least one of these:
- explain a term in the context of a real conversation
- guide a user through learning over time
- help users retain concepts through repetition and progress
- add live context that a static glossary page cannot provide

---

## User Test

The product passes the value test only if a user has a strong reason to use the bot *inside Telegram*.

Bad reason:
- "I want to see a definition."

Strong reasons:
- "A term just appeared in a group conversation and I want it explained here."
- "I want to follow a guided path to learn Solana."
- "I want the bot to review what I already studied."
- "I want quick live context about the network or market."

If the answer is only "search a term", the bot is still too close to a wrapper.

---

## Core Product Pillars

### 1. Explain In Context

The bot should be useful in live chat, not only in DMs.

Representative feature:
- `/explain` on a replied message

Why it matters:
- creates a reason to add the bot to groups
- turns real conversations into learning moments
- makes bot discovery social and visible

Success signal:
- users invoke the bot from inside group conversations, not only in private lookup flows

---

### 2. Learn In Paths

The bot should help users progress from "I know nothing" to "I understand the basics".

Representative features:
- guided learning paths
- path progress saving
- path-scoped quiz

Why it matters:
- turns glossary content into a structured learning experience
- creates return usage over multiple sessions
- makes the bot feel like a coach instead of an index

Success signal:
- users return to continue a path instead of only doing isolated searches

---

### 3. Review To Retain

The bot should help users remember concepts after the first exposure.

Representative features:
- quizzes
- streaks
- favorites/history
- spaced review

Why it matters:
- repetition is where learning value becomes durable
- gives the bot a reason to re-engage the user over time

Success signal:
- repeat usage driven by recall/review, not just one-off search

---

### 4. Add Live Solana Context

The bot should provide value that a static glossary page does not.

Representative features:
- live network stats for protocol terms
- live SOL price context for DeFi terms

Why it matters:
- makes definitions feel connected to the real network
- gives experienced users a reason to use the bot too

Success signal:
- glossary cards feel alive and contextual instead of archival

---

## Feature Tiers

### Tier 1 — Must-Have

These features define the new identity of the bot.

1. Reply-to-explain
2. Guided learning paths
3. Path-scoped quiz
4. Group welcome with clear CTA
5. Strong onboarding and menu UX

Without these, the product still reads as "searchable glossary".

---

### Tier 2 — Strong Differentiators

These features deepen the value proposition and make the bot harder to replace with a website.

1. Live RPC stats on relevant cards
2. CoinGecko SOL price context on DeFi cards
3. Review / spaced repetition flow
4. Compare two terms
5. Study plan mode

These are not strictly required for the core shift, but they make the product more compelling.

---

### Tier 3 — Community Expansion

These features scale the product from personal study tool to group/community utility.

1. Group weekly challenge
2. Group leaderboard
3. Group term of the day
4. Conversation summary / "terms from this thread"
5. Group admin controls

These are valuable, but should come after the product already proves its core use case.

---

## Top 10 Features

| Rank | Feature | Why it matters | Effort | Impact |
|---|---|---|---|---|
| 1 | `/explain` by reply | Solves real group context | Medium | Very High |
| 2 | Guided paths | Turns glossary into learning product | Medium | Very High |
| 3 | Path quiz | Closes the learning loop | Low | High |
| 4 | Group welcome | Improves discovery in groups | Low | Medium |
| 5 | Live card context | Makes cards feel alive | Medium | High |
| 6 | Spaced review | Improves retention | Medium | High |
| 7 | `/compare term1 term2` | Helps clarify confusion fast | Medium | High |
| 8 | Study plan mode | Introduces habit and progression | Medium | High |
| 9 | Group challenge | Adds communal learning | Medium | Medium |
| 10 | Group leaderboard | Social motivation in context | Medium | Medium |

---

## Product Positioning Shift

### Old framing

"Multilingual Telegram glossary bot"

### New framing

"Telegram-native onboarding and learning companion for Solana communities"

### Old perception

- useful reference tool
- convenient wrapper
- mostly passive

### New perception

- explains what people are discussing right now
- helps newcomers learn in a structured way
- creates repeat engagement through practice and review
- gives live ecosystem context

---

## Recommended Messaging

### One-line pitch

**The Solana bot that explains terms in live Telegram conversations and guides users through learning paths, quizzes, and real-time context.**

### Short version

**Learn Solana where the conversations already happen.**

### Positioning bullets

- Explains Solana terms in context, not just in search results
- Turns the glossary into guided learning paths
- Reinforces understanding with quizzes and review loops
- Adds live protocol and market context to key concepts

---

## MVP Definition

The minimum version of the new product identity is:

1. `/explain`
2. real learning paths
3. path quiz
4. group welcome
5. README and positioning rewrite

If these five pieces are strong, the product already stops feeling like "just a glossary wrapper".

---

## V1 Expansion

After MVP, the next best features are:

1. live network stats
2. SOL price context
3. spaced review
4. `/compare`

These features strengthen utility and retention without changing the core architecture too much.

---

## V2 Expansion

Longer-term features:

1. group challenges
2. group leaderboard
3. admin controls
4. conversational `/ask`
5. structured study plans

This phase turns the bot from a helpful assistant into a real community learning platform.

---

## Decision Rule For New Features

Before adding a feature, ask:

1. Does it create a reason to use the bot in a Telegram group?
2. Does it help someone learn across multiple sessions?
3. Does it provide something stronger than a static glossary website?

If the answer is "no" to all three, the feature is probably not product-defining.

---

## Suggested Execution Order

1. Reply-to-explain
2. Learning paths
3. Path quiz polish
4. Group welcome
5. README rewrite
6. Live context
7. Spaced review
8. Compare mode
9. Group challenges
10. Group leaderboard

---

## Out of Scope For This Spec

- Implementation-level data schemas
- Exact callback names
- Exact wording of all i18n strings
- Low-level code architecture details

Those belong in feature-specific design specs.

---

## Deliverable

This document should be used as the high-level product north star for future specs and implementation work.

Any new feature spec should explicitly state which pillar it strengthens:
- Explain In Context
- Learn In Paths
- Review To Retain
- Add Live Solana Context
