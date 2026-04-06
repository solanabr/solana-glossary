import { InlineKeyboard } from "grammy";
import { allTerms, getTerm, getTermsByDepth } from "../glossary/index.js";
import type { GlossaryTerm } from "../glossary/index.js";
import { db, type QuizSession } from "../db/index.js";
import type { MyContext, QuizDraft } from "../context.js";

type DifficultySelection =
  | { kind: "all" }
  | { kind: "range"; min: number; max: number }
  | { kind: "exact"; level: 1 | 2 | 3 | 4 | 5 };

type DifficultyKey = QuizDraft["difficultyKey"];

const PRIVATE_DEFAULT_DRAFT: QuizDraft = {
  mode: "round",
  difficultyKey: "all",
  questionCount: 5,
  failureMode: "continue",
};

const GROUP_DEFAULT_DRAFT: QuizDraft = {
  mode: "single",
  difficultyKey: "all",
  questionCount: 3,
  failureMode: "continue",
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function isGroupChat(ctx: MyContext): boolean {
  return ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
}

function getDefaultQuizDraft(isGroup: boolean): QuizDraft {
  return isGroup ? GROUP_DEFAULT_DRAFT : PRIVATE_DEFAULT_DRAFT;
}

export function getQuizDraft(ctx: MyContext): QuizDraft {
  const draft = ctx.session.quizDraft ?? getDefaultQuizDraft(isGroupChat(ctx));
  const normalized = normalizeQuizDraft(draft, isGroupChat(ctx));
  ctx.session.quizDraft = normalized;
  return normalized;
}

export function updateQuizDraft(
  ctx: MyContext,
  patch: Partial<QuizDraft>,
): QuizDraft {
  const draft = normalizeQuizDraft(
    { ...getQuizDraft(ctx), ...patch },
    isGroupChat(ctx),
  );
  ctx.session.quizDraft = draft;
  return draft;
}

function normalizeQuizDraft(draft: QuizDraft, isGroup: boolean): QuizDraft {
  const normalized: QuizDraft = {
    mode: draft.mode,
    difficultyKey: draft.difficultyKey,
    questionCount: draft.questionCount,
    failureMode: draft.failureMode,
  };

  if (isGroup) {
    normalized.mode = "single";
    normalized.questionCount = 3;
    normalized.failureMode = "continue";
  }

  return normalized;
}

export async function quizCommand(ctx: MyContext): Promise<void> {
  const raw = (ctx.match as string).trim();

  if (raw) {
    const selection = parseDifficultySelection(raw);
    if (selection === "invalid") {
      await ctx.reply(ctx.t("usage-quiz"), { parse_mode: "HTML" });
      return;
    }

    updateQuizDraft(ctx, {
      mode: "single",
      difficultyKey: getDifficultyKey(selection),
    });
    await sendQuiz(ctx, undefined, selection);
    return;
  }

  await sendQuizMenu(ctx);
}

export async function sendQuizMenu(
  ctx: MyContext,
  editMessage = false,
): Promise<void> {
  const draft = getQuizDraft(ctx);
  const groupMode = isGroupChat(ctx);
  const text = buildQuizMenuText(ctx, draft, groupMode);
  const options = {
    parse_mode: "HTML" as const,
    reply_markup: buildQuizMenuKeyboard(ctx, draft, groupMode),
  };

  if (editMessage && ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, options);
    } catch (error) {
      if (isMessageNotModifiedError(error)) {
        return;
      }
      throw error;
    }
    return;
  }

  await ctx.reply(text, options);
}

function isMessageNotModifiedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("message is not modified") ||
    message.includes("message_not_modified")
  );
}

export async function startQuizFromDraft(ctx: MyContext): Promise<void> {
  const draft = getQuizDraft(ctx);
  if (isGroupChat(ctx) || draft.mode === "single") {
    await sendQuiz(ctx, undefined, getSelectionFromKey(draft.difficultyKey));
    return;
  }

  await sendQuizRound(ctx, draft);
}

