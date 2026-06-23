import * as vscode from "vscode";
import { loadGlossary, getBundle } from "./glossaryLoader";
import { SolanaGlossaryHoverProvider } from "./hoverProvider";
import {
  searchTermCommand,
  randomTermCommand,
  browseCategoryCommand,
} from "./commands";

export function activate(context: vscode.ExtensionContext): void {
  // ── Load glossary data ──
  try {
    const bundle = loadGlossary(context.extensionPath);
    console.log(
      `Solana Glossary loaded: ${bundle.meta.totalTerms} terms, ${bundle.meta.categories.length} categories`
    );
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to load Solana Glossary: ${err instanceof Error ? err.message : err}`
    );
    return;
  }

  // ── Hover Provider ──
  const supportedLanguages = [
    "rust",
    "typescript",
    "javascript",
    "typescriptreact",
    "javascriptreact",
    "toml",
    "json",
    "jsonc",
    "markdown",
    "yaml",
    "plaintext",
  ];

  const hoverProvider = new SolanaGlossaryHoverProvider();

  for (const lang of supportedLanguages) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(
        { language: lang, scheme: "file" },
        hoverProvider
      )
    );
  }

  // ── Commands ──
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "solanaGlossary.searchTerm",
      searchTermCommand
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "solanaGlossary.randomTerm",
      randomTermCommand
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "solanaGlossary.browseCategory",
      browseCategoryCommand
    )
  );

  // ── Status Bar ──
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    50
  );

  const bundle = getBundle();
  statusBar.text = `$(book) ${bundle?.meta.totalTerms ?? 0} Solana terms`;
  statusBar.tooltip = "Click to search the Solana Glossary";
  statusBar.command = "solanaGlossary.searchTerm";
  statusBar.show();
  context.subscriptions.push(statusBar);
}

export function deactivate(): void {
  // cleanup if needed
}
