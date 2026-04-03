import * as vscode from "vscode";
import {
  searchTerms,
  getCategories,
  getTermsByCategory,
  getRandomTerm,
  getLocalizedTerm,
  getTermById,
  GlossaryTerm,
} from "./glossaryLoader";

/**
 * Command: Search Term — fuzzy search with QuickPick
 */
export async function searchTermCommand(): Promise<void> {
  const locale = vscode.workspace
    .getConfiguration("solanaGlossary")
    .get<string>("language", "en");

  const pick = vscode.window.createQuickPick();
  pick.placeholder = "Search 1001 Solana terms...";
  pick.matchOnDescription = true;
  pick.matchOnDetail = true;

  pick.onDidChangeValue((query) => {
    if (query.length < 2) {
      pick.items = [];
      return;
    }

    const results = searchTerms(query, 15);
    pick.items = results.map((term) => {
      const localized = getLocalizedTerm(term, locale);
      return {
        label: `$(symbol-keyword) ${localized.term}`,
        description: formatCategory(term.category),
        detail: truncate(localized.definition, 120),
        termId: term.id,
      } as vscode.QuickPickItem & { termId: string };
    });
  });

  pick.onDidAccept(() => {
    const selected = pick.selectedItems[0] as
      | (vscode.QuickPickItem & { termId: string })
      | undefined;
    if (selected?.termId) {
      showTermPanel(selected.termId, locale);
    }
    pick.hide();
  });

  pick.show();
}

/**
 * Command: Random Term — show a random glossary term
 */
export async function randomTermCommand(): Promise<void> {
  const locale = vscode.workspace
    .getConfiguration("solanaGlossary")
    .get<string>("language", "en");

  const term = getRandomTerm();
  if (!term) {
    vscode.window.showWarningMessage("Glossary not loaded yet.");
    return;
  }

  showTermPanel(term.id, locale);
}

/**
 * Command: Browse by Category — pick a category, then a term
 */
export async function browseCategoryCommand(): Promise<void> {
  const locale = vscode.workspace
    .getConfiguration("solanaGlossary")
    .get<string>("language", "en");

  const categories = getCategories();
  if (categories.length === 0) {
    vscode.window.showWarningMessage("Glossary not loaded yet.");
    return;
  }

  const catPick = await vscode.window.showQuickPick(
    categories.map((c) => ({
      label: `$(folder) ${formatCategory(c.category)}`,
      description: `${c.count} terms`,
      category: c.category,
    })),
    { placeHolder: "Select a category" }
  );

  if (!catPick) return;

  const terms = getTermsByCategory(
    (catPick as typeof catPick & { category: string }).category
  );
  const termPick = await vscode.window.showQuickPick(
    terms.map((t) => {
      const localized = getLocalizedTerm(t, locale);
      return {
        label: localized.term,
        detail: truncate(localized.definition, 100),
        termId: t.id,
      };
    }),
    { placeHolder: `Terms in ${formatCategory((catPick as typeof catPick & { category: string }).category)}` }
  );

  if (termPick) {
    showTermPanel(
      (termPick as typeof termPick & { termId: string }).termId,
      locale
    );
  }
}

/**
 * Show a full term detail in an information message + output channel.
 */
function showTermPanel(termId: string, locale: string): void {
  const term = getTermById(termId);
  if (!term) return;

  const localized = getLocalizedTerm(term, locale);

  const lines = [
    `📘 ${localized.term}`,
    `Category: ${formatCategory(term.category)}`,
    "",
    localized.definition,
  ];

  if (term.aliases && term.aliases.length > 0) {
    lines.push("", `Aliases: ${term.aliases.join(", ")}`);
  }

  if (term.related && term.related.length > 0) {
    const relatedNames = term.related
      .map((id) => {
        const rel = getTermById(id);
        return rel ? rel.term : id;
      })
      .join(", ");
    lines.push("", `Related: ${relatedNames}`);
  }

  // Show in output channel for full detail
  const channel = vscode.window.createOutputChannel("Solana Glossary", {
    log: true,
  });
  channel.appendLine("═".repeat(60));
  lines.forEach((l) => channel.appendLine(l));
  channel.appendLine("═".repeat(60));
  channel.show(true);

  // Also show a quick notification
  vscode.window.showInformationMessage(
    `${localized.term}: ${truncate(localized.definition, 200)}`
  );
}

function formatCategory(cat: string): string {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len - 1) + "…" : str;
}
