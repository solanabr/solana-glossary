// tests/handlers/text.test.ts
import { describe, it, expect, vi } from "vitest";
import { handleTextMessage } from "../../src/handlers/text.js";
import { createMockCtx } from "../helpers.js";

describe("handleTextMessage", () => {
  it("replies with a term card in DMs when term is found", async () => {
    const ctx = createMockCtx({
      text: "proof-of-history",
      chatType: "private",
    });
    await handleTextMessage(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("Proof of History");
  });

  it("ignores messages in group chats", async () => {
    const ctx = createMockCtx({ text: "proof-of-history", chatType: "group" });
    await handleTextMessage(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("ignores messages in supergroups", async () => {
    const ctx = createMockCtx({
      text: "proof-of-history",
      chatType: "supergroup",
    });
    await handleTextMessage(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("replies with not-found for unknown terms in DMs", async () => {
    const ctx = createMockCtx({
      text: "xyznonexistent999abc",
      chatType: "private",
    });
    await handleTextMessage(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[term-not-found]");
  });

  it("does nothing for empty text", async () => {
    const ctx = createMockCtx({ text: "", chatType: "private" });
    await handleTextMessage(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
