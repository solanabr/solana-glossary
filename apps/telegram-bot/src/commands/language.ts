// src/commands/language.ts
import type { MyContext, SessionData } from "../context.js";

const VALID_LANGUAGES = ["pt", "en", "es"] as const;
type Lang = (typeof VALID_LANGUAGES)[number];

function isValidLang(value: string): value is Lang {
  return (VALID_LANGUAGES as readonly string[]).includes(value);
}

export async function languageCommand(ctx: MyContext): Promise<void> {
  const input = (ctx.match as string).trim().toLowerCase();

  if (!input || !isValidLang(input)) {
    await ctx.reply(ctx.t("language-invalid"), { parse_mode: "HTML" });
    return;
  }

  ctx.session.language = input as SessionData["language"];

  // Confirm in the chosen language directly (localeNegotiator picks it up next request)
  const confirmations: Record<string, string> = {
    pt: `✅ Idioma alterado para português.\n\nℹ️ <i>O menu de comandos (/) continua no idioma do seu app Telegram. Use /help para ver todos os comandos em português.</i>`,
    en: `✅ Language changed to English.\n\nℹ️ <i>The command menu (/) follows your Telegram app language. Use /help to see all commands in English.</i>`,
    es: `✅ Idioma cambiado a español.\n\nℹ️ <i>El menú de comandos (/) sigue el idioma de tu app de Telegram. Usa /help para ver todos los comandos en español.</i>`,
  };
  await ctx.reply(confirmations[input], { parse_mode: "HTML" });
}
