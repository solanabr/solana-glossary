// src/handlers/callbacks.ts
import { getTerm, getTermsByCategory } from "@stbr/solana-glossary";
import type { Category } from "@stbr/solana-glossary";
import { formatTermCard, formatTermList, formatCategoryName } from "../utils/format.js";
import { buildTermKeyboard } from "../utils/keyboard.js";
import { sendWelcome } from "../commands/start.js";
import { sendCategoryTerms } from "../commands/categories.js";
import type { MyContext, SessionData } from "../context.js";

/** Strip HTML tags for use in plain-text callback popups */
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// ── Language onboarding ───────────────────────────────────────────────────────

export async function handleLangCallback(ctx: MyContext): Promise<void> {
  const data = ctx.callbackQuery?.data ?? "";
  const lang = data.slice("lang:".length) as SessionData["language"];

  ctx.session.language = lang;
  await ctx.answerCallbackQuery();

  // Remove the language picker message and show welcome
  await ctx.deleteMessage().catch(() => { });
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
    .map((id) => getTerm(id))
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
  await sendCategoryTerms(ctx, term.category);
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

  const card = formatTermCard(term, ctx.t.bind(ctx));
  await ctx.answerCallbackQuery();
  await ctx.reply(card, {
    parse_mode: "HTML",
    reply_markup: buildTermKeyboard(termId, ctx.t.bind(ctx)),
  });
}

// ── Category browser ──────────────────────────────────────────────────────────

export async function handleBrowseCatCallback(ctx: MyContext): Promise<void> {
  const category = (ctx.callbackQuery?.data ?? "").slice("browse_cat:".length) as Category;
  await ctx.answerCallbackQuery();
  await sendCategoryTerms(ctx, category);
}
