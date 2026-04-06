# Bot Quality Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive Telegram bot improvements including pagination, multilingual definitions, quiz mode, favorites, history, streaks, and UX enhancements.

**Architecture:** SQLite persistence layer (`better-sqlite3`) for user data; modular command/callback structure following existing patterns; i18n via Fluent with per-language command listings.

**Tech Stack:** TypeScript, Grammy, better-sqlite3, @grammyjs/i18n

---

## File Structure Map

### New Files
| File | Responsibility |
|------|----------------|
| `src/db/index.ts` | SQLite access layer — typed query functions for users, favorites, history, streaks, quiz sessions |
| `src/db/schema.sql` | Reference schema (documented in code comments) |
| `src/commands/random.ts` | `/random` command — returns random term, adds to history |
| `src/commands/quiz.ts` | `/quiz` command — starts quiz session, saves to DB |
| `src/commands/favorites.ts` | `/favorites` command — lists user's favorited terms |
| `src/commands/history.ts` | `/history` command — shows last 10 viewed terms |

### Modified Files
| File | Changes |
|------|---------|
| `src/index.ts` (package) | Add `getTermLocalized()` export, load pt/es JSONs |
| `src/utils/format.ts` | `formatTermCard` with locale + external links + onboarding tips |
| `src/utils/search.ts` | Add `findClosest()` Levenshtein function for "did you mean" |
| `src/utils/keyboard.ts` | `buildTermKeyboard` with fav/feedback buttons; `buildCategoryPageKeyboard` for pagination |
| `src/commands/categories.ts` | `sendCategoryTerms(ctx, category, page, editMessage)` signature |
| `src/commands/start.ts` | Send onboarding tips after welcome |
| `src/commands/daily.ts` | Call `db.viewDailyTerm`, show streak badge |
| `src/handlers/callbacks.ts` | Add: `handleCatPageCallback`, `handleFavAddCallback`, `handleFavRemoveCallback`, `handleQuizAnswerCallback`, `handleFeedbackCallback`, `handleDidYouMeanCallback` |
| `src/bot.ts` | Register all new commands + callbacks |
| `src/server.ts` | Init SQLite DB before bot starts; update command registrations |
| `src/i18n/locales/*.ftl` | Add all new keys (40+ translations) |
| `package.json` | Add `better-sqlite3` dependency |

---

## Task 1: Install better-sqlite3 Dependency

**Files:**
- Modify: `apps/telegram-bot/package.json`

- [ ] **Step 1: Add dependency**

Add to dependencies section:

```json
"better-sqlite3": "^12.0.0"
```

- [ ] **Step 2: Install packages**

```bash
cd apps/telegram-bot && npm install
```

Expected: Packages installed, `package-lock.json` updated.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add better-sqlite3 for persistence"
```

---

## Task 2: Create Database Schema and Access Layer

**Files:**
- Create: `src/db/index.ts`
- Modify: `src/server.ts:73-99` (init DB before start)

- [ ] **Step 1: Create database directory**

```bash
mkdir -p apps/telegram-bot/data
echo "*.db" >> apps/telegram-bot/.gitignore
echo "data/" >> apps/telegram-bot/.gitignore
```

- [ ] **Step 2: Write database module**

Create `src/db/index.ts`:

```typescript
// src/db/index.ts
import Database from "better-sqlite3";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../../data/bot.db");

export interface QuizSession {
  termId: string;
  correctIdx: number;
  options: string[];
}

