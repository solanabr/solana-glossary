import { InlineKeyboard } from "grammy";
import { allTerms, getTermsByDepth } from "../glossary/index.js";
import type { GlossaryTerm } from "../glossary/index.js";
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

type DifficultySelection =
  | { kind: "all" }
  | { kind: "range"; min: number; max: number }
  | { kind: "exact"; level: 1 | 2 | 3 | 4 | 5 };

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

export async function quizCommand(ctx: MyContext): Promise<void> {
  const selection = parseDifficultySelection((ctx.match as string).trim());

  if (selection === "invalid") {
    await ctx.reply(ctx.t("usage-quiz"), { parse_mode: "HTML" });
    return;
  }

  await sendQuiz(ctx, undefined, selection);
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

  let fallbackToAllTerms = false;
  let candidatePool =
    pool && pool.length >= 4 ? pool : getPoolForSelection(selection);

  if (candidatePool.length < 4) {
    candidatePool = allTerms;
    fallbackToAllTerms = true;
  }

  const termsWithDefinition = candidatePool.filter(
    (term) => term.definition && term.definition.length > 20,
  );

  if (termsWithDefinition.length < 4) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  if (fallbackToAllTerms && selection.kind !== "all") {
    await ctx.reply(ctx.t("quiz-difficulty-fallback"), {
      parse_mode: "HTML",
    });
  }

  const targetTerm =
    termsWithDefinition[Math.floor(Math.random() * termsWithDefinition.length)];

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

  const options = shuffleArray([targetTerm, ...distractors]);
  const correctIdx = options.findIndex((term) => term.id === targetTerm.id);

  db.saveQuizSession(
    userId,
    targetTerm.id,
    correctIdx,
    options.map((term) => term.id),
  );

  await ctx.reply(buildQuizQuestionText(ctx, targetTerm), {
    parse_mode: "HTML",
    reply_markup: buildQuizKeyboard(ctx, options),
  });
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

function buildQuizKeyboard(
  ctx: MyContext,
  options: GlossaryTerm[],
): InlineKeyboard {
  return new InlineKeyboard()
    .text(
      ctx.t("quiz-option-a", { term: options[0]?.term ?? "" }),
      "quiz_answer:0",
    )
    .row()
    .text(
      ctx.t("quiz-option-b", { term: options[1]?.term ?? "" }),
      "quiz_answer:1",
    )
    .row()
    .text(
      ctx.t("quiz-option-c", { term: options[2]?.term ?? "" }),
      "quiz_answer:2",
    )
    .row()
    .text(
      ctx.t("quiz-option-d", { term: options[3]?.term ?? "" }),
      "quiz_answer:3",
    );
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

  return "invalid";
}

function getPoolForSelection(selection: DifficultySelection): GlossaryTerm[] {
  if (selection.kind === "all") return allTerms;
  if (selection.kind === "exact")
    return getTermsByDepth(selection.level, selection.level);
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
