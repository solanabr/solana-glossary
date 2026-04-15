import * as vscode from "vscode";
import {
  lookupWord,
  getLocalizedTerm,
  getTermById,
  GlossaryTerm,
} from "./glossaryLoader";

/**
 * Word pattern that matches identifiers in code:
 * - snake_case: program_derived_address
 * - kebab-case: proof-of-history
 * - PascalCase/camelCase: AccountInfo
 * - UPPER_CASE: CPI
 * - simple words: rent, epoch, slot
 */
const WORD_PATTERN = /[a-zA-Z][a-zA-Z0-9_-]*/;

export class SolanaGlossaryHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    const config = vscode.workspace.getConfiguration("solanaGlossary");
    if (!config.get<boolean>("enableHover", true)) return undefined;

    const wordRange = document.getWordRangeAtPosition(position, WORD_PATTERN);
    if (!wordRange) return undefined;

    const word = document.getText(wordRange);
    if (word.length < 2) return undefined;

    // Try direct lookup
    let term = lookupWord(word);

    // Try splitting camelCase/PascalCase → e.g. "AccountInfo" → "account-info"
    if (!term) {
      const kebab = word
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/_/g, "-")
        .toLowerCase();
      if (kebab !== word.toLowerCase()) {
        term = lookupWord(kebab);
      }
    }

    if (!term) return undefined;

    const locale = config.get<string>("language", "en");
    const showCategory = config.get<boolean>("showCategory", true);
    const showRelated = config.get<boolean>("showRelated", true);

    const md = buildHoverMarkdown(term, locale, showCategory, showRelated);
    return new vscode.Hover(md, wordRange);
  }
}

function buildHoverMarkdown(
  term: GlossaryTerm,
  locale: string,
  showCategory: boolean,
  showRelated: boolean
): vscode.MarkdownString {
  const localized = getLocalizedTerm(term, locale);
  const md = new vscode.MarkdownString();
  md.supportHtml = true;
  md.isTrusted = true;

  // Title + category badge
  let header = `**📘 ${localized.term}**`;
  if (showCategory) {
    const categoryLabel = formatCategory(term.category);
    header += ` &nbsp; \`${categoryLabel}\``;
  }
  md.appendMarkdown(header + "\n\n");

  // Definition
  md.appendMarkdown(localized.definition + "\n\n");

  // Aliases
  if (term.aliases && term.aliases.length > 0) {
    md.appendMarkdown(
      `*Aliases: ${term.aliases.map((a) => `\`${a}\``).join(", ")}*\n\n`
    );
  }

  // Related terms
  if (showRelated && term.related && term.related.length > 0) {
    const relatedNames = term.related
      .slice(0, 6)
      .map((id) => {
        const rel = getTermById(id);
        return rel ? rel.term : id;
      })
      .join(", ");

    md.appendMarkdown(`*Related: ${relatedNames}*\n\n`);
  }

  // Footer
  md.appendMarkdown(
    `---\n*Solana Glossary — [${term.id}](https://github.com/solanabr/solana-glossary)*`
  );

  return md;
}

function formatCategory(cat: string): string {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
