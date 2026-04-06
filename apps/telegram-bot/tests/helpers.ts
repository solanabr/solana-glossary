// tests/helpers.ts
import { vi } from "vitest";
import type { MyContext, SessionData } from "../src/context.js";

export function createMockCtx(options?: {
  text?: string;
  match?: string;
  replyToText?: string;
  languageCode?: string;
  sessionLanguage?: SessionData["language"];
  chatType?: "private" | "group" | "supergroup" | "channel";
}): MyContext {
  const opts = options ?? {};
  return {
    reply: vi.fn().mockResolvedValue(undefined),
    replyWithPhoto: vi.fn().mockResolvedValue(undefined),
    answerInlineQuery: vi.fn().mockResolvedValue(undefined),
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    editMessageReplyMarkup: vi.fn().mockResolvedValue(undefined),
    deleteMessage: vi.fn().mockResolvedValue(undefined),
    me: { username: "SolanaGlossaryBot" },
    from: {
      id: 123,
      language_code: opts.languageCode ?? "en",
      first_name: "Test",
      is_bot: false,
    },
    chat: { type: opts.chatType ?? "private", id: 456 },
    match: opts.match ?? "",
    message: {
      text: opts.text ?? "",
      reply_to_message: opts.replyToText
        ? { text: opts.replyToText }
        : undefined,
    },
    session: { language: opts.sessionLanguage, quizDraft: undefined },
    inlineQuery: {
      query: opts.match ?? "",
      id: "test-inline-id",
    },
    callbackQuery: {
      data: opts.match ?? "",
      id: "test-cb-id",
    },
    i18n: {
      useLocale: vi.fn().mockResolvedValue(undefined),
    },
    t: (key: string, _params?: Record<string, unknown>) => `[${key}]`,
  } as unknown as MyContext;
}
