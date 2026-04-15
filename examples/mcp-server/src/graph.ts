/**
 * Relation Graph Engine
 * 
 * Builds an in-memory adjacency list from glossary cross-references
 * and provides BFS/DFS traversal for concept exploration and learning paths.
 */

import {
  allTerms,
  getTerm,
  type GlossaryTerm,
} from "@stbr/solana-glossary";

export interface GraphNode {
  id: string;
  term: string;
  category: string;
  neighbors: string[];
}

export interface PathResult {
  found: boolean;
  path: GlossaryTerm[];
  distance: number;
}

export interface ExplainResult {
  root: GlossaryTerm;
  relatedTerms: GlossaryTerm[];
  depth: number;
  totalExplored: number;
}

// Build adjacency list once at import time
const adjacency = new Map<string, Set<string>>();

for (const term of allTerms) {
  if (!adjacency.has(term.id)) {
    adjacency.set(term.id, new Set());
  }
  for (const relId of term.related ?? []) {
    adjacency.get(term.id)!.add(relId);
    // Make edges bidirectional for better path finding
    if (!adjacency.has(relId)) {
      adjacency.set(relId, new Set());
    }
    adjacency.get(relId)!.add(term.id);
  }
}

/**
 * BFS to find shortest path between two terms in the relation graph.
 */
export function findLearningPath(fromId: string, toId: string, maxDepth = 10): PathResult {
  const fromTerm = getTerm(fromId);
  const toTerm = getTerm(toId);

  if (!fromTerm || !toTerm) {
    return { found: false, path: [], distance: -1 };
  }

  if (fromTerm.id === toTerm.id) {
    return { found: true, path: [fromTerm], distance: 0 };
  }

  // BFS
  const visited = new Set<string>([fromTerm.id]);
  const parent = new Map<string, string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: fromTerm.id, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.depth >= maxDepth) continue;

    const neighbors = adjacency.get(current.id) ?? new Set();
    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      parent.set(neighborId, current.id);

      if (neighborId === toTerm.id) {
        // Reconstruct path
        const path: GlossaryTerm[] = [];
        let cur: string | undefined = toTerm.id;
        while (cur !== undefined) {
          const t = getTerm(cur);
          if (t) path.unshift(t);
          cur = parent.get(cur);
        }
        return { found: true, path, distance: path.length - 1 };
      }

      queue.push({ id: neighborId, depth: current.depth + 1 });
    }
  }

  return { found: false, path: [], distance: -1 };
}

/**
 * DFS with depth limit to explore related concepts from a root term.
 */
export function explainConcept(termId: string, maxDepth = 2): ExplainResult {
  const rootTerm = getTerm(termId);
  if (!rootTerm) {
    return { root: { id: termId, term: termId, definition: "Term not found.", category: "core-protocol" as any }, relatedTerms: [], depth: 0, totalExplored: 0 };
  }

  const visited = new Set<string>([rootTerm.id]);
  const relatedTerms: GlossaryTerm[] = [];

  function dfs(currentId: string, depth: number) {
    if (depth >= maxDepth) return;
    const neighbors = adjacency.get(currentId) ?? new Set();
    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      const t = getTerm(neighborId);
      if (t) {
        relatedTerms.push(t);
        dfs(neighborId, depth + 1);
      }
    }
  }

  dfs(rootTerm.id, 0);

  return {
    root: rootTerm,
    relatedTerms,
    depth: maxDepth,
    totalExplored: visited.size,
  };
}

/**
 * Get graph statistics
 */
export function getGraphStats() {
  let totalEdges = 0;
  let maxDegree = 0;
  let isolatedNodes = 0;

  for (const [, neighbors] of adjacency) {
    totalEdges += neighbors.size;
    if (neighbors.size > maxDegree) maxDegree = neighbors.size;
    if (neighbors.size === 0) isolatedNodes++;
  }

  return {
    totalNodes: adjacency.size,
    totalEdges: totalEdges / 2, // bidirectional
    maxDegree,
    isolatedNodes,
    averageDegree: +(totalEdges / adjacency.size).toFixed(2),
  };
}

/**
 * Get the most connected terms (hub terms)
 */
export function getHubTerms(limit = 10): Array<{ term: GlossaryTerm; connections: number }> {
  const entries: Array<{ id: string; connections: number }> = [];
  for (const [id, neighbors] of adjacency) {
    entries.push({ id, connections: neighbors.size });
  }
  entries.sort((a, b) => b.connections - a.connections);

  return entries.slice(0, limit).map((e) => {
    const t = getTerm(e.id)!;
    return { term: t, connections: e.connections };
  }).filter((e) => e.term !== undefined);
}
