# Approach A — Community-First Design Spec
**Date:** 2026-04-04  
**Bounty deadline:** 2026-04-06  
**Goal:** Transform the bot from a DM glossary wrapper into a Telegram-native community learning tool  
**Status:** Approved for implementation

---

## Overview

Six independent deliverables, each shippable in isolation:

| # | Feature | Effort | Impact |
|---|---|---|---|
| 1 | Reply-to-explain | ~3h | Highest — creates reason to add bot to groups |
| 2 | Learning Paths MVP | ~5h | High — bounty explicitly values educational tools |
| 3 | Group Welcome | ~1h | Medium — polish, first impression in groups |
| 4 | Solana RPC Live Stats | ~2h | High — makes bot feel alive, not just a dictionary |
| 5 | CoinGecko SOL Price | ~1h | Medium — grounds DeFi terms in real market data |
| 6 | README rewrite | ~2h | High — changes how judges perceive the project |

---

## 1. Reply-to-Explain

### What it does

A user replies to any group message and sends `/explain`. The bot reads the replied message text, detects Solana terms, and returns definition cards inline.

```
[Group conversation]
  User A: "Gulf Stream é por isso que o Solana tem baixa latência"
  User B: /explain  ← replies to User A's message

  Bot:
  📖 Gulf Stream
  🏷️ Infrastructure

  Solana's mempool-less transaction forwarding protocol...
  [Related terms] [Browse category] [Share]
```

### Why this matters

- First feature that creates real value *inside* a conversation
- No friction: users don't need to leave the chat or go to DM
- Visible to the whole group → social discovery of the bot

### Technical design

**New command:** `/explain` (+ localized aliases `/explicar`, `/explicar`)

Registration in `bot.ts`:
```typescript
bot.command(["explain", "explicar"], explainCommand);
```

**`src/commands/explain.ts`:**

```typescript
export async function explainCommand(ctx: MyContext): Promise<void> {
  const repliedText = ctx.message?.reply_to_message?.text;

  // Case 1: not a reply → prompt user to reply to a message
  if (!repliedText) {
    await ctx.reply(ctx.t("explain-no-reply"), { parse_mode: "HTML" });
    return;
  }

  // Search for Solana terms in the replied text
  const matches = findTermsInText(repliedText);

  // Case 2: no terms found → show not-found with suggestion
  if (matches.length === 0) {
    await ctx.reply(ctx.t("explain-not-found"), { parse_mode: "HTML" });
    return;
  }

  const userId = ctx.from?.id;

  // Case 3: one or more terms found — show up to 3 cards
  for (const term of matches.slice(0, 3)) {
    if (userId) db.addHistory(userId, term.id);
    const card = formatTermCard(term, ctx.t.bind(ctx), ctx.session.language || "en");
    await ctx.reply(card, {
      parse_mode: "HTML",
      reply_markup: buildTermKeyboard(term.id, ctx.t.bind(ctx), userId),
    });
  }
}
```

**`findTermsInText(text: string): GlossaryTerm[]`** — utility in `src/utils/search.ts`:
- Tokenizes text into words and bigrams (2-word combinations)
- Checks each token against term **names and aliases only** (not definitions — avoids false positives)
- Matching is case-insensitive and strips punctuation from tokens
- Returns deduplicated matches ordered by token position in text
- Prioritizes exact term name matches over alias matches

**Works in groups AND private chats.** No `if (ctx.chat?.type !== "private") return` guard.

### i18n strings

```
explain-no-reply    — "Reply to a message to use /explain"
explain-not-found   — "No Solana terms found in that message"
```

Add to `en.ftl`, `pt.ftl`, `es.ftl`.

### Server.ts menu registration

Add to all 4 command sets:
```typescript
{ command: "explain", description: "Explain Solana terms from a message" }
// pt: { command: "explicar", description: "Explicar termos Solana de uma mensagem" }
// es: { command: "explicar", description: "Explicar términos Solana de un mensaje" }
```

---

## 2. Learning Paths MVP

Full technical spec in `2026-04-04-learning-paths-design.md`.

**Summary of what's built:**
- 3 curated paths: Solana Basics (8), DeFi Foundations (7), Builder's Path (8)
- `/path` registered in `bot.ts` (fixes existing bug)
- Step-by-step navigation: `path_select:`, `path_step:`, `path_quiz:`, `path_reset:` callbacks
- Progress tracked per user per path in new `user_path_progress` table
- Path menu shows progress bars: `[████░░░░] 4/8`
- Completion message + option to start path-scoped quiz

