import * as vscode from "vscode";

export function extractSelectedCode(editor: vscode.TextEditor): string {
  const selection = editor.selection;
  if (!selection.isEmpty) {
    return editor.document.getText(selection);
  }

  return editor.document.lineAt(selection.active.line).text;
}

export function extractCurrentLine(editor: vscode.TextEditor): string {
  return editor.document.lineAt(editor.selection.active.line).text;
}
