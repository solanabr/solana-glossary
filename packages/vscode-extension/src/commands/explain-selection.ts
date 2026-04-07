import * as vscode from "vscode";

import { GlossaryOSClient } from "../api/glossary-os-client";
import { ExplainPanel } from "../panels/explain-panel";
import { extractSelectedCode } from "../utils/code-extractor";
import { detectLocale } from "../utils/locale-detector";

export async function explainSelectionCommand(
  context: vscode.ExtensionContext,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showWarningMessage("No active editor found.");
    return;
  }

  const selectedCode = extractSelectedCode(editor);
  if (!selectedCode.trim()) {
    void vscode.window.showWarningMessage("Select Solana, Anchor, or Rust code to explain.");
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Solana Glossary Copilot",
      cancellable: false,
    },
    async () => {
      const client = new GlossaryOSClient();
      const result = await client.explainCode({
        code: selectedCode,
        locale: detectLocale(),
        filename: editor.document.fileName,
      });

      ExplainPanel.createOrShow(context.extensionUri, result, selectedCode);
    },
  );
}
