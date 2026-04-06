import { describe, it, expect, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

vi.mock("../../src/db/index.js", () => ({
  db: {
    getHistory: vi.fn(() => []),
  },
}));

import { historyCommand } from "../../src/commands/history.js";

describe("historyCommand", () => {
  it("shows empty state when there is no history", async () => {
    const ctx = createMockCtx();
    await historyCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[history-empty]");
  });
});
