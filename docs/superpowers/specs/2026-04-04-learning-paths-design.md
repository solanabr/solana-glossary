# Learning Paths — Design Spec
**Date:** 2026-04-04  
**Bounty deadline:** 2026-04-06  
**Status:** Approved for implementation

---

## Problem

The current `/path` command is a shallow alias for the category browser:
- **Bug:** not registered in `bot.ts` — typing `/path` directly does nothing
- **Shallow:** `buildPathKeyboard` routes to `browse_cat:{category}`, not a guided sequence
- **No tracking:** no step progression, no user progress, restarts from zero every time
- **Misleading:** menu says "Developer learning paths" but delivers a paginated category list

Bounty judges expect educational tools, learning paths, and onboarding flows. The current implementation does not deliver that.

---

## Goal

Transform `/path` from a category-browser alias into a genuine guided learning experience:
- Curated ordered sequences of Solana terms (not just category dumps)
- Step-by-step navigation with term cards and step indicator
- Progress tracked per user per path (persists across sessions)
- Completion state with path-scoped quiz option
- "Resume where you left off" on re-entry

---

## User Flow

```
/path
  → path menu with 3 options and progress bars
     ⚡ Solana Basics       [████░░░░] 4/8
     💰 DeFi Foundations    [░░░░░░░░] 0/7
     🔨 Builder's Path      [██░░░░░░] 2/8

  → user selects "Solana Basics"
     Step 4/8 — Proof of History
     [full term card]
     [← Back]  [4/8]  [Next →]
     [⭐ Save term]

  → at last step:
     ✅ Path completed!
     [🧠 Quiz this path]  [🔄 Restart]
```

---

## Curated Paths

All term IDs must exist in `allTerms` (validated against glossary data).

### ⚡ Solana Basics (`solana-basics`)
8 terms covering Solana's core protocol:
`proof-of-history` → `slot` → `block` → `epoch` → `leader-schedule` → `validator` → `tower-bft` → `turbine`

### 💰 DeFi Foundations (`defi-foundations`)
7 terms covering DeFi primitives:
`amm` → `liquidity-pool` → `swap` → `slippage` → `dex` → `yield-farming` → `impermanent-loss`

### 🔨 Builder's Path (`builders-path`)
8 terms for Solana developers:
`program` → `account` → `pda` → `spl-token` → `anchor` → `cpi` → `compute-units` → `rent`

---

## Architecture

### New file: `src/data/paths.ts`

Static path definitions:

```typescript
export interface LearningPath {
  id: string;
  emoji: string;
  nameKey: string;      // i18n key
  descKey: string;      // i18n key
  termIds: string[];
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "solana-basics",
    emoji: "⚡",
    nameKey: "path-name-solana-basics",
    descKey: "path-desc-solana-basics",
    termIds: ["proof-of-history", "slot", "block", "epoch", "leader-schedule", "validator", "tower-bft", "turbine"],
  },
  {
    id: "defi-foundations",
    emoji: "💰",
    nameKey: "path-name-defi-foundations",
    descKey: "path-desc-defi-foundations",
    termIds: ["amm", "liquidity-pool", "swap", "slippage", "dex", "yield-farming", "impermanent-loss"],
  },
  {
    id: "builders-path",
    emoji: "🔨",
    nameKey: "path-name-builders-path",
    descKey: "path-desc-builders-path",
    termIds: ["program", "account", "pda", "spl-token", "anchor", "cpi", "compute-units", "rent"],
  },
];
```

### DB migration: `user_path_progress` table

Added to `db/index.ts` `initSchema()`:

```sql
CREATE TABLE IF NOT EXISTS user_path_progress (
  user_id   INTEGER NOT NULL,
  path_id   TEXT    NOT NULL,
  step      INTEGER DEFAULT 0,        -- 0-indexed current step
  completed INTEGER DEFAULT 0,        -- 1 = finished all steps
  started_at  INTEGER DEFAULT (unixepoch()),
  updated_at  INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, path_id)
);
```

DB methods to add:
- `getPathProgress(userId, pathId)` → `{ step, completed }` or undefined
- `setPathStep(userId, pathId, step)` → upsert step
- `markPathCompleted(userId, pathId)` → set completed = 1
- `resetPath(userId, pathId)` → delete row (allow restart)
- `getAllPathProgress(userId)` → map of pathId → { step, completed, total }

### Keyboard changes: `src/utils/keyboard.ts`

**Replace** `buildPathKeyboard` with two new functions:

`buildPathMenuKeyboard(paths, progressMap, t)` — path selection menu with progress bars:
- Each path button shows: `{emoji} {name} [{bar}] {step}/{total}`
- Callback: `path_select:{pathId}`
- Progress bar: filled/empty blocks (e.g. `████░░░░`)