class DatabaseWrapper {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        language TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER NOT NULL,
        term_id TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        PRIMARY KEY (user_id, term_id)
      );

      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        term_id TEXT NOT NULL,
        viewed_at INTEGER DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id, viewed_at DESC);

      CREATE TABLE IF NOT EXISTS streaks (
        user_id INTEGER PRIMARY KEY,
        last_daily_date TEXT,
        streak_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS quiz_sessions (
        user_id INTEGER PRIMARY KEY,
        term_id TEXT NOT NULL,
        correct_idx INTEGER NOT NULL,
        options TEXT NOT NULL
      );
    `);
  }

  // Users
  getLanguage(userId: number): string | undefined {
    const row = this.db.prepare("SELECT language FROM users WHERE user_id = ?").get(userId) as { language: string } | undefined;
    return row?.language;
  }

  setLanguage(userId: number, lang: string): void {
    this.db.prepare(
      "INSERT INTO users (user_id, language) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET language = excluded.language"
    ).run(userId, lang);
  }

  // Favorites
  addFavorite(userId: number, termId: string): void {
    const count = this.db.prepare("SELECT COUNT(*) as count FROM favorites WHERE user_id = ?").get(userId) as { count: number };
    if (count.count >= 50) {
      throw new Error("Favorites limit reached (50)");
    }
    this.db.prepare(
      "INSERT OR IGNORE INTO favorites (user_id, term_id) VALUES (?, ?)"
    ).run(userId, termId);
  }

  removeFavorite(userId: number, termId: string): void {
    this.db.prepare("DELETE FROM favorites WHERE user_id = ? AND term_id = ?").run(userId, termId);
  }

  getFavorites(userId: number): string[] {
    const rows = this.db.prepare("SELECT term_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC").all(userId) as { term_id: string }[];
    return rows.map(r => r.term_id);
  }

  isFavorite(userId: number, termId: string): boolean {
    const row = this.db.prepare("SELECT 1 FROM favorites WHERE user_id = ? AND term_id = ?").get(userId, termId);
    return !!row;
  }

  // History
  addHistory(userId: number, termId: string): void {
    this.db.prepare("INSERT INTO history (user_id, term_id) VALUES (?, ?)").run(userId, termId);
    // Keep only last 10
    this.db.prepare(`
      DELETE FROM history WHERE id IN (
        SELECT id FROM history WHERE user_id = ? ORDER BY viewed_at DESC LIMIT -1 OFFSET 10
      )
    `).run(userId);
  }

  getHistory(userId: number): string[] {
    const rows = this.db.prepare(
      "SELECT term_id FROM history WHERE user_id = ? ORDER BY viewed_at DESC LIMIT 10"
    ).all(userId) as { term_id: string }[];
    return rows.map(r => r.term_id);
  }

  // Streaks
  viewDailyTerm(userId: number): { streak: number; isNew: boolean } {
    const today = new Date().toISOString().split("T")[0];
    const row = this.db.prepare("SELECT last_daily_date, streak_count FROM streaks WHERE user_id = ?").get(userId) as { last_daily_date: string; streak_count: number } | undefined;

    if (!row) {
      this.db.prepare("INSERT INTO streaks (user_id, last_daily_date, streak_count) VALUES (?, ?, 1)").run(userId, today);
      return { streak: 1, isNew: true };
    }

    if (row.last_daily_date === today) {
      return { streak: row.streak_count, isNew: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak: number;
    if (row.last_daily_date === yesterdayStr) {
      newStreak = row.streak_count + 1;
    } else {
      newStreak = 1;
    }

    this.db.prepare("UPDATE streaks SET last_daily_date = ?, streak_count = ? WHERE user_id = ?").run(today, newStreak, userId);
    return { streak: newStreak, isNew: true };
  }

  // Quiz
  saveQuizSession(userId: number, termId: string, correctIdx: number, options: string[]): void {
    this.db.prepare(
      "INSERT INTO quiz_sessions (user_id, term_id, correct_idx, options) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET term_id = excluded.term_id, correct_idx = excluded.correct_idx, options = excluded.options"
    ).run(userId, termId, correctIdx, JSON.stringify(options));
  }

  getQuizSession(userId: number): QuizSession | undefined {
    const row = this.db.prepare("SELECT term_id, correct_idx, options FROM quiz_sessions WHERE user_id = ?").get(userId) as { term_id: string; correct_idx: number; options: string } | undefined;
    if (!row) return undefined;
    return {
      termId: row.term_id,
      correctIdx: row.correct_idx,
      options: JSON.parse(row.options),
    };
  }

  clearQuizSession(userId: number): void {
    this.db.prepare("DELETE FROM quiz_sessions WHERE user_id = ?").run(userId);
  }
}

export const db = new DatabaseWrapper();
```

- [ ] **Step 3: Initialize DB in server.ts**

Add at top of `src/server.ts`:

```typescript
import { db } from "./db/index.js";
```

The import will trigger initialization. Add a log:

```typescript
console.log("Database initialized at", DB_PATH);
```

- [ ] **Step 4: Test database creation**

```bash
cd apps/telegram-bot && npm run dev
```

Expected: Console shows "Database initialized", `data/bot.db` file created.

- [ ] **Step 5: Commit**

```bash
git add src/db/index.ts src/server.ts .gitignore
git commit -m "feat(db): add SQLite persistence layer with users, favorites, history, streaks, quiz"
```

---

## Task 3: Add getTermLocalized to SDK

**Files:**
- Create: Load i18n JSONs in package
- Modify: `src/index.ts` (package root)

- [ ] **Step 1: Load i18n JSONs and create lookup**

Modify `src/index.ts`:

```typescript
import ptI18n from "../data/i18n/pt.json";
import esI18n from "../data/i18n/es.json";

// Type for i18n entries
interface I18nEntry {
  term: string;
  definition: string;
}

// Build lookup maps
const ptMap = new Map<string, I18nEntry>();
const esMap = new Map<string, I18nEntry>();

for (const [id, entry] of Object.entries(ptI18n)) {
  ptMap.set(id, entry as I18nEntry);
}
for (const [id, entry] of Object.entries(esI18n)) {
  esMap.set(id, entry as I18nEntry);
}

/** Get localized term and definition. Falls back to original fields for English or missing translations */
export function getTermLocalized(
  id: string,
  locale: "pt" | "en" | "es"
): { term: string; definition: string } | undefined {
  const term = getTerm(id);
  if (!term) return undefined;

  if (locale === "en") {
    return { term: term.term, definition: term.definition };
  }

  const map = locale === "pt" ? ptMap : esMap;
  const localized = map.get(id);

  if (localized) {
    return {
      term: localized.term || term.term,
      definition: localized.definition || term.definition,
    };
  }

  // Fallback to English
  return { term: term.term, definition: term.definition };
}
```

- [ ] **Step 2: Export new function**

Ensure `getTermLocalized` is exported.

- [ ] **Step 3: Test**

```bash
cd apps/telegram-bot && npm run dev
```

Quick test in code (temporary):
```typescript
import { getTermLocalized } from "@stbr/solana-glossary";
console.log(getTermLocalized("proof-of-history", "pt"));
```

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat(sdk): add getTermLocalized for multilingual definitions"
```

---

## Task 4: Add Levenshtein Search for "Did You Mean"

**Files:**
- Modify: `src/utils/search.ts`

- [ ] **Step 1: Add Levenshtein function**

Add to `src/utils/search.ts`:

```typescript
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/** Find closest term by Levenshtein distance (threshold ≤ 3) */
export function findClosest(query: string): GlossaryTerm | undefined {
  const lowerQuery = query.toLowerCase();
  let bestMatch: GlossaryTerm | undefined;
  let bestDistance = Infinity;

  for (const term of allTerms) {
    // Check ID
    const idDist = levenshteinDistance(lowerQuery, term.id.toLowerCase());
    if (idDist < bestDistance) {
      bestDistance = idDist;
      bestMatch = term;
    }

    // Check term name
    const nameDist = levenshteinDistance(lowerQuery, term.term.toLowerCase());
    if (nameDist < bestDistance) {
      bestDistance = nameDist;
      bestMatch = term;
    }

    // Check aliases
    for (const alias of term.aliases ?? []) {
      const aliasDist = levenshteinDistance(lowerQuery, alias.toLowerCase());
      if (aliasDist < bestDistance) {
        bestDistance = aliasDist;
        bestMatch = term;
      }
    }
  }

  return bestDistance <= 3 ? bestMatch : undefined;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/search.ts
git commit -m "feat(search): add Levenshtein-based findClosest for 'did you mean'"
```

---

## Task 5: Update formatTermCard for Localization and External Links

**Files:**
- Modify: `src/utils/format.ts`

- [ ] **Step 1: Add imports and update signature**

```typescript
import { getTermLocalized } from "@stbr/solana-glossary";

const DOCS_LINK_CATEGORIES = new Set([
  "core-protocol",
  "infrastructure", 
  "network",
  "defi"
]);

export function formatTermCard(
  term: GlossaryTerm,
  t: TranslateFn,
  locale?: string
): string {
  // Get localized content
  let displayTerm = term.term;
  let displayDefinition = term.definition;

  if (locale && (locale === "pt" || locale === "es")) {
    const localized = getTermLocalized(term.id, locale);
    if (localized) {
      displayTerm = localized.term;
      displayDefinition = localized.definition;
    }
  }

  const lines: string[] = [
    `📖 <b>${escapeHtml(displayTerm)}</b>`,
    `🏷️ <i>${formatCategoryName(term.category)}</i>`,
    "",
    escapeHtml(displayDefinition),
  ];

  if (term.aliases && term.aliases.length > 0) {
    lines.push(
      "",
      `${t("term-aliases")}: ${term.aliases.map((a) => `<code>${escapeHtml(a)}</code>`).join(", ")}`
    );
  }

  if (term.related && term.related.length > 0) {
    const shown = term.related.slice(0, 5);
    lines.push(
      `${t("term-related")}: ${shown.map((r) => `<code>${escapeHtml(r)}</code>`).join(" · ")}`
    );
  }

  // External links for specific categories
  if (DOCS_LINK_CATEGORIES.has(term.category)) {
    const docsUrl = `https://solana.com/docs/terminology#${term.id}`;
    lines.push("", t("term-read-more", { url: docsUrl }));
  }

  return lines.join("\n");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/format.ts
git commit -m "feat(format): add localization and external docs links to term cards"
```

---

## Task 6: Update Keyboard Builders

**Files:**
- Modify: `src/utils/keyboard.ts`

- [ ] **Step 1: Update imports and buildTermKeyboard signature**

```typescript
import { db } from "../db/index.js";
import type { Category } from "@stbr/solana-glossary";

export function buildTermKeyboard(
  termId: string,
  t: MyContext["t"],
  userId?: number
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  // First row: Related, Category
  keyboard.text(t("btn-related"), `related:${termId}`);
  keyboard.text(t("btn-category"), `category:${termId}`);
  keyboard.row();
  
  // Second row: Share
  keyboard.switchInline(t("btn-share"), termId);
  keyboard.row();
  
  // Third row: Favorite, Feedback
  if (userId) {
    const isFav = db.isFavorite(userId, termId);
    if (isFav) {
      keyboard.text(t("btn-fav-remove"), `fav_remove:${termId}`);
    } else {
      keyboard.text(t("btn-fav-add"), `fav_add:${termId}`);
    }
    keyboard.row();
    keyboard.text(t("btn-feedback-up"), `feedback:${termId}:up`);
    keyboard.text(t("btn-feedback-down"), `feedback:${termId}:down`);
  }
  
  return keyboard;
}
```

- [ ] **Step 2: Add category pagination keyboard**

```typescript
export function buildCategoryPageKeyboard(
  category: Category,
  page: number,
  totalPages: number,
  t: MyContext["t"]
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  // Navigation row
  if (page > 1) {
    keyboard.text(t("btn-prev"), `cat_page:${category}:${page - 1}`);
  }
  
  keyboard.text(t("btn-page", { current: page, total: totalPages }), "noop:");
  
  if (page < totalPages) {
    keyboard.text(t("btn-next"), `cat_page:${category}:${page + 1}`);
  }
  
  return keyboard;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/keyboard.ts
git commit -m "feat(keyboard): add favorite/feedback buttons and category pagination"
```

---

## Task 7: Update Categories Command with Pagination

**Files:**
- Modify: `src/commands/categories.ts`

- [ ] **Step 1: Update imports and add pagination constants**

```typescript
import { buildCategoryPageKeyboard } from "../utils/keyboard.js";

const PAGE_SIZE = 15;
```

- [ ] **Step 2: Update sendCategoryTerms signature**

Replace the function:

```typescript
export async function sendCategoryTerms(
  ctx: MyContext,
  category: Category,
  page = 1,
  editMessage = false
): Promise<void> {
  const allTerms = getTermsByCategory(category);
  const totalPages = Math.ceil(allTerms.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageTerms = allTerms.slice(start, start + PAGE_SIZE);

  const header = ctx.t("category-header", {
    name: formatCategoryName(category),
    count: allTerms.length,
  });

  const text = formatTermList(pageTerms, `${header} (página ${page}/${totalPages})`);
  const keyboard = totalPages > 1 
    ? buildCategoryPageKeyboard(category, page, totalPages, ctx.t.bind(ctx))
    : undefined;

  if (editMessage && ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/categories.ts
git commit -m "feat(categories): add pagination support with edit-in-place navigation"
```

---

## Task 8: Create Random Term Command

**Files:**
- Create: `src/commands/random.ts`

- [ ] **Step 1: Write random command**

```typescript
// src/commands/random.ts
import { allTerms } from "@stbr/solana-glossary";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

export async function randomTermCommand(ctx: MyContext): Promise<void> {
  const term = allTerms[Math.floor(Math.random() * allTerms.length)];
  const userId = ctx.from?.id;

  // Add to history if user exists
  if (userId) {
    db.addHistory(userId, term.id);
  }

  const header = ctx.t("random-term-header");
  const card = formatTermCard(term, ctx.t.bind(ctx), ctx.i18n.locale);
  
  await ctx.reply(`${header}\n\n${card}`, {
    parse_mode: "HTML",
    reply_markup: buildTermKeyboard(term.id, ctx.t.bind(ctx), userId),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/random.ts
git commit -m "feat(commands): add /random command for random term discovery"
```

---

## Task 9: Create Quiz Command

**Files:**
- Create: `src/commands/quiz.ts`

- [ ] **Step 1: Write quiz command**

```typescript
// src/commands/quiz.ts
import { allTerms, getTermsByCategory } from "@stbr/solana-glossary";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { InlineKeyboard } from "grammy";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function quizCommand(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("quiz-no-user"));
    return;
  }

  // Pick a random term with definition
  const termsWithDef = allTerms.filter(t => t.definition && t.definition.length > 20);
  const targetTerm = termsWithDef[Math.floor(Math.random() * termsWithDef.length)];

  // Get 3 distractors from same category
  const categoryTerms = getTermsByCategory(targetTerm.category)
    .filter(t => t.id !== targetTerm.id);
  const distractors = shuffleArray(categoryTerms).slice(0, 3);

  // Build 4 options
  const options = shuffleArray([targetTerm, ...distractors]);
  const correctIdx = options.findIndex(t => t.id === targetTerm.id);

  // Save session
  db.saveQuizSession(userId, targetTerm.id, correctIdx, options.map(t => t.id));

  // Show question
  const definitionSnippet = targetTerm.definition.slice(0, 200) + "...";
  const question = ctx.t("quiz-question", { definition: definitionSnippet });

  const keyboard = new InlineKeyboard()
    .text(ctx.t("quiz-option-a", { term: options[0].term }), `quiz_answer:0`)
    .row()
    .text(ctx.t("quiz-option-b", { term: options[1].term }), `quiz_answer:1`)
    .row()
    .text(ctx.t("quiz-option-c", { term: options[2].term }), `quiz_answer:2`)
    .row()
    .text(ctx.t("quiz-option-d", { term: options[3].term }), `quiz_answer:3`);

  await ctx.reply(question, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/quiz.ts
git commit -m "feat(commands): add /quiz command with multiple choice questions"
```

---

## Task 10: Create Favorites Command

**Files:**
- Create: `src/commands/favorites.ts`

- [ ] **Step 1: Write favorites command**

```typescript
// src/commands/favorites.ts
import { getTerm } from "@stbr/solana-glossary";
import { InlineKeyboard } from "grammy";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

export async function favoritesCommand(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  const favIds = db.getFavorites(userId);
  
  if (favIds.length === 0) {
    await ctx.reply(ctx.t("favorites-empty"));
    return;
  }

  const header = ctx.t("favorites-header", { count: favIds.length });
  const keyboard = new InlineKeyboard();

  favIds.forEach((id, i) => {
    const term = getTerm(id);
    if (term) {
      keyboard.text(term.term, `select:${id}`);
      if (i < favIds.length - 1) keyboard.row();
    }
  });

  await ctx.reply(header, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/favorites.ts
git commit -m "feat(commands): add /favorites command to list saved terms"
```

---

## Task 11: Create History Command

**Files:**
- Create: `src/commands/history.ts`

- [ ] **Step 1: Write history command**

```typescript
// src/commands/history.ts
import { getTerm } from "@stbr/solana-glossary";
import { InlineKeyboard } from "grammy";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

export async function historyCommand(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  const historyIds = db.getHistory(userId);
  
  if (historyIds.length === 0) {
    await ctx.reply(ctx.t("history-empty"));
    return;
  }

  const header = ctx.t("history-header");
  const keyboard = new InlineKeyboard();

  historyIds.forEach((id, i) => {
    const term = getTerm(id);
    if (term) {
      keyboard.text(term.term, `select:${id}`);
      if (i < historyIds.length - 1) keyboard.row();
    }
  });

  await ctx.reply(header, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/history.ts
git commit -m "feat(commands): add /history command for recently viewed terms"
```

---

## Task 12: Update Daily Term Command with Streaks

**Files:**
- Modify: `src/commands/daily.ts`

- [ ] **Step 1: Update daily command with streak display**

```typescript
// src/commands/daily.ts
import { allTerms } from "@stbr/solana-glossary";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

function getDailyTerm() {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return allTerms[seed % allTerms.length];
}

export async function dailyTermCommand(ctx: MyContext): Promise<void> {
  const term = getDailyTerm();
  const userId = ctx.from?.id;

  let streakText = "";
  if (userId) {
    const { streak, isNew } = db.viewDailyTerm(userId);
    if (streak === 1 && isNew) {
      streakText = ctx.t("streak-first");
    } else if (streak === 1) {
      streakText = ctx.t("streak-day", { count: streak });
    } else {
      streakText = ctx.t("streak-days", { count: streak });
    }
  }

  const header = streakText
    ? `📅 <b>${ctx.t("daily-term-header")}</b>  ${streakText}\n\n`
    : `📅 <b>${ctx.t("daily-term-header")}</b>\n\n`;

  const card = formatTermCard(term, ctx.t.bind(ctx), ctx.i18n.locale);
  
  await ctx.reply(header + card, {
    parse_mode: "HTML",
    reply_markup: buildTermKeyboard(term.id, ctx.t.bind(ctx), userId),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/daily.ts
git commit -m "feat(daily): add streak tracking and display to daily term"
```

---

## Task 13: Update Start Command with Onboarding

**Files:**
- Modify: `src/commands/start.ts`

- [ ] **Step 1: Add onboarding tips after welcome**

Update `sendWelcome` function:

```typescript
export async function sendWelcome(ctx: MyContext): Promise<void> {
  const text = ctx.t("start-welcome", { bot_username: ctx.me.username });
  if (BANNER_URL) {
    await ctx.replyWithPhoto(BANNER_URL, { caption: text, parse_mode: "HTML" });
  } else {
    await ctx.reply(text, { parse_mode: "HTML" });
  }
  
  // Send onboarding tips as follow-up
  await ctx.reply(ctx.t("onboarding-tips"), { parse_mode: "HTML" });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/start.ts
git commit -m "feat(start): add onboarding tips after welcome message"
```

---

## Task 14: Update Glossary Command with "Did You Mean"

**Files:**
- Modify: `src/commands/glossary.ts`

- [ ] **Step 1: Add did-you-mean handling**

```typescript
// src/commands/glossary.ts
import { lookupTerm, findClosest } from "../utils/search.js";
import { formatTermCard } from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { InlineKeyboard } from "grammy";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

export async function glossaryCommand(ctx: MyContext): Promise<void> {
  const query = (ctx.match as string).trim();

  if (!query) {
    await ctx.reply(ctx.t("usage-glossary"), { parse_mode: "HTML" });
    return;
  }

  const result = lookupTerm(query);

  if (result.type === "not-found") {
    // Try did-you-mean
    const closest = findClosest(query);
    if (closest) {
      const keyboard = new InlineKeyboard().text(
        ctx.t("btn-did-you-mean"),
        `select:${closest.id}`
      );
      await ctx.reply(
        ctx.t("did-you-mean", { term: closest.id }),
        { parse_mode: "HTML", reply_markup: keyboard }
      );
    } else {
      await ctx.reply(ctx.t("term-not-found", { query }), { parse_mode: "HTML" });
    }
    return;
  }

  if (result.type === "found") {
    const userId = ctx.from?.id;
    if (userId) {
      db.addHistory(userId, result.term.id);
    }

    const card = formatTermCard(result.term, ctx.t.bind(ctx), ctx.i18n.locale);
    await ctx.reply(card, {
      parse_mode: "HTML",
      reply_markup: buildTermKeyboard(result.term.id, ctx.t.bind(ctx), userId),
    });
    return;
  }

  // Multiple results
  const header = ctx.t("multiple-results", { count: result.terms.length, query });
  await ctx.reply(header, {
    parse_mode: "HTML",
    reply_markup: buildSelectKeyboard(result.terms),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/glossary.ts
git commit -m "feat(glossary): add 'did you mean' suggestions and history tracking"
```

---

## Task 15: Add All New Callback Handlers

**Files:**
- Modify: `src/handlers/callbacks.ts`

- [ ] **Step 1: Add imports**

```typescript
import { db } from "../db/index.js";
import { buildCategoryPageKeyboard } from "../utils/keyboard.js";
import { sendCategoryTerms } from "../commands/categories.js";
```

- [ ] **Step 2: Add category pagination handler**

```typescript
export async function handleCatPageCallback(ctx: MyContext): Promise<void> {
  const data = ctx.callbackQuery?.data ?? "";
  const match = data.match(/^cat_page:(.+):(\d+)$/);
  if (!match) {
    await ctx.answerCallbackQuery({ text: "Invalid callback" });
    return;
  }

  const category = match[1] as Category;
  const page = parseInt(match[2], 10);

  // Validate category
  const categories = getCategories();
  if (!categories.includes(category)) {
    await ctx.answerCallbackQuery({ text: ctx.t("category-not-found", { name: category }), show_alert: true });
    return;
  }

  await sendCategoryTerms(ctx, category, page, true);
  await ctx.answerCallbackQuery();
}
```

- [ ] **Step 3: Add favorite handlers**

```typescript
export async function handleFavAddCallback(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery({ text: ctx.t("internal-error") });
    return;
  }

  const termId = (ctx.callbackQuery?.data ?? "").slice("fav_add:".length);
  
  try {
    db.addFavorite(userId, termId);
    await ctx.answerCallbackQuery({ text: ctx.t("favorite-added") });
    
    // Update keyboard to show remove button
    await ctx.editMessageReplyMarkup({
      reply_markup: buildTermKeyboard(termId, ctx.t.bind(ctx), userId),
    });
  } catch (err) {
    await ctx.answerCallbackQuery({ text: ctx.t("favorites-limit"), show_alert: true });
  }
}

export async function handleFavRemoveCallback(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery({ text: ctx.t("internal-error") });
    return;
  }

  const termId = (ctx.callbackQuery?.data ?? "").slice("fav_remove:".length);
  
  db.removeFavorite(userId, termId);
  await ctx.answerCallbackQuery({ text: ctx.t("favorite-removed") });
  
  // Update keyboard to show add button
  await ctx.editMessageReplyMarkup({
    reply_markup: buildTermKeyboard(termId, ctx.t.bind(ctx), userId),
  });
}
```

- [ ] **Step 4: Add quiz answer handler**

```typescript
export async function handleQuizAnswerCallback(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery({ text: ctx.t("quiz-no-session") });
    return;
  }

  const session = db.getQuizSession(userId);
  if (!session) {
    await ctx.answerCallbackQuery({ text: ctx.t("quiz-no-session") });
    return;
  }

  const data = ctx.callbackQuery?.data ?? "";
  const answerIdx = parseInt(data.slice("quiz_answer:".length), 10);
  const isCorrect = answerIdx === session.correctIdx;

  const correctTerm = getTerm(session.options[session.correctIdx]);
  
  if (isCorrect) {
    await ctx.reply(ctx.t("quiz-correct", { term: correctTerm?.term ?? "" }), {
      parse_mode: "HTML",
    });
  } else {
    await ctx.reply(ctx.t("quiz-wrong", { term: correctTerm?.term ?? "" }), {
      parse_mode: "HTML",
    });
  }

  // Show the term card
  if (correctTerm) {
    const card = formatTermCard(correctTerm, ctx.t.bind(ctx), ctx.i18n.locale);
    await ctx.reply(card, {
      parse_mode: "HTML",
      reply_markup: buildTermKeyboard(correctTerm.id, ctx.t.bind(ctx), userId),
    });
  }

  // Clear session
  db.clearQuizSession(userId);
  await ctx.answerCallbackQuery();
}
```

- [ ] **Step 5: Add feedback handler**

```typescript
export async function handleFeedbackCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery({ text: ctx.t("feedback-thanks") });
}
```

- [ ] **Step 6: Update existing handlers to add history**

Update `handleSelectCallback`:

```typescript
export async function handleSelectCallback(ctx: MyContext): Promise<void> {
  const termId = (ctx.callbackQuery?.data ?? "").slice("select:".length);
  const term = getTerm(termId);

  if (!term) {
    await ctx.answerCallbackQuery({
      text: stripHtml(ctx.t("term-not-found", { query: termId })),
      show_alert: true,
    });
    return;
  }

  const userId = ctx.from?.id;
  if (userId) {
    db.addHistory(userId, termId);
  }

  const card = formatTermCard(term, ctx.t.bind(ctx), ctx.i18n.locale);
  await ctx.answerCallbackQuery();
  await ctx.reply(card, {
    parse_mode: "HTML",
    reply_markup: buildTermKeyboard(termId, ctx.t.bind(ctx), userId),
  });
}
```

Update `handleBrowseCatCallback` with validation:

```typescript
export async function handleBrowseCatCallback(ctx: MyContext): Promise<void> {
  const category = (ctx.callbackQuery?.data ?? "").slice("browse_cat:".length) as Category;
  
  const categories = getCategories();
  if (!categories.includes(category)) {
    await ctx.answerCallbackQuery({ text: ctx.t("category-not-found", { name: category }), show_alert: true });
    return;
  }
  
  await ctx.answerCallbackQuery();
  await sendCategoryTerms(ctx, category, 1, false);
}
```

- [ ] **Step 7: Commit**

```bash
git add src/handlers/callbacks.ts
git commit -m "feat(callbacks): add pagination, favorites, quiz, feedback handlers"
```

---

## Task 16: Register All Commands and Callbacks in Bot

**Files:**
- Modify: `src/bot.ts`

- [ ] **Step 1: Add new command imports**

```typescript
import { randomTermCommand } from "./commands/random.js";
import { quizCommand } from "./commands/quiz.js";
import { favoritesCommand } from "./commands/favorites.js";
import { historyCommand } from "./commands/history.js";
```

- [ ] **Step 2: Add new callback imports**

```typescript
import {
  handleLangCallback,
  handleRelatedCallback,
  handleCategoryCallback,
  handleSelectCallback,
  handleBrowseCatCallback,
  handleCatPageCallback,
  handleFavAddCallback,
  handleFavRemoveCallback,
  handleQuizAnswerCallback,
  handleFeedbackCallback,
} from "./handlers/callbacks.js";
```

- [ ] **Step 3: Register new commands**

```typescript
bot.command(["aleatorio", "random"], randomTermCommand);
bot.command(["quiz"], quizCommand);
bot.command(["favoritos", "favorites"], favoritesCommand);
bot.command(["historico", "history", "historial"], historyCommand);
```

- [ ] **Step 4: Register new callbacks**

```typescript
bot.callbackQuery(/^cat_page:/, handleCatPageCallback);
bot.callbackQuery(/^fav_add:/, handleFavAddCallback);
bot.callbackQuery(/^fav_remove:/, handleFavRemoveCallback);
bot.callbackQuery(/^quiz_answer:/, handleQuizAnswerCallback);
bot.callbackQuery(/^feedback:/, handleFeedbackCallback);
```

- [ ] **Step 5: Commit**

```bash
git add src/bot.ts
git commit -m "feat(bot): register all new commands and callback handlers"
```

---

## Task 17: Update Server Commands Registration

**Files:**
- Modify: `src/server.ts`

- [ ] **Step 1: Add new commands to setCommands**

Update command arrays in `setCommands()`:

```typescript
// PT
{ command: "aleatorio", description: "Termo aleatório" },
{ command: "quiz", description: "Iniciar quiz" },
{ command: "favoritos", description: "Meus termos salvos" },
{ command: "historico", description: "Últimos termos vistos" },

// EN
{ command: "random", description: "Random term" },
{ command: "quiz", description: "Start quiz" },
{ command: "favorites", description: "Saved terms" },
{ command: "history", description: "Recently viewed terms" },

// ES
{ command: "aleatorio", description: "Término aleatorio" },
{ command: "quiz", description: "Iniciar quiz" },
{ command: "favoritos", description: "Mis términos guardados" },
{ command: "historial", description: "Términos vistos recientemente" },
```

- [ ] **Step 2: Commit**

```bash
git add src/server.ts
git commit -m "feat(server): register new bot commands with Telegram API"
```

---

## Task 18: Add All i18n Translations

**Files:**
- Modify: `src/i18n/locales/pt.ftl`, `en.ftl`, `es.ftl`

- [ ] **Step 1: Update pt.ftl**

Append to `src/i18n/locales/pt.ftl`:

```fluent
# New commands help
help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Buscar:</b>
    /glossario &lt;termo&gt; — buscar um termo Solana
    /aleatorio — termo aleatório

    📂 <b>Explorar:</b>
    /categorias — ver as 14 categorias
    /categoria &lt;nome&gt; — termos de uma categoria

    📅 <b>Aprender:</b>
    /termododia — termo do dia
    /quiz — iniciar quiz
    /favoritos — meus termos salvos
    /historico — últimos termos vistos

    🌐 <b>Idioma:</b>
    /idioma pt|en|es — trocar idioma

    💡 Digite <code>@{ $bot_username } &lt;termo&gt;</code> em qualquer chat!

# Pagination
btn-prev = ← Anterior
btn-next = Próxima →
btn-page = Pág { $current }/{ $total }

# Random term
random-term-header = 🎲 Termo aleatório

# Quiz
quiz-question = 🧠 <b>Qual termo descreve isso?</b>\n\n<i>{ $definition }</i>
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>Correto!</b> Era <b>{ $term }</b>.
quiz-wrong = ❌ <b>Errado.</b> A resposta era <b>{ $term }</b>.
quiz-no-session = ❌ Nenhum quiz ativo. Use /quiz para começar.
quiz-no-user = ❌ Necessário usuário para quiz.

# Favorites
btn-fav-add = ⭐ Salvar
btn-fav-remove = ★ Remover
favorite-added = ⭐ Salvo!
favorite-removed = Removido.
favorites-header = ⭐ <b>Seus favoritos</b> — { $count } termos
favorites-empty = Você ainda não salvou nenhum termo. Use ⭐ no card de qualquer termo.
favorites-limit = ⚠️ Limite de 50 favoritos atingido.

# History
history-header = 🕐 <b>Últimos termos vistos</b>
history-empty = Você ainda não consultou nenhum termo.

# Streaks
streak-day = 🔥 { $count } dia seguido
streak-days = 🔥 { $count } dias seguidos
streak-first = 🔥 Primeiro dia!

# Did you mean
did-you-mean = ❌ Nenhum resultado para esse termo.\n\nVocê quis dizer: <code>{ $term }</code>?
btn-did-you-mean = Sim, mostrar →

# External links
term-read-more = 🔗 <a href="{ $url }">Ver na documentação Solana</a>

# Onboarding
onboarding-tips =
    💡 <b>Dicas rápidas:</b>

    🔍 Busque qualquer termo: <code>/glossario proof-of-history</code>
    📂 Explore por categoria: /categorias
    🧠 Teste seus conhecimentos: /quiz

# Feedback
btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = Obrigado pelo feedback!
```

- [ ] **Step 2: Update en.ftl**

Append to `src/i18n/locales/en.ftl`:

```fluent
help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Search:</b>
    /glossary &lt;term&gt; — look up a Solana term
    /random — random term

    📂 <b>Browse:</b>
    /categories — browse 14 categories
    /category &lt;name&gt; — terms in a category

    📅 <b>Learn:</b>
    /termofday — term of the day
    /quiz — start quiz
    /favorites — saved terms
    /history — recently viewed terms

    🌐 <b>Language:</b>
    /language pt|en|es — change language

    💡 Type <code>@{ $bot_username } &lt;term&gt;</code> in any chat!

btn-prev = ← Previous
btn-next = Next →
btn-page = Page { $current }/{ $total }

random-term-header = 🎲 Random term

quiz-question = 🧠 <b>Which term is described below?</b>\n\n<i>{ $definition }</i>
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>Correct!</b> It was <b>{ $term }</b>.
quiz-wrong = ❌ <b>Wrong.</b> The answer was <b>{ $term }</b>.
quiz-no-session = ❌ No active quiz. Use /quiz to start.
quiz-no-user = ❌ User required for quiz.

btn-fav-add = ⭐ Save
btn-fav-remove = ★ Remove
favorite-added = ⭐ Saved!
favorite-removed = Removed.
favorites-header = ⭐ <b>Your favorites</b> — { $count } terms
favorites-empty = No saved terms yet. Tap ⭐ on any term card.
favorites-limit = ⚠️ Favorites limit (50) reached.

history-header = 🕐 <b>Recently viewed</b>
history-empty = You haven't looked up any terms yet.

streak-day = 🔥 { $count } day streak
streak-days = 🔥 { $count } day streak
streak-first = 🔥 First day!

did-you-mean = ❌ No results for that term.\n\nDid you mean: <code>{ $term }</code>?
btn-did-you-mean = Yes, show →

term-read-more = 🔗 <a href="{ $url }">Read Solana docs</a>

onboarding-tips =
    💡 <b>Quick tips:</b>

    🔍 Look up any term: <code>/glossary proof-of-history</code>
    📂 Browse by category: /categories
    🧠 Test your knowledge: /quiz

btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = Thanks for your feedback!
```

- [ ] **Step 3: Update es.ftl**

Append to `src/i18n/locales/es.ftl`:

```fluent
help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Buscar:</b>
    /glosario &lt;término&gt; — buscar un término Solana
    /aleatorio — término aleatorio

    📂 <b>Explorar:</b>
    /categorias — ver las 14 categorías
    /categoria &lt;nombre&gt; — términos de una categoría

    📅 <b>Aprender:</b>
    /terminodelhoy — término del día
    /quiz — iniciar quiz
    /favoritos — mis términos guardados
    /historial — términos vistos recientemente

    🌐 <b>Idioma:</b>
    /idioma pt|en|es — cambiar idioma

    💡 Escribe <code>@{ $bot_username } &lt;término&gt;</code> en cualquier chat!

btn-prev = ← Anterior
btn-next = Siguiente →
btn-page = Pág { $current }/{ $total }

random-term-header = 🎲 Término aleatorio

quiz-question = 🧠 <b>¿Qué término describe esto?</b>\n\n<i>{ $definition }</i>
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>¡Correcto!</b> Era <b>{ $term }</b>.
quiz-wrong = ❌ <b>Incorrecto.</b> La respuesta era <b>{ $term }</b>.
quiz-no-session = ❌ No hay quiz activo. Usa /quiz para comenzar.
quiz-no-user = ❌ Usuario requerido para quiz.

btn-fav-add = ⭐ Guardar
btn-fav-remove = ★ Quitar
favorite-added = ⭐ ¡Guardado!
favorite-removed = Quitado.
favorites-header = ⭐ <b>Tus favoritos</b> — { $count } términos
favorites-empty = Aún no tienes términos guardados. Toca ⭐ en cualquier término.
favorites-limit = ⚠️ Límite de 50 favoritos alcanzado.

history-header = 🕐 <b>Vistos recientemente</b>
history-empty = Aún no has consultado ningún término.

streak-day = 🔥 { $count } día seguido
streak-days = 🔥 { $count } días seguidos
streak-first = 🔥 ¡Primer día!

did-you-mean = ❌ Sin resultados para ese término.\n\n¿Quisiste decir: <code>{ $term }</code>?
btn-did-you-mean = Sí, mostrar →

term-read-more = 🔗 <a href="{ $url }">Ver documentación Solana</a>

onboarding-tips =
    💡 <b>Consejos rápidos:</b>

    🔍 Busca cualquier término: <code>/glosario proof-of-history</code>
    📂 Explora por categoría: /categorias
    🧠 Pon a prueba tus conocimientos: /quiz

btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = ¡Gracias por tu opinión!
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(i18n): add all translations for new features (pt/en/es)"
```

---

## Task 19: Final Integration Test

- [ ] **Step 1: Build and test**

```bash
cd apps/telegram-bot && npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 2: Run in dev mode (manual smoke test)**

```bash
cd apps/telegram-bot && npm run dev
```

Test checklist:
- `/start` → shows welcome + onboarding tips
- `/random` → shows random term with favorite button
- Click ⭐ → adds to favorites, shows toast
- `/favorites` → lists favorited terms
- `/quiz` → shows quiz question
- Answer quiz → shows correct/wrong + term card
- `/history` → shows viewed terms
- `/termododia` → shows streak badge
- `/glossary nonexistent` → shows "did you mean"
- `/categoria defi` → shows paginated list (if >15 terms)
- Click navigation → edits message in place
- `/help` → shows updated command list

- [ ] **Step 3: Commit final changes**

```bash
git add -A
git commit -m "feat: complete bot quality improvements v2 — pagination, quiz, favorites, history, streaks, onboarding"
```

---

## Spec Coverage Checklist

- [x] **Group 1 — Already Approved**
  - [x] 1a. Category pagination (15 per page, edit-in-place)
  - [x] 1b. Multilingual definitions via `getTermLocalized`
  - [x] 1c. Help per language (updated .ftl files)

- [x] **Group 2 — Engagement**
  - [x] 2a. Random term (`/random`)
  - [x] 2b. Quiz mode (`/quiz` with A/B/C/D)
  - [x] 2c. Favorites (⭐ Salvar/Remover, limit 50)
  - [x] 2d. Daily streak (tracked in SQLite, shown in header)

- [x] **Group 3 — Discovery**
  - [x] 3a. "Did you mean?" (Levenshtein ≤3)
  - [x] 3b. History (last 10 terms, auto-cleanup)
  - [x] 3c. External links (Solana docs for protocol terms)

- [x] **Group 4 — UX Polish**
  - [x] 4a. Onboarding tutorial (tips after welcome)
  - [x] 4b. Term feedback (👍/👎 buttons)

All requirements from spec implemented.
