import type { GlossaryTerm } from "../../../../src/types";

import {
  getAllTerms,
  getBuilderPath,
  getBuilderPathDetails,
  getBuilderPathTerms,
  getMentalModel,
  type BuilderPath,
} from "./glossary";
import type { Locale } from "./locales";

export type QuizQuestion = {
  id: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  termId: string;
};

export type LearningTrack = BuilderPath & {
  recommendedIndex: number;
  audience: string;
  outcome: string;
  questionCount: number;
};

function uniqueByTerm(terms: GlossaryTerm[]): GlossaryTerm[] {
  const seen = new Set<string>();
  return terms.filter((term) => {
    if (seen.has(term.id)) return false;
    seen.add(term.id);
    return true;
  });
}

function buildDistractors(term: GlossaryTerm, locale: Locale): string[] {
  const allTerms = getAllTerms(locale);
  const sameCategory = allTerms.filter(
    (candidate) => candidate.category === term.category && candidate.id !== term.id,
  );
  const adjacent = allTerms.filter(
    (candidate) =>
      candidate.id !== term.id &&
      ((candidate.aliases ?? []).some((alias) =>
        (term.aliases ?? []).includes(alias),
      ) ||
        candidate.term.split(/\s+/).length === term.term.split(/\s+/).length),
  );

  return uniqueByTerm([...sameCategory, ...adjacent])
    .slice(0, 3)
    .map((candidate) => candidate.term);
}

function rotateOptions(options: string[], seed: number): string[] {
  if (options.length === 0) return options;
  const offset = seed % options.length;
  return options.slice(offset).concat(options.slice(0, offset));
}

export function getLearningTracks(locale: Locale = "en"): LearningTrack[] {
  const recommendationOrder = ["runtime", "anchor", "defi", "agents"];

  return recommendationOrder
    .map((slug, index) => {
      const path = getBuilderPath(slug, locale);
      const details = getBuilderPathDetails(slug, locale);
      if (!path || !details) return null;

      return {
        ...path,
        recommendedIndex: index + 1,
        audience: details.audience,
        outcome: details.outcome,
        questionCount: Math.min(getBuilderPathTerms(path.slug, locale).length, 4),
      };
    })
    .filter((track): track is LearningTrack => Boolean(track));
}

export function getQuizQuestionsForPath(
  slug: string,
  locale: Locale = "en",
): QuizQuestion[] {
  const terms = getBuilderPathTerms(slug, locale).slice(0, 4);

  return terms.map((term, index) => {
    const distractors = buildDistractors(term, locale);
    const options = rotateOptions([term.term, ...distractors].slice(0, 4), index + 1);
    const mentalModel = getMentalModel(term, locale);

    return {
      id: `${slug}-${term.id}`,
      prompt: mentalModel,
      correctAnswer: term.term,
      options,
      explanation: mentalModel,
      termId: term.id,
    };
  });
}
