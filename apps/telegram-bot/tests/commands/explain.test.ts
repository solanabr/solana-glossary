import { describe, it, expect, vi } from "vitest";
import { explainCommand } from "../../src/commands/explain.js";
import { createMockCtx } from "../helpers.js";

describe("explainCommand", () => {
  it("prompts the user when there is no replied message", async () => {
    const ctx = createMockCtx({ text: "/explicar", chatType: "group" });
    await explainCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[explain-no-reply]");
  });

  it("returns a glossary card for a replied message with Solana terms", async () => {
    const ctx = createMockCtx({
      text: "/explicar",
      replyToText: "Gulf Stream and Proof of History make this fast.",
      chatType: "group",
    });
    await explainCommand(ctx);
    expect(ctx.reply).toHaveBeenCalled();
    const [summary] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(summary).toBe("[explain-summary]");
    expect(text).toContain("Proof of History");
  });

  it("recognizes common community shorthand in replied group messages", async () => {
    const ctx = createMockCtx({
      text: "/explicar",
      replyToText: "PDAs e CPIs aparecem toda hora aqui.",
      chatType: "group",
    });
    await explainCommand(ctx);
    expect(ctx.reply).toHaveBeenCalled();
    const replies = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map(
      ([text]) => text,
    );
    expect(replies[0]).toBe("[explain-summary]");
    expect(replies.some((text) => text.includes("Program Derived Address"))).toBe(
      true,
    );
    expect(
      replies.some((text) => text.includes("Cross-Program Invocation")),
    ).toBe(true);
  });

  it("accepts inline text when the command is sent without reply", async () => {
    const ctx = createMockCtx({
      text: "/explicar token2022",
      match: "token2022",
      chatType: "group",
    });
    await explainCommand(ctx);
    const replies = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map(
      ([text]) => text,
    );
    expect(replies.some((text) => text.includes("Token-2022"))).toBe(true);
  });
});