**All 24 term IDs validated against live glossary data ✓**

---

## 3. Group Welcome

### What it does

When the bot is added to a group or supergroup, it automatically sends a welcome message introducing itself and listing available commands.

```
[Bot is added to group]

Bot:
👋 Olá! Sou o Solana Glossary Bot.

Adicione-me ao grupo para explicar termos Solana em tempo real.

🔍 /glossario <termo> — buscar um termo
💡 /explain — explicar termos de uma mensagem (responda com esse comando)
💻 /path — trilhas de aprendizado
🎯 /quiz — quiz de Solana
📅 /termododia — termo do dia
```

### Technical design

**New handler** in `src/handlers/group.ts`:

```typescript
export async function handleBotAdded(ctx: MyContext): Promise<void> {
  const update = ctx.myChatMember;
  if (!update) return;

  const newStatus = update.new_chat_member.status;
  const oldStatus = update.old_chat_member.status;
  const chatType = ctx.chat?.type;

  // Only trigger when bot transitions from non-member → member/admin in a group
  const wasNotMember = oldStatus === "left" || oldStatus === "kicked";
  const isNowMember = newStatus === "member" || newStatus === "administrator";
  const isGroup = chatType === "group" || chatType === "supergroup";

  if (!wasNotMember || !isNowMember || !isGroup) return;

  await ctx.reply(ctx.t("group-welcome"), { parse_mode: "HTML" });
}
```

**Registration in `bot.ts`:**

```typescript
import { handleBotAdded } from "./handlers/group.js";
// ...
bot.on("my_chat_member", handleBotAdded);
```

### i18n strings

```
group-welcome — Welcome message with command list (HTML)
```

Add to `en.ftl`, `pt.ftl`, `es.ftl`. Message should include:
- Brief description of what the bot does
- Key commands: `/explain`, `/path`, `/quiz`, `/termofday`, `/glossary`
- Invitation to use `/explain` by replying to messages

---

## 4. README Rewrite

### Positioning shift

**From:** "Telegram glossary bot"  
**To:** "Telegram-native onboarding and learning companion for Solana communities"

### New narrative structure

```
1. Problem
   - people encounter unknown terms in live group conversations
   - communities repeat the same explanations
   - glossaries outside Telegram break conversation flow

2. Solution
   - /explain: contextual term explanation inside live chats
   - /path: guided learning sequences (Solana Basics, DeFi, Builders)
   - /termofday + /quiz + streaks: daily learning habit
   - multilingual: pt, en, es

3. Why Telegram
   - where Solana communities already live
   - where onboarding actually happens
   - where terms surface in context

4. What it does today (feature list)

5. Architecture / Data layer

6. Why this stands out
```

### Key changes vs current README

- Lead with the problem and solution, not the feature list
- Elevate `/explain` as primary feature (currently not mentioned)
- Elevate `/path` as educational tool (currently buried)
- Remove "glossary wrapper" framing entirely
- Add demo screenshot or GIF showing `/explain` in a group
- Update submission summary to match new positioning

---

## 4. Solana RPC Live Stats

### What it does

For a set of ~10 protocol terms, appends a live data line to the term card using the public Solana mainnet RPC. No API key required.

```
📖 Epoch
🏷️ Core Protocol

A period of 432,000 slots (~2-3 days) that defines a staking cycle...

📡 Live: Epoch 734 · 18h remaining · 1,847 active validators
```

### Approach

**No API key needed.** Uses `https://api.mainnet-beta.solana.com` (public endpoint).

**In-memory cache** with TTL to avoid hammering RPC on every lookup:
- Epoch info: 60s TTL
- Validator count: 5min TTL  
- TPS sample: 30s TTL

**New file: `src/utils/solana-rpc.ts`**

```typescript
interface LiveNetworkStats {
  epoch: number;
  epochProgress: number;    // 0-100%
  slotsRemaining: number;
  currentSlot: number;
  activeValidators: number;
  tps: number;              // recent average
}

export async function getLiveNetworkStats(): Promise<LiveNetworkStats | null>
```

Calls:
- `getEpochInfo` — epoch, slotIndex, slotsInEpoch, absoluteSlot
- `getVoteAccounts` — count of current active validators
- `getRecentPerformanceSamples(1)` — recent TPS

**Term → stats mapping** (which terms show which data):

| Term IDs | Data shown |
|---|---|
| `epoch`, `leader-schedule` | Epoch N · X% complete · Yh remaining |
| `slot`, `block` | Current slot: 345,234,123 |
| `validator`, `vote-account`, `stake` | Active validators: 1,847 |
| `turbine`, `gulf-stream`, `proof-of-history`, `tower-bft` | Network: ~3,200 TPS |

