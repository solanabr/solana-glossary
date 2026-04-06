import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  getGroupLanguage: vi.fn(),
  getOrCreateStreak: vi.fn(() => ({
    current_streak: 0,
    max_streak: 0,
    streak_freezes_used: 0,
  })),
  getUserStreakCalendar: vi.fn(() => [false, false, false, false, false, false, false]),
  getTop10: vi.fn(() => []),
}));

vi.mock("../../src/db/index.js", () => ({
  db: dbMock,
  GROUP_STREAK_THRESHOLD: 2,
}));

vi.mock("../../src/glossary/index.js", () => ({
  allTerms: [],
  getTerm: vi.fn(),
  getTermsByCategory: vi.fn(() => []),
  getCategories: vi.fn(() => []),
}));

vi.mock("../../src/utils/term-card.js", () => ({
  buildEnrichedTermCard: vi.fn(),
}));

import { handleMenuCallback } from "../../src/handlers/callbacks.js";
import {
  buildMainMenuKeyboard,
  buildProgressMenuKeyboard,
  buildTipsKeyboard,
} from "../../src/utils/keyboard.js";

describe("menu callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the progress submenu", async () => {
    const ctx = createMockCtx({ match: "menu:progress" });
    await handleMenuCallback(ctx);
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
    const [text, opts] = (ctx.editMessageText as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[progress-menu-title]");
    expect(opts.reply_markup).toBeDefined();
  });

  it("opens the library submenu", async () => {
    const ctx = createMockCtx({ match: "menu:library" });
    await handleMenuCallback(ctx);
    expect(ctx.editMessageText).toHaveBeenCalledOnce();
    const [text, opts] = (ctx.editMessageText as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[library-menu-title]");
    expect(opts.reply_markup).toBeDefined();
  });

  it("keeps glossary as the first menu action", () => {
    const keyboard = buildMainMenuKeyboard(((key: string) => key) as any);
    expect((keyboard as any).inline_keyboard[0][0].text).toBe("menu-glossary");
  });

  it("uses menu callbacks for progress actions", () => {
    const keyboard = buildProgressMenuKeyboard(((key: string) => key) as any);
    expect((keyboard as any).inline_keyboard[0][0].callback_data).toBe(
      "menu:streak",
    );
    expect((keyboard as any).inline_keyboard[0][1].callback_data).toBe(
      "menu:leaderboard",
    );
  });

  it("keeps glossary as the first help action", () => {
    const keyboard = buildTipsKeyboard(((key: string) => key) as any);
    expect((keyboard as any).inline_keyboard[0][0].callback_data).toBe(
      "tips:glossary",
    );
    expect((keyboard as any).inline_keyboard[0][1].callback_data).toBe(
      "tips:explain",
    );
  });

  it("routes menu explain to the real command flow instead of tips", async () => {
    const ctx = createMockCtx({ match: "menu:explain", chatType: "private" });
    await handleMenuCallback(ctx);
    expect(ctx.editMessageText).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[explain-no-reply]");
  });

  it("routes menu streak to the real command flow", async () => {
    const ctx = createMockCtx({ match: "menu:streak" });
    await handleMenuCallback(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[streak-message]");
  });

  it("routes menu leaderboard to the real command flow", async () => {
    const ctx = createMockCtx({ match: "menu:leaderboard" });
    await handleMenuCallback(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[leaderboard-empty]");
  });
});
