import { describe, it, expect, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

vi.mock("../../src/db/index.js", () => ({
  db: {
    getTop10: vi.fn(() => []),
    getUserRank: vi.fn(() => null),
    getNearbyRanks: vi.fn(() => []),
    getGroupTop10: vi.fn(() => []),
    getGroupRank: vi.fn(() => null),
  },
}));

import {
  leaderboardCommand,
  rankCommand,
} from "../../src/commands/leaderboard.js";

describe("leaderboardCommand", () => {
  it("shows empty global leaderboard state", async () => {
    const ctx = createMockCtx({ chatType: "private" });
    await leaderboardCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[leaderboard-empty]");
  });

  it("shows no streak message for rank when user has no streak", async () => {
    const ctx = createMockCtx({ chatType: "private" });
    await rankCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[rank-no-streak]");
  });
});