**New function: `getLiveStatsLine(termId): Promise<string | null>`**

Returns a formatted string like `📡 Live: Epoch 734 · 18h remaining` or `null` if the term has no associated live data.

### Integration with term cards

`formatTermCard()` stays synchronous (pure). Live data is fetched in the command handler and appended:

```typescript
// In glossaryCommand, randomTermCommand, handleSelectCallback, etc.:
const card = formatTermCard(term, t, locale);
const liveStats = await getLiveStatsLine(term.id);
const fullCard = liveStats ? `${card}\n\n${liveStats}` : card;
await ctx.reply(fullCard, { parse_mode: "HTML", reply_markup: ... });
```

This keeps `formatTermCard` pure and the live fetch opt-in per call site.

### Error handling

`getLiveNetworkStats` catches all RPC errors and returns `null`. If RPC is down or slow, the term card shows normally without the live line — no user-facing error.

---

## 5. CoinGecko SOL Price

### What it does

For DeFi-related terms, appends current SOL price and 24h change to the term card.

```
📖 AMM (Automated Market Maker)
🏷️ DeFi

Protocol that uses a mathematical formula to price assets...

💰 SOL: $148.20  +2.3% (24h)
```

### Approach

**No API key required.** Uses CoinGecko public API v3.

**New file: `src/utils/coingecko.ts`**

```typescript
interface SolPrice {
  usd: number;
  usd_24h_change: number;
}

export async function getSolPrice(): Promise<SolPrice | null>
```

Endpoint: `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true`

**In-memory cache: 5min TTL** — price data doesn't need to be real-time to second.

**DeFi terms that show SOL price:**

`amm`, `liquidity-pool`, `swap`, `slippage`, `dex`, `yield-farming`, `impermanent-loss`

**New function: `getSolPriceLine(): Promise<string | null>`**

Returns `💰 SOL: $148.20  +2.3% (24h)` or `null` if fetch fails.

Change sign: `+` green arrow if positive, `-` if negative. In HTML: plain text (Telegram HTML doesn't support colors), just `+2.3%` or `-1.5%`.

### Integration

Same pattern as RPC stats — fetched in handler and appended to card. Both live stats can be combined if a term qualifies for both (unlikely, but handled gracefully by concatenating lines).

### Error handling

All CoinGecko errors return `null` silently. Rate limit is 10-50 req/min on free tier — the 5min cache means at most 1 req/5min regardless of user volume.

---

## Files Changed — Full Scope

| File | Change |
|---|---|
| `src/bot.ts` | Register `bot.command("path")`, `bot.command("explain")`, `bot.on("my_chat_member")`, 4 path callbacks |
| `src/commands/path.ts` | Full rewrite — guided step logic |
| `src/commands/explain.ts` | New file |
| `src/handlers/group.ts` | New file — group welcome handler |
| `src/data/paths.ts` | New file — path definitions |
| `src/db/index.ts` | New `user_path_progress` table + 5 new methods |
| `src/utils/keyboard.ts` | Replace `buildPathKeyboard` with `buildPathMenuKeyboard` + `buildPathStepKeyboard` |
| `src/utils/search.ts` | Add `findTermsInText()` |
| `src/handlers/callbacks.ts` | Add 4 path callbacks |
| `src/server.ts` | Add `explain`/`explicar` to all 4 command sets |
| `src/i18n/locales/en.ftl` | New strings: explain, path, group-welcome |
| `src/i18n/locales/pt.ftl` | New strings (translated) |
| `src/i18n/locales/es.ftl` | New strings (translated) |
| `src/utils/solana-rpc.ts` | New — RPC live stats with in-memory cache |
| `src/utils/coingecko.ts` | New — SOL price fetch with 5min cache |
| `README.md` | Full rewrite |

---

## Implementation Order (for 2-day deadline)

1. **Learning Paths** — highest complexity, do first while energy is high
2. **Reply-to-explain** — highest impact, ship while paths are deploying
3. **Solana RPC Live Stats** — isolated utility, no deps on other features
4. **CoinGecko SOL Price** — isolated utility, completes live data layer
5. **Group Welcome** — quick polish
6. **README** — last, after features are working and demoable

---

## Out of Scope

- Quiz in groups with public announcement (too risky for deadline)
- Group admin controls (`/setupgroup`, `/weeklyquiz`)
- Group leaderboard
- Persistent storage migration (PostgreSQL/Turso)
- LATAM Starter path
- Path completion badges
