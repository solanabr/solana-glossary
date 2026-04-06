import { describe, it, expect, vi } from "vitest";
import { compareCommand } from "../../src/commands/compare.js";
import { createMockCtx } from "../helpers.js";

describe("compareCommand", () => {
  it("asks for refinement when one side is ambiguous", async () => {
    const ctx = createMockCtx({ match: "pos validator" });
    await compareCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[compare-ambiguous-header]");
  });
});
