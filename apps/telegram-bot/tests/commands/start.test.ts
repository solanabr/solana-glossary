import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockCtx } from "../helpers.js";

const lookupTermMock = vi.hoisted(() =>
  vi.fn(() => ({ type: "not-found" } as any)),
);
const dbMock = vi.hoisted(() => ({
  getLanguage: vi.fn(),
}));

vi.mock("../../src/utils/search.js", () => ({
  lookupTerm: lookupTermMock,
}));

vi.mock("../../src/db/index.js", () => ({
  db: dbMock,
}));

vi.mock("../../src/utils/term-card.js", () => ({
  buildEnrichedTermCard: vi.fn(async () => "<b>Deep Link Card</b>"),
}));

import { startCommand } from "../../src/commands/start.js";

describe("startCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getLanguage.mockReturnValue(undefined);
  });

  it("shows the language picker for new users", async () => {
    const ctx = createMockCtx({ sessionLanguage: undefined });
    await startCommand(ctx);
    expect(ctx.replyWithPhoto).toHaveBeenCalledOnce();
  });

  it("falls back to text onboarding if the image cannot be sent", async () => {
    const ctx = createMockCtx({ sessionLanguage: undefined });
    (ctx.replyWithPhoto as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("photo failed"),
    );
    await startCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
  });

  it("sends the deep-linked term card when the term exists", async () => {
    lookupTermMock.mockReturnValueOnce({
      type: "found",
      term: {
        id: "proof-of-history",
        term: "Proof of History",
      },
    });
    const ctx = createMockCtx({
      match: "proof-of-history",
      sessionLanguage: "en",
    });
    await startCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("Deep Link Card");
  });

  it("shows welcome and onboarding tips for returning users", async () => {
    const ctx = createMockCtx({ sessionLanguage: "pt" });
    await startCommand(ctx);
    const replies = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map(
      ([text]) => text,
    );
    expect(replies).toEqual(["[start-welcome]", "[onboarding-tips]"]);
  });

  it("uses the stored user language instead of reopening the picker", async () => {
    dbMock.getLanguage.mockReturnValueOnce("es");
    const ctx = createMockCtx({ sessionLanguage: undefined });
    await startCommand(ctx);
    expect(ctx.replyWithPhoto).not.toHaveBeenCalled();
    expect(ctx.session.language).toBe("es");
    const replies = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map(
      ([text]) => text,
    );
    expect(replies).toEqual(["[start-welcome]", "[onboarding-tips]"]);
  });
});
