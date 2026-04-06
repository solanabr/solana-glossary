// services/i18nService.js
// Loads Portuguese (pt) and Spanish (es) translations from data/i18n/*.json
// and provides localized term lookups.
//
// Usage:  dig @127.0.0.1 -p 5300 pt.proof-of-history +short
//         dig @127.0.0.1 -p 5300 es.pda             +short

import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getTerm } from "../loader.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_DIR = join(__dirname, "../../../data/i18n");

const localeCache = {};
const LOCALE_NAMES = { pt: "Portuguese (pt-BR)", es: "Spanish (es)" };
const DIVIDER_THICK = "============================================================";
const DIVIDER_THIN  = "------------------------------------------------------------";

// Strip accented characters to plain ASCII for clean dig output
// e.g. "Epoca" instead of garbled bytes for "Época"
function toAscii(str) {
  return str
    .normalize("NFD")                   // decompose: É → E + combining accent
    .replace(/[\u0300-\u036f]/g, "")   // strip combining diacritical marks
    .replace(/[^\x00-\x7F]/g, "?");    // replace any remaining non-ASCII with '?'
}

// Replace Unicode dash characters with plain ASCII hyphen
function cleanDashes(str) {
  return str.replace(/[\u2013\u2014\u2015]/g, "-");
}

// Wrap text into lines of max width
function wrapText(text, width = 58, indent = "  ") {
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

// Load a locale file once and cache it
async function loadLocale(locale) {
  if (localeCache[locale]) return localeCache[locale];
  try {
    const raw = await readFile(join(I18N_DIR, `${locale}.json`), "utf-8");
    localeCache[locale] = JSON.parse(raw);
    console.log(`Loaded ${locale} locale: ${Object.keys(localeCache[locale]).length} translated terms`);
    return localeCache[locale];
  } catch (err) {
    console.error(`Failed to load locale "${locale}": ${err.message}`);
    return null;
  }
}

// Get a term in the given locale (falls back to English if no translation)
export async function getLocalizedTerm(locale, termId) {
  const supportedLocales = ["pt", "es"];

  if (!supportedLocales.includes(locale)) {
    return [
      DIVIDER_THICK,
      `  Unsupported locale: "${locale}"`,
      DIVIDER_THIN,
      "  Supported locales: pt (Portuguese), es (Spanish)",
      "  Usage: dig @<ip> -p 5300 pt.<term-id> +short",
      DIVIDER_THICK,
    ];
  }

  // Look up base term (validates the term exists)
  const baseTerm = getTerm(termId);
  if (!baseTerm) {
    return [
      DIVIDER_THICK,
      `  Term not found: "${termId}"`,
      DIVIDER_THIN,
      `  Usage: dig @<ip> -p 5300 ${locale}.<term-id> +short`,
      DIVIDER_THICK,
    ];
  }

  // Load locale file
  const translations = await loadLocale(locale);
  const translation = translations ? translations[baseTerm.id] : null;

  // Use translated term/definition if available, else fall back to English
  // Convert to ASCII so dig renders cleanly (no garbled bytes)
  const displayTerm = toAscii(translation?.term ?? baseTerm.term);
  const displayDef  = cleanDashes(translation?.definition ?? baseTerm.definition);
  const isTranslated = !!translation;
  const localeName  = LOCALE_NAMES[locale] || locale;

  const lines = [];
  lines.push(DIVIDER_THICK);
  lines.push(`  ${displayTerm.toUpperCase()}`);
  lines.push(DIVIDER_THICK);
  lines.push(`  ID       : ${baseTerm.id}`);
  lines.push(`  Language : ${localeName}${isTranslated ? "" : " (no translation yet -- showing English)"}`);
  lines.push(`  Category : ${baseTerm.category}`);
  if (baseTerm.aliases && baseTerm.aliases.length > 0) {
    lines.push(`  Aliases  : ${baseTerm.aliases.join(", ")}`);
  }
  lines.push(DIVIDER_THIN);
  lines.push(...wrapText(displayDef, 60, "  "));
  lines.push(DIVIDER_THIN);
  if (baseTerm.related && baseTerm.related.length > 0) {
    lines.push(`  Related  : ${baseTerm.related.join(" | ")}`);
  }
  lines.push(DIVIDER_THICK);

  return lines;
}
