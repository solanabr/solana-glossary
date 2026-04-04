// src/commands/start.ts
import { InlineKeyboard } from "grammy";
import { lookupTerm } from "../utils/search.js";
import { formatTermCard } from "../utils/format.js";
import { buildMainMenuKeyboard, buildTermKeyboard } from "../utils/keyboard.js";
import { IMAGES } from "../config.js";
import type { MyContext } from "../context.js";

const LANGUAGE_PICKER = `🌐 <b>Choose your language</b>
Escolha seu idioma
Elige tu idioma`;

const languageKeyboard = new InlineKeyboard()
  .text("🇧🇷 Português", "lang:pt")
  .text("🇺🇸 English", "lang:en")
  .text("🇪🇸 Español", "lang:es");

export async function startCommand(ctx: MyContext): Promise<void> {
  const deepLink = (ctx.match as string).trim();

  // Deep link: /start proof-of-history → show term directly
  if (deepLink) {
    const result = lookupTerm(deepLink);
    if (result.type === "found") {
      const userId = ctx.from?.id;
      const card = formatTermCard(
        result.term,
        ctx.t.bind(ctx),
        ctx.session.language || "en",
      );
      await ctx.reply(card, {
        parse_mode: "HTML",
        reply_markup: buildTermKeyboard(
          result.term.id,
          ctx.t.bind(ctx),
          userId,
        ),
      });
      return;
    }
  }

  // New user — no language set yet → show onboarding picker with image
  if (!ctx.session.language) {
    try {
      await ctx.replyWithPhoto(IMAGES.languagePicker, {
        caption: LANGUAGE_PICKER,
        parse_mode: "HTML",
        reply_markup: languageKeyboard,
      });
    } catch (err) {
      // Fallback to text-only if image fails
      await ctx.reply(LANGUAGE_PICKER, {
        parse_mode: "HTML",
        reply_markup: languageKeyboard,
      });
    }
    return;
  }

  // Returning user — show welcome with optional banner
  await sendWelcome(ctx);
}

export async function sendWelcome(ctx: MyContext): Promise<void> {
  const text = ctx.t("start-welcome", { bot_username: ctx.me.username });
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: buildMainMenuKeyboard(ctx.t.bind(ctx)),
  });

  // Send onboarding tips as follow-up
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
