import { db } from "../db/index.js";
import type { MyContext, SessionData } from "../context.js";

const VALID_LANGUAGES = ["pt", "en", "es"] as const;
type Lang = (typeof VALID_LANGUAGES)[number];

function isValidLang(value: string): value is Lang {
  return (VALID_LANGUAGES as readonly string[]).includes(value);
}

export async function languageCommand(ctx: MyContext): Promise<void> {
  const input = (ctx.match as string).trim().toLowerCase();
  const userId = ctx.from?.id;

  if (!input || !isValidLang(input)) {
    await ctx.reply(ctx.t("language-invalid"), { parse_mode: "HTML" });
    return;
  }

  ctx.session.language = input as SessionData["language"];
  if (userId) {
    await db.setLanguage(userId, input);
  }
  await ctx.i18n.useLocale(input);
  await ctx.reply(ctx.t("language-changed-confirmation"), {
    parse_mode: "HTML",
  });
}
