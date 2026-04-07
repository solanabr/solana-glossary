import * as vscode from "vscode";

import { getLocalTerms } from "../api/local-glossary";

export class GlossaryCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(): vscode.ProviderResult<vscode.CompletionItem[]> {
    return getLocalTerms().slice(0, 100).map((term) => {
      const item = new vscode.CompletionItem(term.term, vscode.CompletionItemKind.Keyword);
      item.detail = term.id;
      item.documentation = term.definition;
      item.insertText = term.id;
      return item;
    });
  }
}
