// src/context.ts
import { Context, SessionFlavor } from "grammy";
import { I18nFlavor } from "@grammyjs/i18n";

export interface SessionData {
  /** User's chosen language. undefined = auto-detect from Telegram */
  language: "pt" | "en" | "es" | undefined;
  awaitingGlossaryQuery?: boolean;
}

export type MyContext = Context & SessionFlavor<SessionData> & I18nFlavor;
