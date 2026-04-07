import * as vscode from "vscode";

import { initializeLocalGlossary } from "./api/local-glossary";
import { registerAllCommands } from "./commands";
import { SOLANA_LANGUAGES } from "./config/constants";
import { getSettings } from "./config/settings";
import { GlossaryCodeActionProvider } from "./providers/code-action-provider";
import { GlossaryCompletionProvider } from "./providers/completion-provider";
import { GlossaryDiagnosticProvider } from "./providers/diagnostic-provider";
import { GlossaryHoverProvider } from "./providers/hover-provider";

export async function activate(context: vscode.ExtensionContext) {
  await initializeLocalGlossary(context.extensionPath);

  const settings = getSettings();
  registerAllCommands(context);

  const selectors = SOLANA_LANGUAGES.map((language) => ({ language }));

  if (settings.enableHoverDefinitions) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(selectors, new GlossaryHoverProvider()),
    );
  }

  if (settings.enableCodeActions) {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(selectors, new GlossaryCodeActionProvider(), {
        providedCodeActionKinds: [
          vscode.CodeActionKind.QuickFix,
          vscode.CodeActionKind.RefactorRewrite,
        ],
      }),
    );
  }

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(selectors, new GlossaryCompletionProvider(), "@", "#"),
  );

  if (settings.enableDiagnostics) {
    const collection = vscode.languages.createDiagnosticCollection("solanaGlossary");
    const provider = new GlossaryDiagnosticProvider(collection);

    context.subscriptions.push(
      collection,
      vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) =>
        provider.updateDiagnostics(document),
      ),
    );
  }

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(book) Solana Glossary";
  statusBarItem.command = "solanaGlossary.searchGlossary";
  statusBarItem.tooltip = "Search Solana Glossary";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const isFirstActivation = context.globalState.get("solanaGlossary.firstActivation", true);
  if (isFirstActivation) {
    void vscode.window
      .showInformationMessage(
        "Solana Glossary Copilot activated. Select code to explain, debug diagnostics, or generate from @generate comments.",
        "Open Planner",
      )
      .then((selection: string | undefined) => {
        if (selection === "Open Planner") {
          void vscode.commands.executeCommand("solanaGlossary.openPlanner");
        }
      });
    void context.globalState.update("solanaGlossary.firstActivation", false);
  }
}

export function deactivate() {}
