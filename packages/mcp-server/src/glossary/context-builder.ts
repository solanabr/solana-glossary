import type { Locale, LocalizedGlossaryTerm } from "../types/glossary.js";
import { getRelatedTerms, getTermsSafe } from "./loader.js";

export interface MultiTermContext {
  anchorTerms: LocalizedGlossaryTerm[];
  relatedTerms: LocalizedGlossaryTerm[];
  nextSteps: LocalizedGlossaryTerm[];
  aliases: string[];
  totalTokenEstimate: number;
}

export function getMultiTermContext(
  ids: string[],
  locale: Locale = "en",
  options: { maxRelated?: number; maxNextSteps?: number } = {},
): MultiTermContext {
  const maxRelated = options.maxRelated ?? 8;
  const maxNextSteps = options.maxNextSteps ?? 5;
  const anchorTerms = getTermsSafe(ids, locale);

  const relatedIds = new Set<string>();
  const nextStepIds = new Set<string>();
  const aliases = new Set<string>();

  for (const term of anchorTerms) {
    for (const alias of term.aliases ?? []) aliases.add(alias);

    const related = getRelatedTerms(term.id, locale);
    for (const candidate of related.slice(0, maxRelated)) {
      if (!ids.includes(candidate.id)) relatedIds.add(candidate.id);
    }

    for (const next of related.slice(0, maxNextSteps)) {
      if (!ids.includes(next.id)) nextStepIds.add(next.id);
    }
  }

  const relatedTerms = getTermsSafe([...relatedIds], locale);
  const nextSteps = getTermsSafe([...nextStepIds], locale).slice(0, maxNextSteps);
  const contextText = formatContextForPrompt({
    anchorTerms,
    relatedTerms,
    nextSteps,
    aliases: [...aliases],
    totalTokenEstimate: 0,
  });

  return {
    anchorTerms,
    relatedTerms,
    nextSteps,
    aliases: [...aliases],
    totalTokenEstimate: Math.ceil(contextText.length / 4),
  };
}

export function formatContextForPrompt(context: MultiTermContext): string {
  const lines: string[] = ["=== GLOSSARY CONTEXT ===", "", "ANCHOR TERMS:"];

  for (const term of context.anchorTerms) {
    const aliasText = term.aliases?.length ? ` Aliases: ${term.aliases.join(", ")}.` : "";
    lines.push(`- ${term.term} [${term.id}] (${term.category}): ${term.definition}${aliasText}`);
  }

  lines.push("", "RELATED TERMS:");
  for (const term of context.relatedTerms) {
    lines.push(`- ${term.term} [${term.id}]: ${term.definition}`);
  }

  if (context.nextSteps.length > 0) {
    lines.push("", "NEXT TERMS TO EXPLORE:");
    for (const term of context.nextSteps) {
      lines.push(`- ${term.term} [${term.id}]`);
    }
  }

  lines.push("", "=== END GLOSSARY CONTEXT ===");
  return lines.join("\n");
}
