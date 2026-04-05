# Polish & Compare — Design Spec
**Date:** 2026-04-04
**Deadline:** 2026-04-06
**Status:** Approved for implementation

---

## Problem

The bot has strong features but presents itself as a glossary wrapper. The feedback:

> "I don't know if just having a glossary on Telegram brings much value. Try to go one step further — right now it's just a wrapper around the glossary."

The bot must answer one question clearly: **why come to Telegram instead of just Googling?**

The answer is:
- `/explain` works in a live group conversation, in PT/ES, without leaving the chat
- `/compare` answers the most common question in any Solana group ("what's the difference between X and Y?")
- `/path` + `/quiz` create structured, social learning — not random lookups
- The quiz announces winners in groups — creates peer recognition

---

## Delivery Principle

**Group is the hook. Solo is the retention.**

The demo shows: group conversation → `/explain` works → `/compare` works → `/path` + quiz with group announcement.

Everything else supports this story.

---

## Must Ship

### 1. Harden `/explain` — PT/ES Localized Detection

#### Problem
`phraseIndex` only contains English names and aliases. "Prova de Participação" or "Prueba de Participación" return nothing. `/explain` is the flagship group feature and must work for PT/ES users.

#### Design

**`apps/telegram-bot/src/glossary/index.ts`**

Add an exported helper that returns all localized names for a given term ID:

```ts
export function getLocalizedTermNames(id: string): string[] {
  const names: string[] = [];
  const pt = ptMap.get(id);
  if (pt?.term) names.push(pt.term);
  const es = esMap.get(id);
  if (es?.term && es.term !== pt?.term) names.push(es.term);
  return names;
}
```

**`apps/telegram-bot/src/utils/search.ts`**

- Import `getLocalizedTermNames` from glossary index
- Add constant `MAX_TERM_TOKENS = 6` (covers "Modelo de Linguagem Grande" = 4 tokens and future long phrases)
- In `phraseIndex` build loop, add localized names after aliases:

```ts
for (const localizedName of getLocalizedTermNames(term.id)) {
  const ln = normalize(localizedName);
  if (ln && !phraseIndex.has(ln)) phraseIndex.set(ln, { term, kind: "name" });
}
```

- In `findTermsInText`, replace hardcoded `span = 3` with `span = MAX_TERM_TOKENS`

#### Validation

| Input | Expected result |
|---|---|
| `"Proof of History"` | `proof-of-history` |
| `"Prova de Participação"` | `proof-of-stake` |
| `"Prueba de Participación"` | `proof-of-stake` |
| `"Byzantine Fault Tolerance"` | `byzantine-fault-tolerance` |
| `"Modelo de Linguagem Grande"` | `llm` |

---

### 2. Enrichment Non-Blocking

#### Problem
RPC and CoinGecko fetches use a loose 5s timeout. When either API is slow, `/explain`, `/glossary`, and path steps visibly hang. The base card should always render immediately.

#### Design

**`apps/telegram-bot/src/utils/solana-rpc.ts`**
- Reduce `AbortController` timeout: `5_000` → `1_500`

**`apps/telegram-bot/src/utils/coingecko.ts`**
- Reduce `AbortController` timeout: `5_000` → `1_500`

**`apps/telegram-bot/src/utils/term-card.ts`**
- Wrap `Promise.all` in `Promise.race` with a 2000ms total enrichment budget:

```ts
const enrichmentBudget = new Promise<[null, null]>((resolve) =>
  setTimeout(() => resolve([null, null]), 2_000),
);

const [liveStats, solPrice] = await Promise.race([
  Promise.all([getLiveStatsLine(term.id), getSolPriceLine(term.id)]),
  enrichmentBudget,
]);
```

#### Product rule
No user should ever think "the bot is hanging because CoinGecko is slow."

---

### 3. `/compare term1 term2`

#### Command registration

Register in `bot.ts`:
- EN: `/compare`
- PT: `/comparar`
- ES: `/comparar`

Combined: `bot.command(["compare", "comparar"], compareCommand)`

#### Output format