export async function sendQuiz(
  ctx: MyContext,
  pool?: GlossaryTerm[],
  selection: DifficultySelection = { kind: "all" },
): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("quiz-no-user"));
    return;
  }

  const prepared = prepareCandidatePool(selection, pool);
  if (!prepared) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  if (prepared.fallbackToAllTerms && selection.kind !== "all" && !pool) {
    await ctx.reply(ctx.t("quiz-difficulty-fallback"), {
      parse_mode: "HTML",
    });
  }

  const question = buildQuestion(
    prepared.candidatePool,
    prepared.eligibleTerms[Math.floor(Math.random() * prepared.eligibleTerms.length)]!,
  );

  await db.saveQuizSession(userId, {
    termId: question.termId,
    correctIdx: question.correctIdx,
    options: question.options,
    mode: "single",
    difficultyKey: getDifficultyKey(selection),
    totalQuestions: 1,
    currentQuestion: 1,
    correctAnswers: 0,
    wrongAnswers: 0,
    failureMode: "continue",
    remainingTermIds: [],
    askedTermIds: [question.termId],
    poolTermIds: prepared.candidatePool.map((term) => term.id),
  });

  const targetTerm = getTerm(question.termId);
  if (!targetTerm) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  await ctx.reply(buildQuizQuestionText(ctx, targetTerm), {
    parse_mode: "HTML",
    reply_markup: buildQuizAnswerKeyboard(
      ctx,
      question.options,
      1,
    ),
  });
}

async function sendQuizRound(ctx: MyContext, draft: QuizDraft): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("quiz-no-user"));
    return;
  }

  const selection = getSelectionFromKey(draft.difficultyKey);
  const prepared = prepareCandidatePool(selection);
  if (!prepared) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  if (prepared.fallbackToAllTerms && selection.kind !== "all") {
    await ctx.reply(ctx.t("quiz-difficulty-fallback"), {
      parse_mode: "HTML",
    });
  }

  const totalQuestions = Math.min(
    draft.questionCount,
    prepared.eligibleTerms.length,
  );
  if (totalQuestions < draft.questionCount) {
    await ctx.reply(
      ctx.t("quiz-round-count-adjusted", {
        requested: draft.questionCount,
        available: totalQuestions,
      }),
      { parse_mode: "HTML" },
    );
  }

  const selectedTerms = shuffleArray(prepared.eligibleTerms).slice(0, totalQuestions);
  const firstTerm = selectedTerms[0];
  if (!firstTerm) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  const question = buildQuestion(prepared.candidatePool, firstTerm);
  const session: QuizSession = {
    termId: question.termId,
    correctIdx: question.correctIdx,
    options: question.options,
    mode: "round",
    difficultyKey: draft.difficultyKey,
    totalQuestions,
    currentQuestion: 1,
    correctAnswers: 0,
    wrongAnswers: 0,
    failureMode: draft.failureMode,
    remainingTermIds: selectedTerms.slice(1).map((term) => term.id),
    askedTermIds: [firstTerm.id],
    poolTermIds: prepared.candidatePool.map((term) => term.id),
  };

  await db.saveQuizSession(userId, session);
  await ctx.reply(buildQuizRoundQuestionText(ctx, session, firstTerm), {
    parse_mode: "HTML",
    reply_markup: buildQuizAnswerKeyboard(
      ctx,
      session.options,
      session.currentQuestion,
      true,
    ),
  });
}

function prepareCandidatePool(
  selection: DifficultySelection,
  pool?: GlossaryTerm[],
):
  | {
      candidatePool: GlossaryTerm[];
      eligibleTerms: GlossaryTerm[];
      fallbackToAllTerms: boolean;
    }
  | undefined {
  let fallbackToAllTerms = false;
  let candidatePool = pool && pool.length >= 4 ? pool : getPoolForSelection(selection);

  if (candidatePool.length < 4) {
    candidatePool = allTerms;
    fallbackToAllTerms = true;
  }

  const eligibleTerms = candidatePool.filter(
    (term) => term.definition && term.definition.length > 20,
  );

  if (eligibleTerms.length < 4) {
    return undefined;
  }

  return { candidatePool, eligibleTerms, fallbackToAllTerms };
}

