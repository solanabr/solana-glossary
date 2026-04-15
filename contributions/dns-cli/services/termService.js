// services/termService.js
// Formats a glossary term as a pretty array of strings for DNS TXT output.
// Each item in the returned array becomes one TXT record answer in the DNS response.

const DIVIDER_THICK = "============================================================";
const DIVIDER_THIN  = "------------------------------------------------------------";

// Strip accented/non-ASCII characters to plain ASCII so dig renders them cleanly.
// e.g. "EPOCA" instead of garbled bytes for "ÉPOCA"
function toAscii(str) {
  return str
    .normalize("NFD")                     // decompose accented chars: É → E + combining accent
    .replace(/[\u0300-\u036f]/g, "")      // strip all combining diacritical marks
    .replace(/[^\x00-\x7F]/g, "?");       // replace any remaining non-ASCII with '?'
}

// Replace Unicode dashes with plain ASCII hyphen (prevents \226\128\148 in dig output)
function cleanDashes(str) {
  return str.replace(/[\u2013\u2014\u2015]/g, "-");  // en-dash, em-dash → -
}

// Wrap long text into lines of max `width` characters, with optional indent
function wrapText(text, width = 60, indent = "  ") {
  const safe = cleanDashes(text);
  const words = safe.split(" ");
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

  // Use ASCII-safe version of the term name for the heading
  const safeTermName = toAscii(term.term).toUpperCase();

  lines.push(DIVIDER_THICK);
  lines.push(`  ${safeTermName}`);
  lines.push(DIVIDER_THICK);

  // ID + Category + Aliases
  lines.push(`  ID       : ${term.id}`);
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
    ? cleanDashes(term.definition.slice(0, 77)) + "..."
    : cleanDashes(term.definition);
  return `[${term.category}] ${term.term} - ${short}`;
}

// "Not found" response
export function termNotFound(query) {
  return [
    DIVIDER_THICK,
    `  Term not found: "${query}"`,
    DIVIDER_THIN,
    "  Tips:",
    `  - Use kebab-case IDs  e.g. sol proof-of-history`,
    `  - Or try an alias    e.g. sol poh  |  sol amm  |  sol pda`,
    `  - Browse a category  e.g. sol find.defi`,
    `  - Keyword search     e.g. sol search.wallet`,
    `  - See all options    sol help`,
    DIVIDER_THICK,
  ];
}
