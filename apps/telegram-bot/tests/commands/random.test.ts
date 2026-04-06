import { describe, it, expect, vi, afterEach } from "vitest";
import { createMockCtx } from "../helpers.js";

vi.mock("../../src/db/index.js", () => ({
  db: {
    addHistory: vi.fn(),
    getGroupLanguage: vi.fn(() => "es"),
  },
}));

const buildEnrichedTermCardMock = vi.hoisted(() =>
  vi.fn(async (term: { term: string }) => term.term),
);

vi.mock("../../src/utils/term-card.js", () => ({
  buildEnrichedTermCard: buildEnrichedTermCardMock,
}));

import { randomTermCommand } from "../../src/commands/random.js";

describe("randomTermCommand", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("replies with a random term card", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const ctx = createMockCtx({ chatType: "group", sessionLanguage: undefined, languageCode: "en" });
    await randomTermCommand(ctx);
    const [text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[random-term-header]");
    expect(opts).toMatchObject({ parse_mode: "HTML" });
    expect(opts.reply_markup).toBeDefined();
    expect(buildEnrichedTermCardMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Function),
      "es",
    );
  });
});
