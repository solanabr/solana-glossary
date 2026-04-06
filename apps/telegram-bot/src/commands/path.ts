import { db } from "../db/index.js";
import { getTerm } from "../glossary/index.js";
import {
  buildPathMenuKeyboard,
  buildPathStepKeyboard,
} from "../utils/keyboard.js";
import {
  LEARNING_PATHS,
  getLearningPath,
  type PathProgress,
} from "../data/paths.js";
import type { MyContext } from "../context.js";
import { getEffectiveLocale } from "../utils/locale.js";
import { buildEnrichedTermCard } from "../utils/term-card.js";

export async function pathCommand(ctx: MyContext): Promise<void> {
  await sendPathMenu(ctx);
}

export async function sendPathMenu(
  ctx: MyContext,
  editMessage = false,
): Promise<void> {
  const userId = ctx.from?.id;
  const storedProgress = userId ? await db.getAllPathProgress(userId) : {};
  const progressMap: Record<string, PathProgress> = Object.fromEntries(
    LEARNING_PATHS.map((path) => [
      path.id,
      {
        step: storedProgress[path.id]?.step ?? 0,
        completed: storedProgress[path.id]?.completed ?? false,
        total: path.termIds.length,
        started: Boolean(storedProgress[path.id]),
      },
    ]),
  );

  const options = {
    parse_mode: "HTML" as const,
    reply_markup: buildPathMenuKeyboard(
      LEARNING_PATHS,
      progressMap,
      ctx.t.bind(ctx),
    ),
  };

  const menuText = [
    ctx.t("path-menu-header"),
    "",
    ...LEARNING_PATHS.map(
      (path) =>
        `${path.emoji} <b>${ctx.t(path.nameKey)}</b>\n${ctx.t(path.descKey)}`,
    ),
  ].join("\n\n");

  if (editMessage && ctx.callbackQuery) {
    await ctx.editMessageText(menuText, options);
    return;
  }

  await ctx.reply(menuText, options);
}

export async function sendPathStep(
  ctx: MyContext,
  pathId: string,
  step: number,
  editMessage = false,
): Promise<void> {
  const path = getLearningPath(pathId);
  if (!path) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  const boundedStep = Math.max(0, Math.min(step, path.termIds.length - 1));
  const termId = path.termIds[boundedStep];
  const term = getTerm(termId);

  if (!term) {
    await ctx.reply(ctx.t("internal-error"));
    return;
  }

  const userId = ctx.from?.id;
  if (userId) {
    await db.setPathStep(userId, pathId, boundedStep);
  }

  const header = ctx.t("path-step-header", {
    emoji: path.emoji,
    name: ctx.t(path.nameKey),
    step: boundedStep + 1,
    total: path.termIds.length,
  });
  const card = await buildEnrichedTermCard(
    term,
    ctx.t.bind(ctx),
    await getEffectiveLocale(ctx),
  );
  const isLast = boundedStep === path.termIds.length - 1;
  const isFav = userId ? await db.isFavorite(userId, termId) : false;
  const nextPath = getNextLearningPath(pathId);

  if (userId && isLast) {
    await db.markPathCompleted(userId, pathId);
  }

  const text = isLast
    ? `${header}\n\n${card}\n\n${
        nextPath
          ? ctx.t("path-completed", {
              name: ctx.t(path.nameKey),
              next_path: ctx.t(nextPath.nameKey),
            })
          : ctx.t("path-completed-final", {
              name: ctx.t(path.nameKey),
            })
      }`
    : `${header}\n\n${card}`;

  const options = {
    parse_mode: "HTML" as const,
    reply_markup: buildPathStepKeyboard(
      pathId,
      boundedStep,
      path.termIds.length,
      termId,
      isFav,
      isLast,
      ctx.t.bind(ctx),
    ),
  };

  if (editMessage && ctx.callbackQuery) {
    await ctx.editMessageText(text, options);
    return;
  }

  await ctx.reply(text, options);
}

function getNextLearningPath(pathId: string) {
  const index = LEARNING_PATHS.findIndex((path) => path.id === pathId);
  if (index === -1 || index === LEARNING_PATHS.length - 1) return undefined;
  return LEARNING_PATHS[index + 1];
}
