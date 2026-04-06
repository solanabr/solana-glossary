import type { GlossaryTerm, Category } from "../glossary/index.js";
import { getTermLocalized } from "../glossary/index.js";

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const ACRONYMS: Record<string, string> = {
  zk: "ZK",
  ai: "AI",
  ml: "ML",
  defi: "DeFi",
};

const DOCS_LINK_CATEGORIES = new Set([
  "core-protocol",
  "infrastructure",
  "network",
  "defi",
]);

export function formatCategoryName(category: string): string {
  return category
    .split("-")
    .map(
      (word) => ACRONYMS[word] ?? word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

export function formatTermCard(
  term: GlossaryTerm,
  t: TranslateFn,
  locale?: string,
): string {
  let displayTerm = term.term;
  let displayDefinition = term.definition;

  if (locale && (locale === "pt" || locale === "es")) {
    const localized = getTermLocalized(term.id, locale);
    if (localized) {
      displayTerm = localized.term;
      displayDefinition = localized.definition;
    }
  }

  const lines: string[] = [
    `📖 <b>${escapeHtml(displayTerm)}</b>`,
    `🏷️ <i>${formatCategoryName(term.category)}</i>`,
    "",
    escapeHtml(displayDefinition),
  ];

  if (term.aliases && term.aliases.length > 0) {
    lines.push(
      "",
      `${t("term-aliases")}: ${term.aliases.map((a: string) => `<code>${escapeHtml(a)}</code>`).join(", ")}`,
    );
  }

  if (term.related && term.related.length > 0) {
    const shown = term.related.slice(0, 5);
    lines.push(
      `${t("term-related")}: ${shown.map((r: string) => `<code>${escapeHtml(r)}</code>`).join(" · ")}`,
    );
  }

  if (DOCS_LINK_CATEGORIES.has(term.category)) {
    const docsUrl = `https://solana.com/docs/terminology#${term.id}`;
    lines.push("", `🔗 <a href="${docsUrl}">${t("term-read-more-label")}</a>`);
  }

  return lines.join("\n");
}

export function formatCategoryList(
  categories: Category[],
  t: TranslateFn,
): string {
  const rows = categories.map(
    (cat) => `• <b>${formatCategoryName(cat)}</b> - <code>${cat}</code>`,
  );
  return `${t("categories-header")}\n\n${rows.join("\n")}`;
}

export function formatTermList(terms: GlossaryTerm[], header: string): string {
  const rows = terms.map(
    (term) => `• <b>${escapeHtml(term.term)}</b> - <code>${term.id}</code>`,
  );
  return truncateAtLine(`${header}\n\n${rows.join("\n")}`, 4000);
}

export function truncateAtLine(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastNewline = slice.lastIndexOf("\n");
  const safe = lastNewline > 0 ? slice.slice(0, lastNewline) : slice;
  return safe + "\n...";
}
