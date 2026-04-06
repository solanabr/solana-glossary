import { describe, it, expect, vi } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  setLanguage: vi.fn(),
}));

vi.mock("../../src/db/index.js", () => ({
  db: dbMock,
}));

import { languageCommand } from "../../src/commands/language.js";

describe("languageCommand", () => {
  it("sets session language, persists it, and replies with confirmation", async () => {
    const ctx = createMockCtx({ match: "pt" });
    await languageCommand(ctx);
    expect(ctx.session.language).toBe("pt");
    expect(dbMock.setLanguage).toHaveBeenCalledWith(123, "pt");
    expect(ctx.reply).toHaveBeenCalledOnce();
  });

  it("rejects invalid language codes", async () => {
    const ctx = createMockCtx({ match: "fr" });
    await languageCommand(ctx);
    expect(ctx.session.language).toBeUndefined();
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[language-invalid]");
  });

  it("rejects empty input", async () => {
    const ctx = createMockCtx({ match: "" });
    await languageCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe("[language-invalid]");
  });

  it("is case-insensitive", async () => {
    const ctx = createMockCtx({ match: "ES" });
    await languageCommand(ctx);
    expect(ctx.session.language).toBe("es");
    expect(dbMock.setLanguage).toHaveBeenCalledWith(123, "es");
  });
});
