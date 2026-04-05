import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  setGroupLanguage: vi.fn(),
}));

vi.mock("../../src/db/index.js", () => ({
  db: dbMock,
  GROUP_STREAK_THRESHOLD: 2,
}));

vi.mock("../../src/glossary/index.js", () => ({
  getTerm: vi.fn(),
  getTermsByCategory: vi.fn(() => []),
  getCategories: vi.fn(() => []),
}));

vi.mock("../../src/utils/term-card.js", () => ({
  buildEnrichedTermCard: vi.fn(),
}));

import { handleLangCallback } from "../../src/handlers/callbacks.js";

describe("handleLangCallback in groups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the language for the group and sends group onboarding", async () => {
    const ctx = createMockCtx({ chatType: "group", match: "lang:pt" });
    (ctx as any).i18n = { useLocale: vi.fn().mockResolvedValue(undefined) };
    await handleLangCallback(ctx);
    expect(dbMock.setGroupLanguage).toHaveBeenCalledWith(456, "pt");
    expect(ctx.deleteMessage).toHaveBeenCalledOnce();
    expect(ctx.reply).toHaveBeenCalledTimes(3);
    const replies = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map(
      ([text]) => text,
    );
    expect(replies[0]).toBe("[group-language-changed]");
    expect(replies[1]).toBe("[group-welcome]");
    expect(replies[2]).toBe("[group-onboarding-tips]");
  });
});
