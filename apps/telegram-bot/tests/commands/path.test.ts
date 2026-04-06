import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  getAllPathProgress: vi.fn(() => ({})),
  getPathProgress: vi.fn(() => undefined),
  setPathStep: vi.fn(),
  markPathCompleted: vi.fn(),
  isFavorite: vi.fn(() => false),
}));

vi.mock("../../src/db/index.js", () => ({ db: dbMock }));

vi.mock("../../src/utils/term-card.js", () => ({
  buildEnrichedTermCard: vi.fn(async () => "<b>Path Card</b>"),
}));

import { pathCommand, sendPathStep } from "../../src/commands/path.js";

describe("pathCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the learning path menu", async () => {
    const ctx = createMockCtx();
    await pathCommand(ctx);
    const [text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[path-menu-header]");
    expect(opts.reply_markup).toBeDefined();
  });

  it("marks a path as completed on the last step", async () => {
    const ctx = createMockCtx();
    await sendPathStep(ctx, "solana-basics", 7);
    expect(dbMock.setPathStep).toHaveBeenCalledWith(123, "solana-basics", 7);
    expect(dbMock.markPathCompleted).toHaveBeenCalledWith(123, "solana-basics");
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[path-completed]");
  });
});
