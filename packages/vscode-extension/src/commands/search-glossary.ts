import * as vscode from "vscode";

import { DEFAULT_API_BASE_URL } from "../config/constants";
import { searchLocalGlossary } from "../api/local-glossary";

export async function searchGlossaryCommand(): Promise<void> {
  const quickPick = vscode.window.createQuickPick();
  quickPick.title = "Search Solana Glossary";
  quickPick.placeholder = "Type a Solana concept, alias, or acronym";
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;
  quickPick.items = searchLocalGlossary("", 40).map((item) => ({
    label: item.term,
    description: item.id,
    detail: item.definition,
    termId: item.id,
  }));

  const updateItems = (value: string) => {
    quickPick.items = searchLocalGlossary(value, 40).map((item) => ({
      label: item.term,
      description: item.id,
      detail: item.definition,
      termId: item.id,
    }));
  };

  const term = await new Promise<{ termId: string } | undefined>((resolve) => {
    quickPick.onDidChangeValue(updateItems);
    quickPick.onDidAccept(() => resolve(quickPick.selectedItems[0]));
    quickPick.onDidHide(() => resolve(undefined));
    quickPick.show();
  });
  quickPick.dispose();

  if (!term) return;
  await vscode.env.openExternal(vscode.Uri.parse(`${DEFAULT_API_BASE_URL}/en/term/${term.termId}`));
}
