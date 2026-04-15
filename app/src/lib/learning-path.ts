import { getTerm } from "@stbr/solana-glossary";
import type { GlossaryTerm } from "@stbr/solana-glossary";

/**
 * Generate a learning path starting from a term, using BFS on the related-terms graph.
 * Returns an ordered list of terms from foundational to advanced.
 */
export function generateLearningPath(
  startTermId: string,
  allTerms: GlossaryTerm[],
  maxSteps = 8,
): GlossaryTerm[] {
  const termMap = new Map(allTerms.map((t) => [t.id, t]));
  const start = termMap.get(startTermId);
  if (!start) return [];

  const visited = new Set<string>();
  const queue: string[] = [];
  const path: GlossaryTerm[] = [];

  queue.push(startTermId);
  visited.add(startTermId);

  while (queue.length > 0 && path.length < maxSteps) {
    const currentId = queue.shift()!;
    const current = termMap.get(currentId);
    if (!current) continue;

    path.push(current);

    for (const relId of current.related ?? []) {
      if (!visited.has(relId) && termMap.has(relId)) {
        visited.add(relId);
        queue.push(relId);
      }
    }
  }

  return path;
}

/**
 * Generate a topic cluster learning path from a starting term.
 * Builds a logical progression from simple to complex.
 */
export function generateTopicPath(
  startTerm: GlossaryTerm,
  allTerms: GlossaryTerm[],
  maxSteps = 8,
): { steps: LearningStep[] } {
  const path = generateLearningPath(startTerm.id, allTerms, maxSteps);

  return {
    steps: path.map((term, i) => ({
      number: i + 1,
      term,
      isStart: i === 0,
      isCurrent: false,
      isCompleted: false,
    })),
  };
}

export interface LearningStep {
  number: number;
  term: GlossaryTerm;
  isStart: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
}
