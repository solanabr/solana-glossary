import { describe, it, expect, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

vi.mock("../../src/db/index.js", () => ({
  db: {
    viewDailyTerm: vi.fn(() => ({ streak: 2, isNew: false })),
  },
}));

vi.mock("../../src/utils/term-card.js", () => ({
  buildEnrichedTermCard: vi.fn(async () => "<b>Daily Card</b>"),
}));

import { dailyTermCommand, getDailyTerm } from "../../src/commands/daily.js";

describe("dailyTermCommand", () => {
  it("uses the bot day consistently for the term of the day", () => {
    const early = getDailyTerm(new Date("2026-04-05T01:00:00-03:00"));
    const late = getDailyTerm(new Date("2026-04-05T23:00:00-03:00"));
    expect(early.id).toBe(late.id);
  });

  it("replies with the daily card and streak header", async () => {
    const ctx = createMockCtx();
    await dailyTermCommand(ctx);
    const [text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[daily-term-header]");
    expect(text).toContain("[streak-days]");
    expect(text).toContain("<b>Daily Card</b>");
    expect(opts).toMatchObject({ parse_mode: "HTML" });
    expect(opts.reply_markup).toBeDefined();
  });
});
