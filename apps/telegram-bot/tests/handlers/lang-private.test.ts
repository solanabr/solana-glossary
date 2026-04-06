import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  setLanguage: vi.fn(),
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

import { handleLangCallback } from "../../src/handlers/callbacks.js";

describe("handleLangCallback in private chats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the language for the user and sends the private onboarding", async () => {
    const ctx = createMockCtx({ chatType: "private", match: "lang:es" });
    await handleLangCallback(ctx);
    expect(dbMock.setLanguage).toHaveBeenCalledWith(123, "es");
    expect(ctx.session.language).toBe("es");
    const replies = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map(
      ([text]) => text,
    );
    expect(replies).toEqual(["[start-welcome]", "[onboarding-tips]"]);
  });
});
