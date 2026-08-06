import { type GlossaryTerm } from "@stbr/solana-glossary";

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

  // BFS from the start term, following related links
  const visited = new Set<string>();
  const queue: string[] = [];
  const path: GlossaryTerm[] = [];

  // First, collect all related terms recursively to find "roots" (foundational terms)
  // We reverse-traverse: find terms that are prerequisites (terms whose related includes our start)
  const reverseMap = new Map<string, string[]>();
  for (const t of allTerms) {
    for (const rel of t.related ?? []) {
      if (!reverseMap.has(rel)) reverseMap.set(rel, []);
      reverseMap.get(rel)!.push(t.id);
    }
  }

  // BFS forward from start term
  queue.push(startTermId);
  visited.add(startTermId);

  while (queue.length > 0 && path.length < maxSteps) {
    const currentId = queue.shift()!;
    const current = termMap.get(currentId);
    if (!current) continue;

    path.push(current);

    // Add related terms to queue
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
 * Generate a "topic cluster" learning path - starts from a category or term
 * and builds a logical progression from simple to complex.
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
