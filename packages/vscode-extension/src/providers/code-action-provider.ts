import * as vscode from "vscode";

import { COMMANDS } from "../config/constants";

export class GlossaryCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const selectedText = document.getText(range);

    if (selectedText.trim().length > 10) {
      const explain = new vscode.CodeAction(
        "Explain with Solana Glossary",
        vscode.CodeActionKind.RefactorRewrite,
      );
      explain.command = {
        command: COMMANDS.explainSelection,
        title: "Explain with Solana Glossary",
      };
      actions.push(explain);
    }

    if (context.diagnostics.length > 0) {
      const debug = new vscode.CodeAction(
        "Debug with Solana Glossary",
        vscode.CodeActionKind.QuickFix,
      );
      debug.command = {
        command: COMMANDS.debugError,
        title: "Debug with Solana Glossary",
        arguments: [context.diagnostics[0].message],
      };
      debug.isPreferred = true;
      actions.push(debug);
    }

    return actions;
  }
}
