// src/context.ts
import { Context, SessionFlavor } from "grammy";
import { I18nFlavor } from "@grammyjs/i18n";

export interface QuizDraft {
  mode: "single" | "round";
  difficultyKey: "all" | "easy" | "medium" | "hard" | "1" | "2" | "3" | "4" | "5";
  questionCount: 3 | 5 | 10;
  failureMode: "continue" | "sudden_death";
}

export interface SessionData {
  /** User's chosen language. undefined = auto-detect from Telegram */
  language: "pt" | "en" | "es" | undefined;
  awaitingGlossaryQuery?: boolean;
  quizDraft?: QuizDraft;
}

export type MyContext = Context & SessionFlavor<SessionData> & I18nFlavor;
