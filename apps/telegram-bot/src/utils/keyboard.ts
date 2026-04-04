// src/utils/keyboard.ts
import { InlineKeyboard } from "grammy";
import type { GlossaryTerm } from "../glossary/index.js";
import type { Category } from "../glossary/index.js";
import type { MyContext } from "../context.js";
import { db } from "../db/index.js";

/** Term card navigation: [Related] [Category] [Share] [Favorite] [Feedback] */
export function buildTermKeyboard(
  termId: string,
  t: MyContext["t"],
  userId?: number,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // First row: Related, Category
  keyboard.text(t("btn-related"), `related:${termId}`);
  keyboard.text(t("btn-category"), `category:${termId}`);
  keyboard.row();

  // Second row: Share
  keyboard.switchInline(t("btn-share"), termId);
  keyboard.row();

  // Third row: Favorite, Feedback
  if (userId) {
    const isFav = db.isFavorite(userId, termId);
    if (isFav) {
      keyboard.text(t("btn-fav-remove"), `fav_remove:${termId}`);
    } else {
      keyboard.text(t("btn-fav-add"), `fav_add:${termId}`);
    }
    keyboard.row();
    keyboard.text(t("btn-feedback-up"), `feedback:${termId}:up`);
    keyboard.text(t("btn-feedback-down"), `feedback:${termId}:down`);
  }

  return keyboard;
}

/** Multiple results selection keyboard */
export function buildSelectKeyboard(terms: GlossaryTerm[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  terms.forEach((term, i) => {
    keyboard.text(term.term, `select:${term.id}`);
    if (i < terms.length - 1) keyboard.row();
  });
  return keyboard;
}

/** Category pagination keyboard */
export function buildCategoryPageKeyboard(
  category: Category,
  page: number,
  totalPages: number,
  t: MyContext["t"],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Navigation row
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

  categories.forEach((cat, i) => {
    keyboard.text(formatCategoryLabel(cat), `browse_cat:${cat}`);
    if (i % 2 === 1) keyboard.row();
  });

  keyboard.row();
  keyboard.text(t("btn-back-menu"), "menu:main");

  return keyboard;
}

export function buildMainMenuKeyboard(t: MyContext["t"]): InlineKeyboard {
  return new InlineKeyboard()
    .text(t("menu-glossary"), "menu:glossary")
    .text(t("menu-categories"), "menu:categories")
    .row()
    .text(t("menu-random"), "menu:random")
    .text(t("menu-quiz"), "menu:quiz")
    .row()
    .text(t("menu-path"), "menu:path")
    .text(t("menu-help"), "menu:help");
}

export function buildPathKeyboard(t: MyContext["t"]): InlineKeyboard {
  return new InlineKeyboard()
    .text(t("path-track-core"), "browse_cat:core-protocol")
    .text(t("path-track-dev"), "browse_cat:programming-model")
    .row()
    .text(t("path-track-tools"), "browse_cat:dev-tools")
    .text(t("path-track-security"), "browse_cat:security")
    .row()
    .text(t("path-track-network"), "browse_cat:network")
    .text(t("path-track-zk"), "browse_cat:zk-compression")
    .row()
    .text(t("btn-back-menu"), "menu:main");
}

function formatCategoryLabel(category: Category): string {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
