// services/termService.js
// Formats a glossary term as a pretty array of strings for DNS TXT output.
// Each item in the returned array becomes one TXT record answer in the DNS response.

const DIVIDER_THICK = "============================================================";
const DIVIDER_THIN  = "------------------------------------------------------------";

// Wrap long text into lines of max `width` characters, with optional indent
function wrapText(text, width = 60, indent = "  ") {
  const words = text.split(" ");
  const lines = [];
  let current = indent;

  for (const word of words) {
    if ((current + word).length > width) {
      lines.push(current.trimEnd());
      current = indent + word + " ";
    } else {
      current += word + " ";
    }
  }
  if (current.trim()) lines.push(current.trimEnd());
  return lines;
}

// Format a full term for DNS output
export function formatTerm(term) {
  const lines = [];

  lines.push(DIVIDER_THICK);
  lines.push(`  ${term.term.toUpperCase()}`);
  lines.push(DIVIDER_THICK);

  // Category & Aliases
  lines.push(`  Category : ${term.category}`);
  if (term.aliases && term.aliases.length > 0) {
    lines.push(`  Aliases  : ${term.aliases.join(", ")}`);
  }

  lines.push(DIVIDER_THIN);

  // Definition — wrap at 60 chars
  const defLines = wrapText(term.definition, 60, "  ");
  lines.push(...defLines);

  lines.push(DIVIDER_THIN);

  // Related terms
  if (term.related && term.related.length > 0) {
    lines.push(`  Related  : ${term.related.join(" | ")}`);
  } else {
    lines.push("  Related  : (none)");
  }

  lines.push(DIVIDER_THICK);

  return lines;
}

// Compact one-liner for use in lists
export function formatTermCompact(term) {
  const short = term.definition.length > 80
    ? term.definition.slice(0, 77) + "..."
    : term.definition;
  return `[${term.category}] ${term.term} — ${short}`;
}

// "Not found" response
export function termNotFound(query) {
  return [
    DIVIDER_THICK,
    `  Term not found: "${query}"`,
    DIVIDER_THIN,
    "  Tips:",
    `  - Use kebab-case IDs  e.g. proof-of-history`,
    `  - Or try an alias    e.g. poh, AMM, PDA`,
    `  - Browse a category  e.g. find.defi`,
    `  - See all options    dig @<ip> -p 5353 glossary.help +short`,
    DIVIDER_THICK,
  ];
}
