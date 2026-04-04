// src/bot.ts
import { Bot, session } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";
import { limit } from "@grammyjs/ratelimiter";
import { config } from "./config.js";
import { i18n } from "./i18n/index.js";
import { db } from "./db/index.js";
import type { MyContext, SessionData } from "./context.js";

// Commands
import { startCommand } from "./commands/start.js";
import { helpCommand } from "./commands/help.js";
import { languageCommand } from "./commands/language.js";
import { glossaryCommand } from "./commands/glossary.js";
import { categoriesCommand, categoryCommand } from "./commands/categories.js";
import { pathCommand } from "./commands/path.js";
import { dailyTermCommand } from "./commands/daily.js";
import { randomTermCommand } from "./commands/random.js";
import { quizCommand } from "./commands/quiz.js";
import { favoritesCommand } from "./commands/favorites.js";
import { historyCommand } from "./commands/history.js";
import { streakCommand } from "./commands/streak.js";
import { leaderboardCommand, rankCommand } from "./commands/leaderboard.js";

// Handlers
import {
  handleLangCallback,
  handleRelatedCallback,
  handleCategoryCallback,
  handleSelectCallback,
  handleBrowseCatCallback,
  handleCatPageCallback,
  handleNoopCallback,
  handleMenuCallback,
  handleFavAddCallback,
  handleFavRemoveCallback,
  handleQuizAnswerCallback,
  handleQuizRetryCallback,
  handleQuizResultCallback,
  handleFeedbackCallback,
} from "./handlers/callbacks.js";
import { handleInlineQuery } from "./handlers/inline.js";
import { handleTextMessage } from "./handlers/text.js";

export const bot = new Bot<MyContext>(config.botToken);

// ── Middleware pipeline (order matters) ──────────────────────────────────────

// 1. Auto-retry: handles Telegram 429 (flood) and 500+ errors automatically
bot.api.config.use(autoRetry());

// 2. Sessions: keyed by user ID so inline queries (no chat) also work
bot.use(
  session<SessionData, MyContext>({
    initial: (): SessionData => ({
      language: undefined,
      awaitingGlossaryQuery: false,
    }),
    getSessionKey: (ctx) => ctx.from?.id.toString(),
  }),
);

// 3. i18n: locale detection from session → language_code → "en"
bot.use(i18n);

// 4. Rate limiter: 3 requests per 2 seconds per user (after i18n so ctx.t is available)
bot.use(
  limit({
    timeFrame: 2000,
    limit: 3,
    onLimitExceeded: async (ctx) => {
      await ctx?.reply(ctx.t("rate-limit"), { parse_mode: "HTML" });
    },
    keyGenerator: (ctx) => ctx.from?.id.toString() ?? "anonymous",
  }),
);

// 5. Save user first_name for leaderboard
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  const firstName = ctx.from?.first_name;
  if (userId && firstName) {
    db.setFirstName(userId, firstName);
  }
  return next();
});

// ── Commands ──────────────────────────────────────────────────────────────────

bot.command("start", startCommand);
bot.command("help", helpCommand);

bot.command(["idioma", "language"], languageCommand);
bot.command(["glossario", "glossary", "glosario"], glossaryCommand);
bot.command(["path", "trilha"], pathCommand);
bot.command(["categorias", "categories"], categoriesCommand);
bot.command(["categoria", "category"], categoryCommand);
bot.command(["termododia", "termofday", "terminodelhoy"], dailyTermCommand);
bot.command(["aleatorio", "random"], randomTermCommand);
bot.command(["quiz"], quizCommand);
bot.command(["favoritos", "favorites"], favoritesCommand);
bot.command(["historico", "history", "historial"], historyCommand);
bot.command(["streak", "sequencia"], streakCommand);
bot.command(["leaderboard", "ranking"], leaderboardCommand);
bot.command(["rank", "posicao"], rankCommand);

// ── Callback queries ──────────────────────────────────────────────────────────

bot.callbackQuery(/^lang:/, handleLangCallback);
bot.callbackQuery(/^related:/, handleRelatedCallback);
bot.callbackQuery(/^category:/, handleCategoryCallback);
bot.callbackQuery(/^select:/, handleSelectCallback);
bot.callbackQuery(/^browse_cat:/, handleBrowseCatCallback);
bot.callbackQuery(/^cat_page:/, handleCatPageCallback);
bot.callbackQuery(/^noop:/, handleNoopCallback);
bot.callbackQuery(/^menu:/, handleMenuCallback);
bot.callbackQuery(/^fav_add:/, handleFavAddCallback);
bot.callbackQuery(/^fav_remove:/, handleFavRemoveCallback);
bot.callbackQuery(/^quiz_answer:/, handleQuizAnswerCallback);
bot.callbackQuery(/^quiz_retry$/, handleQuizRetryCallback);
bot.callbackQuery(/^quiz_result$/, handleQuizResultCallback);
bot.callbackQuery(/^feedback:/, handleFeedbackCallback);

// ── Inline mode ───────────────────────────────────────────────────────────────

bot.on("inline_query", handleInlineQuery);

// ── Free text in DMs ──────────────────────────────────────────────────────────

bot.on("message:text", handleTextMessage);

// ── Error boundary ────────────────────────────────────────────────────────────

bot.catch((err) => {
  const update = err.ctx?.update;
  const updateType = update
    ? Object.keys(update).find((k) => k !== "update_id")
    : "unknown";
  console.error("Bot error:", err.message, {
    update_id: update?.update_id,
    type: updateType,
  });
  err.ctx?.reply(err.ctx.t("internal-error")).catch(() => {});
});
