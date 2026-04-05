// src/i18n/index.ts
import { I18n } from "@grammyjs/i18n";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { MyContext } from "../context.js";
import { db } from "../db/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const i18n = new I18n<MyContext>({
  defaultLocale: "en",
  useSession: false, // we manage language in our own session field
  directory: resolve(__dirname, "locales"),
  localeNegotiator: (ctx) => {
    const isGroup =
      ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
    if (isGroup && ctx.chat?.id) {
      const groupLang = db.getGroupLanguage(ctx.chat.id);
      if (groupLang) return groupLang;
    }

    // 1. User's explicit choice stored in our session
    const sessionLang = ctx.session?.language;
    if (sessionLang) return sessionLang;

    // 2. Telegram client language code
    const tgLang = ctx.from?.language_code ?? "";
    if (tgLang.startsWith("pt")) return "pt";
    if (tgLang.startsWith("es")) return "es";

    // 3. Default to English
    return "en";
  },
});
