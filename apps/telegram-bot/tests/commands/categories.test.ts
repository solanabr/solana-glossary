import { describe, it, expect, vi } from "vitest";
import {
  categoriesCommand,
  categoryCommand,
} from "../../src/commands/categories.js";
import { createMockCtx } from "../helpers.js";

describe("categoriesCommand", () => {
  it("shows the categories menu", async () => {
    const ctx = createMockCtx();
    await categoriesCommand(ctx);
    const [text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[categories-choose]");
    expect(opts.reply_markup).toBeDefined();
  });

  it("shows usage for category without argument", async () => {
    const ctx = createMockCtx({ match: "" });
    await categoryCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[usage-category]");
  });

  it("rejects an invalid category", async () => {
    const ctx = createMockCtx({ match: "invalid-cat" });
    await categoryCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[category-not-found]");
  });
});
