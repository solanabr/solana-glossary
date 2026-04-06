import { db } from "../db/index.js";
import type { MyContext, SessionData } from "../context.js";

export type SupportedLocale = NonNullable<SessionData["language"]>;

export async function getEffectiveLocale(
  ctx: Pick<MyContext, "chat" | "from" | "session">,
): Promise<SupportedLocale> {
  const isGroup =
    ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";

  if (isGroup && ctx.chat?.id) {
    const groupLang =
      typeof db.getGroupLanguage === "function"
        ? await db.getGroupLanguage(ctx.chat.id)
        : undefined;
    if (isSupportedLocale(groupLang)) return groupLang;
  }

  const sessionLang = ctx.session?.language;
  if (isSupportedLocale(sessionLang)) return sessionLang;

  const userId = ctx.from?.id;
  if (userId) {
    const userLang =
      typeof db.getLanguage === "function"
        ? await db.getLanguage(userId)
        : undefined;
    if (isSupportedLocale(userLang)) return userLang;
  }

  const tgLang = ctx.from?.language_code ?? "";
  if (tgLang.startsWith("pt")) return "pt";
  if (tgLang.startsWith("es")) return "es";

  return "en";
}

function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return value === "pt" || value === "en" || value === "es";
}