```
🔀 proof-of-history vs proof-of-stake

⚡ Proof of History
Category: Core Protocol
<first 2 sentences of definition>
Aliases: PoH

🏦 Proof of Stake
Category: Core Protocol
<first 2 sentences of definition>
Aliases: PoS

🔗 Related to both: consensus, validator
```

Rules:
- Category label: display the slug formatted as title case (e.g. `core-protocol` → `Core Protocol`). No separate translation needed.
- Definition is truncated to first 2 sentences (split on `. `). If only 1 sentence exists, show it in full.
- "Related to both" line appears only if the two terms share entries in their `related[]` arrays
- If no shared related terms, omit the last line

#### Error handling

- One term not found + `findClosest()` has a suggestion → show suggestion with did-you-mean button
- One term not found + no suggestion → show `compare-not-found-one-no-suggestion` key: "❌ Term not found: `{ $query }`. Use `/glossary` to search."
- Both not found → "❌ Neither term was recognized. Try `/categories` to browse."
- Same term twice → "💡 You compared a term with itself. Try `/glossary <term>` for the full card."

#### Usage format

```
/compare poh pos
/compare account pda
/comparar prova-de-participação prova-de-trabalho
```

Accepts: term IDs, aliases, and normalized names (uses existing `lookupTerm` which handles all three).

#### New files
- `apps/telegram-bot/src/commands/compare.ts`

#### i18n keys needed (all 3 locales)
- `compare-header` — `🔀 { $term1 } vs { $term2 }`
- `compare-shared-related` — `🔗 Related to both: { $terms }`
- `compare-not-found-one` — `❌ Term not found: <b>{ $query }</b>. Did you mean <code>{ $suggestion }</code>?`
- `compare-not-found-both` — `❌ Neither term was recognized. Use /categories to explore.`
- `compare-same-term` — `💡 You compared a term with itself. Try /glossary { $term } for the full card.`
- `usage-compare` — usage hint shown when command is sent with no arguments

---

### 4. Quiz in Groups — Announce the Winner

#### Problem
When a quiz is answered correctly in a group, the confirmation is silent and private. This wastes the social signal — nobody in the group sees that someone got it right.

#### Design

In `apps/telegram-bot/src/handlers/callbacks.ts`, inside `handleQuizAnswer`:

1. Detect chat type: `ctx.chat?.type === "group" || ctx.chat?.type === "supergroup"`
2. If group and answer is **correct**:
   - Build the display name: `@username` if available, otherwise `first_name`
   - Send a **new public message** (not just edit/answerCallbackQuery):
     ```
     ✅ @username got it right! It was Proof of History.
     🔥 Streak: 5 days
     ```
3. If group and answer is **wrong**:
   - Use `ctx.answerCallbackQuery(...)` with `show_alert: true` — ephemeral, only visible to the person who clicked
   - Do not send a public message (avoids polluting the group)
4. Private chat behavior unchanged.

#### New i18n keys
- `quiz-correct-group` — `✅ { $name } got it right! It was <b>{ $term }</b>.\n🔥 Streak: <b>{ $current }</b> days`
- `quiz-correct-group-new-record` — same with `🎉 New record! { $max } days!`

(Add equivalent keys to PT and ES locales.)

---

### 5. Onboarding Copy Reformulation

All three locales (EN/PT/ES) updated. Hero actions first — not a command list.

#### `start-welcome`

```
👋 Solana Glossary Bot

Never leave Telegram to look up a Solana term again.

💬 /explain — reply to any message to decode terms on the spot
💻 /path — guided learning paths, pick up where you left off
🧠 /quiz — daily quiz to build your streak
🔀 /compare poh pos — compare any two concepts side by side
```

#### `group-welcome`

```
👋 Solana Glossary Bot is here.

Reply to any message with /explain to decode Solana terms —
without pulling the conversation out of Telegram.

Try it: reply to a message and send /explain
Also: /compare poh pos · /path · /quiz
```

#### `onboarding-tips`

```
💡 Three ways this bot earns its place in your group:

💬 /explain — someone mentions "turbine" and nobody knows what it is?
   Reply to the message and send /explain.

🔀 /compare poh pos — the most common question in any Solana group, answered.

🧠 /quiz + /path — learn Solana systematically, build a streak, compete on the leaderboard.

Quick lookup: /glossary <term> · Inline: @bot <term>
```

