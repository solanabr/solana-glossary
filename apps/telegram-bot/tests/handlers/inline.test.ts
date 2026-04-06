import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockCtx } from "../helpers.js";

const searchMock = vi.hoisted(() => ({
  lookupTerm: vi.fn(),
  getRandomTerms: vi.fn(),
  findClosest: vi.fn(),
}));

vi.mock("../../src/utils/search.js", () => searchMock);
vi.mock("../../src/utils/format.js", () => ({
  formatTermCard: vi.fn(() => "<b>Inline Card</b>"),
}));

import { handleInlineQuery } from "../../src/handlers/inline.js";

describe("handleInlineQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows random inspiration for empty queries", async () => {
    searchMock.getRandomTerms.mockReturnValueOnce([
      {
        id: "poh",
        term: "Proof of History",
        definition: "A long enough definition.",
      },
    ]);
    const ctx = createMockCtx({ match: "" });
    await handleInlineQuery(ctx);
    const [results, opts] = (
      ctx.answerInlineQuery as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(results).toHaveLength(1);
    expect(opts).toMatchObject({ cache_time: 0, is_personal: true });
  });

  it("falls back to the closest term when the query is not found", async () => {
    searchMock.lookupTerm.mockReturnValueOnce({ type: "not-found" });
    searchMock.findClosest.mockReturnValueOnce({
      id: "poh",
      term: "Proof of History",
      definition: "A long enough definition.",
    });
    const ctx = createMockCtx({ match: "prrof history" });
    await handleInlineQuery(ctx);
    const [results] = (ctx.answerInlineQuery as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(results).toHaveLength(1);
  });
});
