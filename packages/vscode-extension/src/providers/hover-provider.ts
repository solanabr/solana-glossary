import * as vscode from "vscode";

import { getSettings } from "../config/settings";
import { DEFAULT_API_BASE_URL } from "../config/constants";
import { getLocalTerm, getRelatedLocalTerms } from "../api/local-glossary";

export class GlossaryHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return null;

    const word = document.getText(wordRange);
    const term = getLocalTerm(word);
    if (!term) return null;

    const maxRelated = getSettings().hoverMaxRelatedTerms;
    const related = getRelatedLocalTerms(term, maxRelated);
    const markdown = new vscode.MarkdownString(undefined, true);
    markdown.isTrusted = true;
    markdown.appendMarkdown(`### ${term.term}\n\n`);
    markdown.appendMarkdown(`${term.definition}\n\n`);
    markdown.appendMarkdown(`Category: \`${term.category}\`\n\n`);

    if (related.length > 0) {
      markdown.appendMarkdown(`Related: ${related.map((item) => `\`${item.term}\``).join(", ")}\n\n`);
    }

    markdown.appendMarkdown(`[Open in Glossary OS](${DEFAULT_API_BASE_URL}/en/term/${term.id})`);
    return new vscode.Hover(markdown, wordRange);
  }
}
