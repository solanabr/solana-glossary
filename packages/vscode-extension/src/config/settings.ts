import * as vscode from "vscode";

import { DEFAULT_API_BASE_URL, DEFAULT_LOCALE, EXTENSION_ID } from "./constants";

export type ExtensionLocale = "en" | "pt" | "es";

export interface ExtensionSettings {
  apiBaseUrl: string;
  locale: ExtensionLocale;
  enableDiagnostics: boolean;
  enableHoverDefinitions: boolean;
  enableCodeActions: boolean;
  hoverMaxRelatedTerms: number;
}

export function getSettings(): ExtensionSettings {
  const config = vscode.workspace.getConfiguration(EXTENSION_ID);

  return {
    apiBaseUrl: (config.get("apiBaseUrl") as string | undefined) ?? DEFAULT_API_BASE_URL,
    locale: (config.get("locale") as ExtensionLocale | undefined) ?? DEFAULT_LOCALE,
    enableDiagnostics: (config.get("enableDiagnostics") as boolean | undefined) ?? true,
    enableHoverDefinitions: (config.get("enableHoverDefinitions") as boolean | undefined) ?? true,
    enableCodeActions: (config.get("enableCodeActions") as boolean | undefined) ?? true,
    hoverMaxRelatedTerms: (config.get("hoverMaxRelatedTerms") as number | undefined) ?? 3,
  };
}
