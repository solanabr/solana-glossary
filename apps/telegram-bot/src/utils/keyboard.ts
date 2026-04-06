import { InlineKeyboard } from "grammy";
import type { GlossaryTerm, Category } from "../glossary/index.js";
import type { MyContext } from "../context.js";
import { db } from "../db/index.js";
import type { LearningPath, PathProgress } from "../data/paths.js";

export async function buildTermKeyboard(
  termId: string,
  t: MyContext["t"],
  userId?: number,
): Promise<InlineKeyboard> {
  const keyboard = new InlineKeyboard();

  keyboard.text(t("btn-related"), `related:${termId}`);
  keyboard.text(t("btn-category"), `category:${termId}`);
  keyboard.row();

  keyboard.switchInline(t("btn-share"), termId);
  keyboard.row();

  if (userId) {
    const isFav =
      typeof db.isFavorite === "function"
        ? await db.isFavorite(userId, termId)
        : false;
    keyboard.text(
      isFav ? t("btn-fav-remove") : t("btn-fav-add"),
      isFav ? `fav_remove:${termId}` : `fav_add:${termId}`,
    );
    keyboard.row();
    keyboard.text(t("btn-feedback-up"), `feedback:${termId}:up`);
    keyboard.text(t("btn-feedback-down"), `feedback:${termId}:down`);
  }

  return keyboard;
}

export function buildSelectKeyboard(terms: GlossaryTerm[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  terms.forEach((term, index) => {
    keyboard.text(term.term, `select:${term.id}`);
    if (index < terms.length - 1) keyboard.row();
  });

  return keyboard;
}

export function buildCategoryPageKeyboard(
  category: Category,
  page: number,
  totalPages: number,
  t: MyContext["t"],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (page > 1) {
    keyboard.text(t("btn-prev"), `cat_page:${category}:${page - 1}`);
  }

  keyboard.text(t("btn-page", { current: page, total: totalPages }), "noop:");

  if (page < totalPages) {
    keyboard.text(t("btn-next"), `cat_page:${category}:${page + 1}`);
  }

  keyboard.row();
  keyboard.text(t("btn-back-categories"), "menu:categories");
  keyboard.text(t("btn-back-menu"), "menu:main");

  return keyboard;
}

export function buildCategoriesKeyboard(
  categories: Category[],
  t: MyContext["t"],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  categories.forEach((category, index) => {
    keyboard.text(formatCategoryLabel(category), `browse_cat:${category}`);
    if (index % 2 === 1) keyboard.row();
  });

  keyboard.row();
  keyboard.text(t("btn-back-menu"), "menu:main");

  return keyboard;
}

export function buildMainMenuKeyboard(t: MyContext["t"]): InlineKeyboard {
  return new InlineKeyboard()
    .text(t("menu-glossary"), "menu:glossary")
    .text(t("menu-explain"), "menu:explain")
    .row()
    .text(t("menu-quiz"), "menu:quiz")
    .text(t("menu-path"), "menu:path")
    .row()
    .text(t("menu-progress"), "menu:progress")
    .text(t("menu-library"), "menu:library")
    .row()
    .text(t("menu-help"), "menu:help");
}

export function buildTipsKeyboard(t: MyContext["t"]): InlineKeyboard {
  return new InlineKeyboard()
    .text(t("tips-btn-glossary"), "tips:glossary")
    .text(t("tips-btn-explain"), "tips:explain")
    .row()
    .text(t("tips-btn-quiz"), "tips:quiz")
    .text(t("tips-btn-path"), "tips:path")
    .row()
    .text(t("menu-progress"), "menu:progress")
    .text(t("menu-library"), "menu:library")
    .row()
    .text(t("tips-btn-compare"), "tips:compare")
    .text(t("tips-btn-help"), "tips:help")
    .row()
    .text(t("btn-back-menu"), "menu:main");
}

export function buildProgressMenuKeyboard(t: MyContext["t"]): InlineKeyboard {
  return new InlineKeyboard()
    .text(t("tips-btn-streak"), "menu:streak")
    .text(t("tips-btn-leaderboard"), "menu:leaderboard")
    .row()
    .text(t("btn-back-menu"), "menu:main");
}

export function buildLibraryMenuKeyboard(t: MyContext["t"]): InlineKeyboard {
  return new InlineKeyboard()
    .text(t("menu-categories"), "menu:categories")
    .text(t("menu-random"), "menu:random")
    .row()
    .text(t("menu-favorites"), "menu:favorites")
    .text(t("menu-history"), "menu:history")
    .row()
    .text(t("menu-daily"), "menu:daily")
    .row()
    .text(t("btn-back-menu"), "menu:main");
}

export function buildPathMenuKeyboard(
  paths: LearningPath[],
  progressMap: Record<string, PathProgress>,
  t: MyContext["t"],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  paths.forEach((path) => {
    const progress = progressMap[path.id] ?? {
      step: 0,
      completed: false,
      total: path.termIds.length,
      started: false,
    };
    const current = progress.completed
      ? progress.total
      : progress.started
        ? Math.min(progress.step + 1, progress.total)
        : 0;
    const progressBar = formatProgressBar(current, progress.total);
    const label = `${path.emoji} ${t(path.nameKey)} [${progressBar}] ${current}/${progress.total}`;

    keyboard.text(label, `path_select:${path.id}`).row();
  });

  keyboard.text(t("btn-back-menu"), "menu:main");
  return keyboard;
}

export function buildPathStepKeyboard(
  pathId: string,
  step: number,
  total: number,
  termId: string,
  isFav: boolean,
  isLast: boolean,
  t: MyContext["t"],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (step > 0) {
    keyboard.text(t("btn-prev"), `path_step:${pathId}:${step - 1}`);
  }

  keyboard.text(t("path-step-badge", { current: step + 1, total }), "noop:");

  if (!isLast) {
    keyboard.text(t("btn-next"), `path_step:${pathId}:${step + 1}`);
  }

  keyboard.row();
  keyboard.text(
    isFav ? t("btn-fav-remove") : t("btn-fav-add"),
    isFav
      ? `path_fav_remove:${pathId}:${step}:${termId}`
      : `path_fav_add:${pathId}:${step}:${termId}`,
  );

  if (isLast) {
    keyboard.row();
    keyboard.text(t("path-quiz"), `path_quiz:${pathId}`);
    keyboard.row();
    keyboard.text(t("path-restart"), `path_reset:${pathId}`);
  }

  keyboard.row();
  keyboard.text(t("btn-back-menu"), "menu:main");
  return keyboard;
}

function formatCategoryLabel(category: Category): string {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatProgressBar(current: number, total: number): string {
  const width = 8;
  const filled = total === 0 ? 0 : Math.round((current / total) * width);
  return `${"#".repeat(filled)}${"-".repeat(width - filled)}`;
}