#### `help-message`

Hero actions first, utilities after:

```
📘 Solana Glossary Bot

💬 Explain in context:
/explain — reply to a message to explain Solana terms on the spot

🔀 Compare concepts:
/compare <term1> <term2> — side-by-side comparison

💻 Learn with paths:
/path — guided learning paths

🧠 Practice:
/quiz — daily quiz + streak
/streak · /leaderboard

🔍 Look up terms:
/glossary <term> · /random · /categories · /termofday · /favorites · /history

🌐 Language: /language pt|en|es
```

---

### 6. Learning Paths — Educational Framing

#### Path menu copy

```
💻 Learning Paths

Each path is a focused mini-course.
Your progress is saved — resume where you left off.

⚡ Solana Basics [████░░░░] 3/8
  Protocol fundamentals: PoH, slots, epochs, validators

💰 DeFi Foundations [░░░░░░░░] 0/7
  How DeFi works on Solana: AMMs, liquidity pools, swaps

🔨 Builder's Path [░░░░░░░░] 0/8
  What every Solana dev must know: programs, PDAs, CPIs
```

#### Step screen header

```
⚡ Solana Basics · Step 3 of 8
```

#### Completion screen

```
✅ Path completed: Solana Basics

You've covered all the core Solana protocol concepts.

Recommended next step:
🧠 Quiz this path → keeps your streak going
or
💰 Start DeFi Foundations
```

The completion screen must include a prominent "Quiz this path" button — not buried below a restart button.

The "next path" suggestion is the next entry in `LEARNING_PATHS` array order. If the user completed the last path, omit the next-path suggestion line.

---

## Demo Flow

The sequence a judge or reviewer should see:

1. Bot added to a group → `group-welcome` appears with `/explain` as the first CTA
2. User posts: *"turbine is Solana's block propagation protocol"*
3. Another user replies with `/explicar`
4. Bot returns the **Turbine** card with live TPS stats
5. User asks: *"qual a diferença entre PoH e PoS?"*
6. `/compare poh pos` → two cards with shared related terms
7. User opens `/path` → sees progress bars, selects Solana Basics
8. Advances 2 steps, reaches completion → bot recommends quiz
9. Takes quiz in group → gets it right → bot announces `@username got it right!`

---

## Files Changed

| File | Change |
|---|---|
| `apps/telegram-bot/src/glossary/index.ts` | Export `getLocalizedTermNames()` |
| `apps/telegram-bot/src/utils/search.ts` | PT/ES phraseIndex + `MAX_TERM_TOKENS = 6` |
| `apps/telegram-bot/src/utils/solana-rpc.ts` | Timeout 5000 → 1500ms |
| `apps/telegram-bot/src/utils/coingecko.ts` | Timeout 5000 → 1500ms |
| `apps/telegram-bot/src/utils/term-card.ts` | `Promise.race` with 2000ms total budget |
| `apps/telegram-bot/src/commands/compare.ts` | New command (create) |
| `apps/telegram-bot/src/handlers/callbacks.ts` | Quiz group announcement |
| `apps/telegram-bot/src/bot.ts` | Register `/compare` + `/comparar` |
| `apps/telegram-bot/src/i18n/locales/en.ftl` | All copy changes + new keys |
| `apps/telegram-bot/src/i18n/locales/pt.ftl` | All copy changes + new keys |
| `apps/telegram-bot/src/i18n/locales/es.ftl` | All copy changes + new keys |
| `apps/telegram-bot/src/data/paths.ts` | Richer path descriptions |

---

## Success Criteria

1. `/explicar` finds "Prova de Participação" → proof-of-stake in a PT group chat
2. `/compare poh pos` returns two clean cards with shared related terms
3. Correct quiz answer in a group → bot announces `@username acertou!` publicly
4. `/glossary`, `/explain`, path steps always respond in < 2s even when APIs are slow
5. New user reading `start-welcome` understands the value in under 10 seconds
6. Demo flow runs without friction end to end
