import { describe, it, expect, vi, afterEach } from "vitest";
import { createMockCtx } from "../helpers.js";

vi.mock("../../src/db/index.js", () => ({
  db: {
    addHistory: vi.fn(),
  },
}));

vi.mock("../../src/utils/term-card.js", () => ({
  buildEnrichedTermCard: vi.fn(async (term: { term: string }) => term.term),
}));

import { randomTermCommand } from "../../src/commands/random.js";

describe("randomTermCommand", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("replies with a random term card", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const ctx = createMockCtx();
    await randomTermCommand(ctx);
    const [text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[random-term-header]");
    expect(opts).toMatchObject({ parse_mode: "HTML" });
    expect(opts.reply_markup).toBeDefined();
  });
});
