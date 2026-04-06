import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  db: {
    getTop10: vi.fn(() => []),
    getUserRank: vi.fn(() => null),
    getNearbyRanks: vi.fn(() => []),
    getGroupTop10: vi.fn(() => []),
    getGroupRank: vi.fn(() => null),
  },
}));

vi.mock("../../src/db/index.js", () => dbMock);

import {
  leaderboardCommand,
  rankCommand,
} from "../../src/commands/leaderboard.js";

describe("leaderboardCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.db.getTop10.mockReturnValue([]);
    dbMock.db.getUserRank.mockReturnValue(null);
    dbMock.db.getNearbyRanks.mockReturnValue([]);
    dbMock.db.getGroupTop10.mockReturnValue([]);
    dbMock.db.getGroupRank.mockReturnValue(null);
  });

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

  it("renders rank details and nearby competitors with HTML mode", async () => {
    dbMock.db.getUserRank.mockReturnValue({
      rank: 3,
      total: 25,
      max_streak: 9,
    });
    dbMock.db.getNearbyRanks.mockReturnValue([
      { rank: 2, user_id: 222, max_streak: 12, isCurrentUser: false },
      { rank: 3, user_id: 123, max_streak: 9, isCurrentUser: true },
      { rank: 4, user_id: 333, max_streak: 8, isCurrentUser: false },
    ]);

    const ctx = createMockCtx({ chatType: "private" });
    ctx.t = vi.fn((key: string, params?: Record<string, unknown>) => {
      switch (key) {
        case "rank-position":
          return `rank:${params?.rank}/${params?.total}`;
        case "rank-max-streak":
          return `best:${params?.max}`;
        case "rank-nearby":
          return "nearby";
        case "rank-entry-you":
          return `you:${params?.streak}`;
        case "rank-entry-simple":
          return `${params?.rank}:${params?.streak}`;
        default:
          return `[${key}]`;
      }
    }) as typeof ctx.t;

    await rankCommand(ctx);

    expect(ctx.t).toHaveBeenCalledWith("rank-max-streak", { max: 9 });
    expect(ctx.t).toHaveBeenCalledWith("rank-entry-you", { streak: 9 });

    const [text, options] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("rank:3/25\nbest:9\n\nnearby\n2.:12\nyou:9\n4.:8");
    expect(options).toEqual({ parse_mode: "HTML" });
  });

  it("falls back to internal-error when rank data is invalid for translation", async () => {
    dbMock.db.getUserRank.mockReturnValue({
      rank: 1,
      total: 10,
      max_streak: { value: 7 },
    });
    dbMock.db.getNearbyRanks.mockReturnValue([]);

    const ctx = createMockCtx({ chatType: "private" });

    await expect(rankCommand(ctx)).resolves.toBeUndefined();

    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[internal-error]");
  });
});
