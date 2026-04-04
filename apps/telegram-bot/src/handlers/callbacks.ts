// src/handlers/callbacks.ts
import {
  getTerm,
  getTermsByCategory,
  getCategories,
} from "../glossary/index.js";
import type { Category } from "../glossary/index.js";
import { InlineKeyboard } from "grammy";
import {
  formatTermCard,
  formatTermList,
  formatCategoryName,
} from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { sendMainMenu, sendWelcome } from "../commands/start.js";
import { sendCategoriesMenu, sendCategoryTerms } from "../commands/categories.js";
import { glossaryCommand } from "../commands/glossary.js";
import { randomTermCommand } from "../commands/random.js";
import { quizCommand } from "../commands/quiz.js";
import { helpCommand } from "../commands/help.js";
import { pathCommand } from "../commands/path.js";
import { db } from "../db/index.js";
import type { MyContext, SessionData } from "../context.js";

/** Strip HTML tags for use in plain-text callback popups */
function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// ── Language onboarding ───────────────────────────────────────────────────────

export async function handleLangCallback(ctx: MyContext): Promise<void> {
  const data = ctx.callbackQuery?.data ?? "";
  const lang = data.slice("lang:".length) as SessionData["language"];

  ctx.session.language = lang;
  await ctx.i18n.useLocale(lang!);
  await ctx.answerCallbackQuery();

  // Remove the language picker message and show welcome
  await ctx.deleteMessage().catch(() => {});
  await sendWelcome(ctx);
}

// ── Term navigation ───────────────────────────────────────────────────────────

