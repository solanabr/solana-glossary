// src/commands/help.ts
import type { MyContext } from "../context.js";

export async function helpCommand(ctx: MyContext): Promise<void> {
  await ctx.reply(ctx.t("help-message", { bot_username: ctx.me.username }), {
    parse_mode: "HTML",
  });
}