function buildQuestion(
  candidatePool: GlossaryTerm[],
  targetTerm: GlossaryTerm,
): { termId: string; correctIdx: number; options: string[] } {
  const categoryTerms = candidatePool
    .filter((term) => term.category === targetTerm.category)
    .filter((term) => term.id !== targetTerm.id);

  const otherPool = candidatePool.filter((term) => term.id !== targetTerm.id);

  let distractors: GlossaryTerm[];
  if (categoryTerms.length >= 3) {
    distractors = shuffleArray(categoryTerms).slice(0, 3);
  } else {
    const remaining = 3 - categoryTerms.length;
    const otherTerms = otherPool.filter(
      (term) =>
        !categoryTerms.some((categoryTerm) => categoryTerm.id === term.id),
    );
    distractors = [
      ...categoryTerms,
      ...shuffleArray(otherTerms).slice(0, remaining),
    ];
  }

  if (distractors.length < 3) {
    const backupTerms = allTerms.filter(
      (term) =>
        term.id !== targetTerm.id &&
        !distractors.some((distractor) => distractor.id === term.id),
    );
    distractors = [
      ...distractors,
      ...shuffleArray(backupTerms).slice(0, 3 - distractors.length),
    ];
  }

  const options = shuffleArray([targetTerm, ...distractors]).map((term) => term.id);
  const correctIdx = options.findIndex((termId) => termId === targetTerm.id);

  return {
    termId: targetTerm.id,
    correctIdx,
    options,
  };
}

export function buildQuizQuestionText(
  ctx: MyContext,
  term: GlossaryTerm,
): string {
  const difficulty = getDifficultyLabel(ctx, term.depth);
  return ctx.t("quiz-question", {
    definition: term.definition,
    difficulty,
  });
}

export function buildQuizRoundQuestionText(
  ctx: MyContext,
  session: QuizSession,
  term: GlossaryTerm,
): string {
  return [
    ctx.t("quiz-round-progress", {
      current: session.currentQuestion,
      total: session.totalQuestions,
      correct: session.correctAnswers,
      wrong: session.wrongAnswers,
      mode: ctx.t(
        session.failureMode === "sudden_death"
          ? "quiz-menu-failure-sudden-death"
          : "quiz-menu-failure-continue",
      ),
    }),
    "",
    buildQuizQuestionText(ctx, term),
  ].join("\n");
}

function buildQuizAnswerKeyboard(
  ctx: MyContext,
  optionIds: string[],
  questionNumber: number,
  roundMode = false,
): InlineKeyboard {
  const prefix = roundMode ? "quiz_round_answer" : "quiz_answer";
  const labels = [
    ctx.t("quiz-option-a", { term: getTerm(optionIds[0])?.term ?? "" }),
    ctx.t("quiz-option-b", { term: getTerm(optionIds[1])?.term ?? "" }),
    ctx.t("quiz-option-c", { term: getTerm(optionIds[2])?.term ?? "" }),
    ctx.t("quiz-option-d", { term: getTerm(optionIds[3])?.term ?? "" }),
  ];

  return new InlineKeyboard()
    .text(labels[0] ?? "", `${prefix}:${questionNumber}:0`)
    .row()
    .text(labels[1] ?? "", `${prefix}:${questionNumber}:1`)
    .row()
    .text(labels[2] ?? "", `${prefix}:${questionNumber}:2`)
    .row()
    .text(labels[3] ?? "", `${prefix}:${questionNumber}:3`);
}

export function buildQuizRetryKeyboard(ctx: MyContext): InlineKeyboard {
  return new InlineKeyboard()
    .text(ctx.t("quiz-btn-retry"), "quiz_retry")
    .text(ctx.t("quiz-btn-result"), "quiz_result");
}

