import { InlineKeyboard } from "grammy";
import { db } from "../db/index.js";
import { buildMainMenuKeyboard } from "../utils/keyboard.js";
import type { MyContext, SessionData } from "../context.js";

function buildGroupLanguageKeyboard(ctx: MyContext): InlineKeyboard {
  return new InlineKeyboard()
    .text(ctx.t("start-language-option-pt"), "lang:pt")
    .text(ctx.t("start-language-option-en"), "lang:en")
    .text(ctx.t("start-language-option-es"), "lang:es");
}

export async function sendGroupWelcome(ctx: MyContext): Promise<void> {
  await ctx.reply(ctx.t("group-welcome", { bot_username: ctx.me.username }), {
    parse_mode: "HTML",
    reply_markup: buildMainMenuKeyboard(ctx.t.bind(ctx)),
  });
  await ctx.reply(ctx.t("group-onboarding-tips"), { parse_mode: "HTML" });
}

export async function sendGroupLanguageOnboarding(
  ctx: MyContext,
): Promise<void> {
  await ctx.reply(ctx.t("group-language-picker"), {
    parse_mode: "HTML",
    reply_markup: buildGroupLanguageKeyboard(ctx),
  });
}

export async function handleBotAdded(ctx: MyContext): Promise<void> {
  const update = ctx.myChatMember;
  if (!update) return;

  const newStatus = update.new_chat_member.status;
  const oldStatus = update.old_chat_member.status;
  const chatType = ctx.chat?.type;
  const chatId = ctx.chat?.id;

  const wasNotMember = oldStatus === "left" || oldStatus === "kicked";
  const isNowMember = newStatus === "member" || newStatus === "administrator";
  const isGroup = chatType === "group" || chatType === "supergroup";

  if (!wasNotMember || !isNowMember || !isGroup || !chatId) return;

  const groupLang = (await db.getGroupLanguage(chatId)) as
    | SessionData["language"]
    | undefined;
  if (groupLang) {
    await ctx.i18n.useLocale(groupLang);
    await sendGroupWelcome(ctx);
    return;
  }

  await sendGroupLanguageOnboarding(ctx);
}
