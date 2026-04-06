import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getGroupLanguage: vi.fn(),
  getLanguage: vi.fn(),
}));

vi.mock("../../src/db/index.js", () => ({
  db: dbMock,
}));

import { getEffectiveLocale } from "../../src/utils/locale.js";

describe("getEffectiveLocale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses stored private language when session is empty", async () => {
    dbMock.getLanguage.mockReturnValueOnce("pt");
    const locale = await getEffectiveLocale({
      chat: { type: "private", id: 456 } as any,
      from: { id: 123, language_code: "en" } as any,
      session: { language: undefined } as any,
    });
    expect(locale).toBe("pt");
  });

  it("prefers group language over user language", async () => {
    dbMock.getGroupLanguage.mockReturnValueOnce("es");
    const locale = await getEffectiveLocale({
      chat: { type: "group", id: 456 } as any,
      from: { id: 123, language_code: "en" } as any,
      session: { language: "pt" } as any,
    });
    expect(locale).toBe("es");
  });
});