export function buildQuizRoundSummaryKeyboard(ctx: MyContext): InlineKeyboard {
  return new InlineKeyboard()
    .text(ctx.t("quiz-btn-play-again"), "quiz_start")
    .text(ctx.t("quiz-btn-menu"), "quiz_menu")
    .row()
    .text(ctx.t("btn-back-menu"), "menu:main");
}

function buildQuizMenuKeyboard(
  ctx: MyContext,
  draft: QuizDraft,
  isGroup: boolean,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (!isGroup) {
    keyboard
      .text(
        withSelected(
          draft.mode === "single",
          ctx.t("quiz-menu-mode-single"),
        ),
        "quiz_mode:single",
      )
      .text(
        withSelected(draft.mode === "round", ctx.t("quiz-menu-mode-round")),
        "quiz_mode:round",
      )
      .row();
  }

  keyboard
    .text(
      withSelected(draft.difficultyKey === "all", ctx.t("quiz-menu-difficulty-all")),
      "quiz_diff:all",
    )
    .text(
      withSelected(draft.difficultyKey === "easy", ctx.t("quiz-menu-difficulty-easy")),
      "quiz_diff:easy",
    )
    .text(
      withSelected(
        draft.difficultyKey === "medium",
        ctx.t("quiz-menu-difficulty-medium"),
      ),
      "quiz_diff:medium",
    )
    .row()
    .text(
      withSelected(draft.difficultyKey === "hard", ctx.t("quiz-menu-difficulty-hard")),
      "quiz_diff:hard",
    )
    .row()
    .text(withSelected(draft.difficultyKey === "1", "1"), "quiz_diff:1")
    .text(withSelected(draft.difficultyKey === "2", "2"), "quiz_diff:2")
    .text(withSelected(draft.difficultyKey === "3", "3"), "quiz_diff:3")
    .text(withSelected(draft.difficultyKey === "4", "4"), "quiz_diff:4")
    .text(withSelected(draft.difficultyKey === "5", "5"), "quiz_diff:5")
    .row();

  if (!isGroup && draft.mode === "round") {
    keyboard
      .text(withSelected(draft.questionCount === 3, "3"), "quiz_count:3")
      .text(withSelected(draft.questionCount === 5, "5"), "quiz_count:5")
      .text(withSelected(draft.questionCount === 10, "10"), "quiz_count:10")
      .row()
      .text(
        withSelected(
          draft.failureMode === "continue",
          ctx.t("quiz-menu-failure-continue"),
        ),
        "quiz_fail:continue",
      )
      .text(
        withSelected(
          draft.failureMode === "sudden_death",
          ctx.t("quiz-menu-failure-sudden-death"),
        ),
        "quiz_fail:sudden_death",
      )
      .row();
  }

  keyboard
    .text(ctx.t("quiz-menu-start"), "quiz_start")
    .text(ctx.t("btn-back-menu"), "menu:main");

  return keyboard;
}

function withSelected(active: boolean, label: string): string {
  return active ? `• ${label}` : label;
}

function buildQuizMenuText(
  ctx: MyContext,
  draft: QuizDraft,
  isGroup: boolean,
): string {
  const lines = [
    ctx.t("quiz-menu-title"),
    "",
    `${ctx.t("quiz-menu-mode")}: <b>${ctx.t(
      draft.mode === "round" ? "quiz-menu-mode-round" : "quiz-menu-mode-single",
    )}</b>`,
    `${ctx.t("quiz-menu-difficulty")}: <b>${getDifficultyMenuLabel(ctx, draft.difficultyKey)}</b>`,
  ];

  if (!isGroup && draft.mode === "round") {
    lines.push(
      `${ctx.t("quiz-menu-count")}: <b>${draft.questionCount}</b>`,
      `${ctx.t("quiz-menu-failure")}: <b>${ctx.t(
        draft.failureMode === "sudden_death"
          ? "quiz-menu-failure-sudden-death"
          : "quiz-menu-failure-continue",
      )}</b>`,
    );
  }

  if (isGroup) {
    lines.push("", ctx.t("quiz-menu-group-note"));
  }

  return lines.join("\n");
}

