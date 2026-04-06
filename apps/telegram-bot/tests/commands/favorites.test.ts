import { describe, it, expect, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

vi.mock("../../src/db/index.js", () => ({
  db: {
    getFavorites: vi.fn(() => []),
  },
}));

import { favoritesCommand } from "../../src/commands/favorites.js";

describe("favoritesCommand", () => {
  it("shows empty state when there are no favorites", async () => {
    const ctx = createMockCtx();
    await favoritesCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[favorites-empty]");
  });
});
