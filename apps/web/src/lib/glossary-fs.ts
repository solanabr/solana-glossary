import "server-only";

import fs from "fs";
import path from "path";

import {
  applyI18n,
  type GlossaryTerm,
  type I18nMap,
  type Locale,
  type RawTerm,
} from "./glossary";

function dataDir(): string {
  return path.join(process.cwd(), "public", "data");
}

export function readRawTermsSync(): RawTerm[] {
  const bundle = path.join(dataDir(), "terms-all.json");
  if (!fs.existsSync(bundle)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(bundle, "utf8")) as unknown;
    return Array.isArray(raw) ? (raw as RawTerm[]) : [];
  } catch {
    return [];
  }
}

export function readI18nMapSync(locale: "pt-BR" | "es"): I18nMap {
  const file = locale === "pt-BR" ? "pt.json" : "es.json";
  const p = path.join(dataDir(), "i18n", file);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as I18nMap;
  } catch {
    return {};
  }
}

export function getGlossaryTermSync(
  id: string,
  locale: Locale,
): GlossaryTerm | undefined {
  const raw = readRawTermsSync().find((t) => t.id === id);
  if (!raw) return undefined;
  const i18n: I18nMap = locale === "en" ? {} : readI18nMapSync(locale);
  return applyI18n([raw], i18n, locale)[0];
}

export function getAllTermIdsSync(): string[] {
  return readRawTermsSync().map((t) => t.id);
}

export function truncateMeta(text: string, max = 155): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}
