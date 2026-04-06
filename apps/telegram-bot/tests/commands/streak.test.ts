import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  getOrCreateStreak: vi.fn(() => ({
    current_streak: 4,
    max_streak: 9,
    streak_freezes_used: 0,
  })),
  getUserStreakCalendar: vi.fn(() => [true, false, false]),
  maybeResetGroupStreak: vi.fn(),
  getOrCreateGroupStreak: vi.fn(() => ({ current_streak: 2, max_streak: 5 })),
  getGroupDailyParticipants: vi.fn(() => 1),
  hasGroupMembership: vi.fn(() => false),
  getGroupStreakCalendar: vi.fn(() => [true, false, true]),
}));

vi.mock("../../src/db/index.js", () => ({
  db: dbMock,
  GROUP_STREAK_THRESHOLD: 2,
}));

import { streakCommand } from "../../src/commands/streak.js";

describe("streakCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the personal streak in private chats", async () => {
    const ctx = createMockCtx({ chatType: "private" });
    await streakCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[streak-message]");
    expect(text).not.toContain("[group-streak-section-title]");
  });

  it("includes the group section in groups", async () => {
    const ctx = createMockCtx({ chatType: "group" });
    await streakCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[group-streak-section-title]");
    expect(text).toContain("[group-streak-no-participation]");
  });
});
