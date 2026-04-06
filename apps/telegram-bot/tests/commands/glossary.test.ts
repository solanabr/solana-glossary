// tests/commands/glossary.test.ts
import { describe, it, expect, vi } from "vitest";
import { glossaryCommand } from "../../src/commands/glossary.js";
import { createMockCtx } from "../helpers.js";

describe("glossaryCommand", () => {
  it("replies with a term card when term is found", async () => {
    const ctx = createMockCtx({ match: "proof-of-history" });
    await glossaryCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("Proof of History");
    expect(opts).toMatchObject({ parse_mode: "HTML" });
  });

  it("prompts for a query when no argument given", async () => {
    const ctx = createMockCtx({ match: "" });
    await glossaryCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[prompt-glossary-query]");
    expect(ctx.session.awaitingGlossaryQuery).toBe(true);
  });

  it("replies with not-found when term does not exist", async () => {
    const ctx = createMockCtx({ match: "xyznonexistent999abc" });
    await glossaryCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[term-not-found]");
  });

  it("replies with a selection keyboard when multiple results match", async () => {
    const ctx = createMockCtx({ match: "token" });
    await glossaryCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [_text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.reply_markup).toBeDefined();
  });
});
