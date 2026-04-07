import * as vscode from "vscode";

import { getSettings, type ExtensionLocale } from "../config/settings";

export function detectLocale(): ExtensionLocale {
  const configured = getSettings().locale;
  if (configured) return configured;

  const language = vscode.env.language.toLowerCase();
  if (language.startsWith("pt")) return "pt";
  if (language.startsWith("es")) return "es";
  return "en";
}
