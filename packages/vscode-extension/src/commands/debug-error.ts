import * as vscode from "vscode";

import { GlossaryOSClient } from "../api/glossary-os-client";
import { CopilotPanel } from "../panels/copilot-panel";
import { extractSelectedCode } from "../utils/code-extractor";
import { detectLocale } from "../utils/locale-detector";
import { parseErrorMessage } from "../utils/error-parser";

export async function debugErrorCommand(
  context: vscode.ExtensionContext,
  providedError?: string,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const selectedCode = editor ? extractSelectedCode(editor) : "";

  const errorMessage =
    providedError ??
    (await vscode.window.showInputBox({
      prompt: "Paste the Solana or Anchor error message to debug",
      placeHolder: "ConstraintSeeds, account not found, unauthorized signer...",
    }));

  if (!errorMessage?.trim()) {
    return;
  }

  const parsed = parseErrorMessage(errorMessage);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Solana Glossary Copilot: ${parsed.title}`,
      cancellable: false,
    },
    async () => {
      const client = new GlossaryOSClient();
      const result = await client.debugError({
        error: errorMessage,
        code: selectedCode.trim() ? selectedCode : undefined,
        locale: detectLocale(),
        anchorHint: parsed.anchorHint,
      });

      CopilotPanel.show({
        panelId: "solanaGlossaryDebug",
        title: result.title,
        extensionUri: context.extensionUri,
        answer: result,
        sourceText: selectedCode || errorMessage,
      });
    },
  );
}