`buildPathStepKeyboard(pathId, step, total, termId, isFav, isLast, t)` — step navigation:
- Row 1: `[← Back]` `[Step N/M]` (noop) `[Next →]`  — omit ← on step 0, omit → on last step
- Row 2: `[⭐ Save]` or `[★ Remove]`
- Row 3 (last step only): `[🧠 Quiz this path]` `[🔄 Restart]`
- Callbacks: `path_step:{pathId}:{step}`, `path_quiz:{pathId}`, `path_reset:{pathId}`

### Command rewrite: `src/commands/path.ts`

```typescript
export async function pathCommand(ctx): Promise<void> {
  const userId = ctx.from?.id;
  const progressMap = userId ? db.getAllPathProgress(userId) : {};
  await ctx.reply(ctx.t("path-menu-header"), {
    parse_mode: "HTML",
    reply_markup: buildPathMenuKeyboard(LEARNING_PATHS, progressMap, ctx.t.bind(ctx)),
  });
}

export async function sendPathStep(ctx, pathId, step): Promise<void> {
  const path = LEARNING_PATHS.find(p => p.id === pathId);
  if (!path) return;
  const termId = path.termIds[step];
  const term = getTerm(termId);
  if (!term) return;

  const userId = ctx.from?.id;
  if (userId) db.setPathStep(userId, pathId, step);

  const card = formatTermCard(term, ctx.t.bind(ctx), ctx.session.language || "en");
  const header = ctx.t("path-step-header", {
    emoji: path.emoji,
    step: step + 1,
    total: path.termIds.length,
  });
  const isFav = userId ? db.isFavorite(userId, termId) : false;
  const isLast = step === path.termIds.length - 1;

  await ctx.reply(`${header}\n\n${card}`, {
    parse_mode: "HTML",
    reply_markup: buildPathStepKeyboard(pathId, step, path.termIds.length, termId, isFav, isLast, ctx.t.bind(ctx)),
  });
}
```

### New callbacks: `src/handlers/callbacks.ts`

Three new handlers to register in `bot.ts`:

**`handlePathSelectCallback`** — `path_select:{pathId}`
- Looks up path, gets progress, calls `sendPathStep(ctx, pathId, savedStep || 0)`

**`handlePathStepCallback`** — `path_step:{pathId}:{step}`
- Parses pathId and step (0-indexed), calls `sendPathStep(ctx, pathId, step)`
- When `step === path.termIds.length - 1`: marks path as completed in DB, appends completion message below the term card

**`handlePathQuizCallback`** — `path_quiz:{pathId}`
- Filters quiz pool to only terms in the path
- Calls `quizCommand` variant with restricted term pool

**`handlePathResetCallback`** — `path_reset:{pathId}`
- Calls `db.resetPath(userId, pathId)`, sends step 0

### Registration in `bot.ts`

```typescript
import { pathCommand } from "./commands/path.js";
// ...
bot.command("path", pathCommand);
// ...
bot.callbackQuery(/^path_select:/, handlePathSelectCallback);
bot.callbackQuery(/^path_step:/, handlePathStepCallback);
bot.callbackQuery(/^path_quiz:/, handlePathQuizCallback);
bot.callbackQuery(/^path_reset:/, handlePathResetCallback);
```

---

## i18n Strings

Add to all three `.ftl` files (en/pt/es):

```
path-menu-header — Title for path selection menu
path-step-header — "Step N/M · {emoji} {name}"
path-completed — Completion congratulations message
path-name-solana-basics / path-desc-solana-basics
path-name-defi-foundations / path-desc-defi-foundations
path-name-builders-path / path-desc-builders-path
```

---

## Validation Before Implementation

- All 24 term IDs validated against live glossary data — all present ✓
- Step is 0-indexed in DB and callbacks; displayed as 1-indexed in UI (`step + 1`)
- DB migration is additive — no existing data is affected
- `buildPathKeyboard` replacement is backward-safe (remove old export, update all call sites)

---

## Out of Scope

- Group-scoped path leaderboard (too complex for 2-day deadline)
- Path "certificates" or badges (nice-to-have, cut for now)
- More than 3 paths (can add later without schema changes)
- LATAM Starter path (cut for now, can reuse same system later)

---

## Files Changed

| File | Change |
|---|---|
| `src/bot.ts` | Register `bot.command("path")` + 4 new callback handlers |
| `src/commands/path.ts` | Full rewrite — guided step logic |
| `src/data/paths.ts` | New — path definitions |
| `src/db/index.ts` | New table + 5 new methods |
| `src/utils/keyboard.ts` | Replace `buildPathKeyboard` with 2 new functions |
| `src/handlers/callbacks.ts` | Add 4 new handlers |
| `src/i18n/locales/en.ftl` | New strings |
| `src/i18n/locales/pt.ftl` | New strings |
| `src/i18n/locales/es.ftl` | New strings |