export async function handleRelatedCallback(ctx: MyContext): Promise<void> {
  const termId = (ctx.callbackQuery?.data ?? "").slice("related:".length);
  const term = getTerm(termId);

  if (!term || !term.related || term.related.length === 0) {
    await ctx.answerCallbackQuery({
      text: stripHtml(ctx.t("term-not-found", { query: termId })),
      show_alert: true,
    });
    return;
  }

  const relatedTerms = term.related
    .map((id: string) => getTerm(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .slice(0, 8);

  const header = `📂 <b>${ctx.t("term-related")}: ${term.term}</b>`;
  const text = formatTermList(relatedTerms, header);

  await ctx.answerCallbackQuery();
  await ctx.reply(text, { parse_mode: "HTML" });
}

export async function handleCategoryCallback(ctx: MyContext): Promise<void> {
  const termId = (ctx.callbackQuery?.data ?? "").slice("category:".length);
  const term = getTerm(termId);

  if (!term) {
    await ctx.answerCallbackQuery({
      text: stripHtml(ctx.t("term-not-found", { query: termId })),
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery();
  await sendCategoryTerms(ctx, term.category, 1, false);
}

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

  const card = formatTermCard(
    term,
    ctx.t.bind(ctx),
    ctx.session.language || "en",
  );
  await ctx.answerCallbackQuery();
  await ctx.reply(card, {
    parse_mode: "HTML",
    reply_markup: buildTermKeyboard(termId, ctx.t.bind(ctx), userId),
  });
}

// ── Category browser ──────────────────────────────────────────────────────────

export async function handleBrowseCatCallback(ctx: MyContext): Promise<void> {
  const category = (ctx.callbackQuery?.data ?? "").slice(
    "browse_cat:".length,
  ) as Category;

  const categories = getCategories();
  if (!categories.includes(category)) {
    await ctx.answerCallbackQuery({
      text: ctx.t("category-not-found", { name: category }),
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery();
  await sendCategoryTerms(ctx, category, 1, true);
}

// ── Category pagination ─────────────────────────────────────────────────────

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
    await ctx.answerCallbackQuery({
      text: ctx.t("category-not-found", { name: category }),
      show_alert: true,
    });
    return;
  }

  await sendCategoryTerms(ctx, category, page, true);
  await ctx.answerCallbackQuery();
}

export async function handleNoopCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery();
}

export async function handleMenuCallback(ctx: MyContext): Promise<void> {
  const action = (ctx.callbackQuery?.data ?? "").slice("menu:".length);

  await ctx.answerCallbackQuery();

  switch (action) {
    case "main":
      ctx.session.awaitingGlossaryQuery = false;
      await sendMainMenu(ctx, true);
      return;
    case "categories":
      ctx.session.awaitingGlossaryQuery = false;
      await sendCategoriesMenu(ctx, true);
      return;
    case "glossary":
      ctx.match = "";
      await glossaryCommand(ctx);
      return;
    case "random":
      ctx.session.awaitingGlossaryQuery = false;
      await randomTermCommand(ctx);
      return;
    case "quiz":
      ctx.session.awaitingGlossaryQuery = false;
      await quizCommand(ctx);
      return;
    case "help":
      ctx.session.awaitingGlossaryQuery = false;
      await helpCommand(ctx);
      return;
    case "path":
      ctx.session.awaitingGlossaryQuery = false;
      await pathCommand(ctx);
      return;
    default:
      await ctx.reply(ctx.t("internal-error"));
  }
}

// ── Favorites ────────────────────────────────────────────────────────────────

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
    await ctx.answerCallbackQuery({
      text: ctx.t("favorites-limit"),
      show_alert: true,
    });
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

// ── Quiz ────────────────────────────────────────────────────────────────────

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
    // Increment streak on correct answer
    const streak = db.incrementStreak(userId);

    // Send appropriate message based on streak state
    if (streak.isNewRecord) {
      await ctx.reply(
        ctx.t("quiz-correct-new-record", {
          term: correctTerm?.term ?? "",
          max: streak.max,
        }),
        {
          parse_mode: "HTML",
        },
      );
    } else if (streak.current > 1) {
      await ctx.reply(
        ctx.t("quiz-correct-with-streak", {
          term: correctTerm?.term ?? "",
          current: streak.current,
        }),
        {
          parse_mode: "HTML",
        },
      );
    } else {
      await ctx.reply(
        ctx.t("quiz-correct", { term: correctTerm?.term ?? "" }),
        {
          parse_mode: "HTML",
        },
      );
    }

    // Schedule streak warning for tomorrow (2h before midnight)
    const { scheduleStreakWarning } =
      await import("../scheduler/notifications.js");
    scheduleStreakWarning(userId);

    // Show the term card
    if (correctTerm) {
      const card = formatTermCard(
        correctTerm,
        ctx.t.bind(ctx),
        ctx.session.language || "en",
      );
      await ctx.reply(card, {
        parse_mode: "HTML",
        reply_markup: buildTermKeyboard(
          correctTerm.id,
          ctx.t.bind(ctx),
          userId,
        ),
      });
    }
    // Clear session
    db.clearQuizSession(userId);
  } else {
    // Wrong answer - offer options to retry or see result
    const keyboard = new InlineKeyboard()
      .text(ctx.t("quiz-btn-retry"), "quiz_retry")
      .text(ctx.t("quiz-btn-result"), "quiz_result");

    await ctx.reply(ctx.t("quiz-wrong-retry"), {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
    // Don't clear session yet - user might want to retry
  }

  await ctx.answerCallbackQuery();
}

export async function handleQuizRetryCallback(ctx: MyContext): Promise<void> {
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

  // Get term and rebuild question
  const targetTerm = getTerm(session.termId);
  if (!targetTerm) {
    await ctx.answerCallbackQuery({
      text: ctx.t("internal-error"),
      show_alert: true,
    });
    return;
  }

  // Rebuild options from session
  const options = session.options
    .map((id) => getTerm(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  // Show question again
  const definitionSnippet = targetTerm.definition;
  const question = ctx.t("quiz-question", { definition: definitionSnippet });

  const keyboard = new InlineKeyboard()
    .text(
      ctx.t("quiz-option-a", { term: options[0]?.term ?? "" }),
      `quiz_answer:0`,
    )
    .row()
    .text(
      ctx.t("quiz-option-b", { term: options[1]?.term ?? "" }),
      `quiz_answer:1`,
    )
    .row()
    .text(
      ctx.t("quiz-option-c", { term: options[2]?.term ?? "" }),
      `quiz_answer:2`,
    )
    .row()
    .text(
      ctx.t("quiz-option-d", { term: options[3]?.term ?? "" }),
      `quiz_answer:3`,
    );

  await ctx.reply(ctx.t("quiz-try-again"), { parse_mode: "HTML" });
  await ctx.reply(question, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });

  await ctx.answerCallbackQuery();
}

export async function handleQuizResultCallback(ctx: MyContext): Promise<void> {
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

  const correctTerm = getTerm(session.options[session.correctIdx]);

  // Show the correct answer
  await ctx.reply(ctx.t("quiz-result", { term: correctTerm?.term ?? "" }), {
    parse_mode: "HTML",
  });

  // Show the term card
  if (correctTerm) {
    const card = formatTermCard(
      correctTerm,
      ctx.t.bind(ctx),
      ctx.session.language || "en",
    );
    await ctx.reply(card, {
      parse_mode: "HTML",
      reply_markup: buildTermKeyboard(correctTerm.id, ctx.t.bind(ctx), userId),
    });
  }

  // Clear session
  db.clearQuizSession(userId);
  await ctx.answerCallbackQuery();
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export async function handleFeedbackCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery({ text: ctx.t("feedback-thanks") });
}
