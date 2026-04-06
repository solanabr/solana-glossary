// src/i18n/index.ts
import { I18n } from "@grammyjs/i18n";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { MyContext } from "../context.js";
import { getEffectiveLocale } from "../utils/locale.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const i18n = new I18n<MyContext>({
  defaultLocale: "en",
  useSession: false, // we manage language in our own session field
  directory: resolve(__dirname, "locales"),
  localeNegotiator: async (ctx) => getEffectiveLocale(ctx),
});
