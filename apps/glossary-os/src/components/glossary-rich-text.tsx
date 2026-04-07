import type { ReactNode } from "react";
import Link from "next/link";

import type { CopilotLinkedTerm } from "@/lib/copilot-types";
import type { Locale } from "@/lib/locales";
import { withLocale } from "@/lib/routes";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPhraseMap(terms: CopilotLinkedTerm[]) {
  const phraseMap = new Map<string, CopilotLinkedTerm>();

  for (const term of terms) {
    const phrases = [term.label, ...term.aliases]
      .map((phrase) => phrase.trim())
      .filter(Boolean)
      .sort((left, right) => right.length - left.length);

    for (const phrase of phrases) {
      const key = phrase.toLowerCase();
      if (!phraseMap.has(key)) {
        phraseMap.set(key, term);
      }
    }
  }

  return phraseMap;
}

function linkifyLine(line: string, locale: Locale, terms: CopilotLinkedTerm[]) {
  if (!line.trim() || terms.length === 0) {
    return line;
  }

  const phraseMap = buildPhraseMap(terms);
  const patterns = [...phraseMap.keys()].sort((left, right) => right.length - left.length);
  if (patterns.length === 0) {
    return line;
  }

  const matcher = new RegExp(patterns.map(escapeRegex).join("|"), "gi");
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = matcher.exec(line);
  let key = 0;

  while (match) {
    const index = match.index;
    const matchedText = match[0];
    const linkedTerm = phraseMap.get(matchedText.toLowerCase());

    if (index > lastIndex) {
      nodes.push(line.slice(lastIndex, index));
    }

    if (linkedTerm) {
      nodes.push(
        <Link
          className="copilot-inline-link"
          href={withLocale(locale, `/term/${linkedTerm.id}`)}
          key={`${linkedTerm.id}-${key}`}
        >
          {matchedText}
        </Link>,
      );
      key += 1;
    } else {
      nodes.push(matchedText);
    }

    lastIndex = index + matchedText.length;
    match = matcher.exec(line);
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes;
}

export function GlossaryRichText({
  locale,
  terms,
  text,
}: {
  locale: Locale;
  terms: CopilotLinkedTerm[];
  text: string;
}) {
  const lines = text.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="copilot-rich-text">
      {lines.map((line, index) => (
        <p key={`${index}-${line.slice(0, 24)}`}>{linkifyLine(line, locale, terms)}</p>
      ))}
    </div>
  );
}
