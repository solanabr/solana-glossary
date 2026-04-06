import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockCtx } from "../helpers.js";

const dbMock = vi.hoisted(() => ({
  saveQuizSession: vi.fn(),
}));

const glossaryMock = vi.hoisted(() => {
  const allTerms = [
    {
      id: "alpha",
      term: "Alpha",
      definition: "Definition alpha long enough for quiz.",
      category: "defi",
      depth: 1,
    },
    {
      id: "beta",
      term: "Beta",
      definition: "Definition beta long enough for quiz.",
      category: "defi",
      depth: 2,
    },
    {
      id: "gamma",
      term: "Gamma",
      definition: "Definition gamma long enough for quiz.",
      category: "infra",
      depth: 3,
    },
    {
      id: "delta",
      term: "Delta",
      definition: "Definition delta long enough for quiz.",
      category: "infra",
      depth: 4,
    },
    {
      id: "epsilon",
      term: "Epsilon",
      definition: "Definition epsilon long enough for quiz.",
      category: "infra",
      depth: 5,
    },
  ];

  return {
    allTerms,
    getTerm: vi.fn((id: string) => allTerms.find((term) => term.id === id)),
    getTermsByDepth: vi.fn(() => [allTerms[0]]),
  };
});

vi.mock("../../src/db/index.js", () => ({ db: dbMock }));
vi.mock("../../src/glossary/index.js", () => glossaryMock);

import {
  quizCommand,
  startQuizFromDraft,
  updateQuizDraft,
} from "../../src/commands/quiz.js";

describe("quizCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the quiz menu without arguments", async () => {
    const ctx = createMockCtx({ chatType: "private" });
    await quizCommand(ctx);
    const [text, opts] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[quiz-menu-title]");
    expect(opts.reply_markup).toBeDefined();
  });

  it("shows a simplified quiz menu in groups", async () => {
    const ctx = createMockCtx({ chatType: "group" });
    await quizCommand(ctx);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[quiz-menu-group-note]");
  });

  it("keeps the legacy difficulty shortcut", async () => {
    const ctx = createMockCtx({ match: "hard" });
    await quizCommand(ctx);
    expect(dbMock.saveQuizSession).toHaveBeenCalledOnce();
    const replies = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map(
      ([text]) => text,
    );
    expect(replies[0]).toBe("[quiz-difficulty-fallback]");
    expect(replies[1]).toBe("[quiz-question]");
  });

  it("starts a round from the draft in private chat", async () => {
    const ctx = createMockCtx({ chatType: "private" });
    updateQuizDraft(ctx, {
      mode: "round",
      difficultyKey: "all",
      questionCount: 3,
      failureMode: "continue",
    });
    await startQuizFromDraft(ctx);
    expect(dbMock.saveQuizSession).toHaveBeenCalledOnce();
    const [, savedSession] = (dbMock.saveQuizSession as ReturnType<typeof vi.fn>)
      .mock.calls[0];
    expect(savedSession.mode).toBe("round");
    expect(savedSession.totalQuestions).toBe(3);
    const [text] = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toContain("[quiz-round-progress]");
  });
});
