// src/commands/start.ts
import { InlineKeyboard } from "grammy";
import { lookupTerm } from "../utils/search.js";
import { buildMainMenuKeyboard, buildTermKeyboard } from "../utils/keyboard.js";
import { IMAGES } from "../config.js";
import { db } from "../db/index.js";
import type { MyContext, SessionData } from "../context.js";
import { getEffectiveLocale } from "../utils/locale.js";
import { buildEnrichedTermCard } from "../utils/term-card.js";

function buildLanguageKeyboard(ctx: MyContext): InlineKeyboard {
  return new InlineKeyboard()
    .text(ctx.t("start-language-option-pt"), "lang:pt")
    .text(ctx.t("start-language-option-en"), "lang:en")
    .text(ctx.t("start-language-option-es"), "lang:es");
}

export async function startCommand(ctx: MyContext): Promise<void> {
  const deepLink = (ctx.match as string).trim();
  const userId = ctx.from?.id;
  const storedLanguage = userId ? await db.getLanguage(userId) : undefined;

  if (deepLink) {
    const result = lookupTerm(deepLink);
    if (result.type === "found") {
      const card = await buildEnrichedTermCard(
        result.term,
        ctx.t.bind(ctx),
        await getEffectiveLocale(ctx),
      );
      await ctx.reply(card, {
        parse_mode: "HTML",
        reply_markup: await buildTermKeyboard(
          result.term.id,
          ctx.t.bind(ctx),
          userId,
        ),
      });
      return;
    }
  }

  if (!ctx.session.language && !storedLanguage) {
    const caption = ctx.t("start-language-picker");
    const reply_markup = buildLanguageKeyboard(ctx);

    try {
      await ctx.replyWithPhoto(IMAGES.languagePicker, {
        caption,
        parse_mode: "HTML",
        reply_markup,
      });
    } catch {
      await ctx.reply(caption, {
        parse_mode: "HTML",
        reply_markup,
      });
    }
    return;
  }

  if (!ctx.session.language && storedLanguage) {
    ctx.session.language = storedLanguage as SessionData["language"];
    await ctx.i18n.useLocale(storedLanguage);
  }

  await sendWelcome(ctx);
}

export async function sendWelcome(ctx: MyContext): Promise<void> {
  const text = ctx.t("start-welcome", { bot_username: ctx.me.username });
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: buildMainMenuKeyboard(ctx.t.bind(ctx)),
  });
  await ctx.reply(ctx.t("onboarding-tips"), { parse_mode: "HTML" });
}

export async function sendMainMenu(
  ctx: MyContext,
  editMessage = false,
): Promise<void> {
  const text = ctx.t("start-welcome", { bot_username: ctx.me.username });
  const options = {
    parse_mode: "HTML" as const,
    reply_markup: buildMainMenuKeyboard(ctx.t.bind(ctx)),
  };

  if (editMessage && ctx.callbackQuery) {
    await ctx.editMessageText(text, options);
    return;
  }

  await ctx.reply(text, options);
}