function getDifficultyMenuLabel(ctx: MyContext, key: DifficultyKey): string {
  switch (key) {
    case "all":
      return ctx.t("quiz-menu-difficulty-all");
    case "easy":
      return ctx.t("quiz-menu-difficulty-easy");
    case "medium":
      return ctx.t("quiz-menu-difficulty-medium");
    case "hard":
      return ctx.t("quiz-menu-difficulty-hard");
    default:
      return ctx.t("quiz-menu-difficulty-level", { level: key });
  }
}

function parseDifficultySelection(
  raw: string,
): DifficultySelection | "invalid" {
  if (!raw) return { kind: "all" };

  const normalized = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (normalized === "easy" || normalized === "facil") {
    return { kind: "range", min: 1, max: 2 };
  }

  if (normalized === "medium" || normalized === "medio") {
    return { kind: "exact", level: 3 };
  }

  if (normalized === "hard" || normalized === "dificil") {
    return { kind: "range", min: 4, max: 5 };
  }

  if (/^[1-5]$/.test(normalized)) {
    return { kind: "exact", level: Number(normalized) as 1 | 2 | 3 | 4 | 5 };
  }

  if (normalized === "all") {
    return { kind: "all" };
  }

  return "invalid";
}

function getSelectionFromKey(key: DifficultyKey): DifficultySelection {
  switch (key) {
    case "easy":
      return { kind: "range", min: 1, max: 2 };
    case "medium":
      return { kind: "exact", level: 3 };
    case "hard":
      return { kind: "range", min: 4, max: 5 };
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
      return { kind: "exact", level: Number(key) as 1 | 2 | 3 | 4 | 5 };
    default:
      return { kind: "all" };
  }
}

function getDifficultyKey(selection: DifficultySelection): DifficultyKey {
  if (selection.kind === "all") return "all";
  if (selection.kind === "exact") return String(selection.level) as DifficultyKey;
  if (selection.min === 1 && selection.max === 2) return "easy";
  if (selection.min === 4 && selection.max === 5) return "hard";
  return "all";
}

function getPoolForSelection(selection: DifficultySelection): GlossaryTerm[] {
  if (selection.kind === "all") return allTerms;
  if (selection.kind === "exact") {
    return getTermsByDepth(selection.level, selection.level);
  }
  return getTermsByDepth(selection.min, selection.max);
}

function getDifficultyLabel(
  ctx: MyContext,
  depth?: GlossaryTerm["depth"],
): string {
  switch (depth) {
    case 1:
      return ctx.t("quiz-difficulty-beginner");
    case 2:
      return ctx.t("quiz-difficulty-basic");
    case 3:
      return ctx.t("quiz-difficulty-intermediate");
    case 4:
      return ctx.t("quiz-difficulty-advanced");
    case 5:
      return ctx.t("quiz-difficulty-expert");
    default:
      return "";
  }
}

export function buildNextRoundSession(session: QuizSession): QuizSession | null {
  const nextTermId = session.remainingTermIds[0];
  if (!nextTermId) return null;

  const candidatePool = session.poolTermIds
    .map((termId) => getTerm(termId))
    .filter((term): term is GlossaryTerm => term !== undefined);
  const nextTerm = getTerm(nextTermId);

  if (!nextTerm || candidatePool.length < 4) {
    return null;
  }

  const nextQuestion = buildQuestion(candidatePool, nextTerm);
  return {
    ...session,
    termId: nextQuestion.termId,
    correctIdx: nextQuestion.correctIdx,
    options: nextQuestion.options,
    currentQuestion: session.currentQuestion + 1,
    remainingTermIds: session.remainingTermIds.slice(1),
    askedTermIds: [...session.askedTermIds, nextTermId],
  };
}
