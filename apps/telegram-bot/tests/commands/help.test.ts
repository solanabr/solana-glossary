import { describe, it, expect, vi } from "vitest";
import { helpCommand } from "../../src/commands/help.js";
import { createMockCtx } from "../helpers.js";

describe("helpCommand", () => {
  it("replies with help text and keyboard", async () => {
    const ctx = createMockCtx();
    await helpCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[help-message]");
    expect(opts).toMatchObject({ parse_mode: "HTML" });
    expect(opts.reply_markup).toBeDefined();
  });
});
