import { buildPathKeyboard } from "../utils/keyboard.js";
import type { MyContext } from "../context.js";

export async function pathCommand(ctx: MyContext): Promise<void> {
  await ctx.reply(ctx.t("path-message"), {
    parse_mode: "HTML",
    reply_markup: buildPathKeyboard(ctx.t.bind(ctx)),
  });
}
