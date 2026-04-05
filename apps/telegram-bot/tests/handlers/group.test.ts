import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  getGroupLanguage: vi.fn(),
}));

vi.mock("../../src/db/index.js", () => ({
  db: dbMock,
}));

import { handleBotAdded } from "../../src/handlers/group.js";

describe("handleBotAdded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the language picker for groups without a saved language", async () => {
    dbMock.getGroupLanguage.mockReturnValueOnce(undefined);
    const ctx = createMockCtx({ chatType: "group" });
    (ctx as any).myChatMember = {
      old_chat_member: { status: "left" },
      new_chat_member: { status: "member" },
    };
    await handleBotAdded(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[group-language-picker]");
    expect(opts.reply_markup).toBeDefined();
  });

  it("shows the group welcome and menu when the group language is already saved", async () => {
    dbMock.getGroupLanguage.mockReturnValueOnce("es");
    const ctx = createMockCtx({ chatType: "group" });
    (ctx as any).i18n = { useLocale: vi.fn().mockResolvedValue(undefined) };
    (ctx as any).myChatMember = {
      old_chat_member: { status: "left" },
      new_chat_member: { status: "member" },
    };
    await handleBotAdded(ctx);
    expect(ctx.reply).toHaveBeenCalledTimes(2);
    const replies = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map(
      ([text]) => text,
    );
    expect(replies[0]).toBe("[group-welcome]");
    expect(replies[1]).toBe("[group-onboarding-tips]");
  });
});
