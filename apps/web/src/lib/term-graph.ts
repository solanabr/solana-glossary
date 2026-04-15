import type { GlossaryTerm } from "./glossary";

export interface GraphNode {
  id: string;
  name: string;
  category: string;
  /** Visual radius hint */
  r: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

function neighborsOf(
  id: string,
  byId: Map<string, GlossaryTerm>,
  allTerms: GlossaryTerm[],
): string[] {
  const out = new Set<string>();
  const t = byId.get(id);
  if (t?.related) {
    for (const r of t.related) {
      if (byId.has(r)) out.add(r);
    }
  }
  for (const ot of allTerms) {
    if (ot.related?.includes(id)) out.add(ot.id);
  }
  return [...out];
}

/**
 * Builds an undirected subgraph: focus term + neighbors up to `depth` hops
 * along `related` edges (outgoing and reverse).
 */
export function buildRelationGraph(
  terms: GlossaryTerm[],
  focusId: string,
  depth: 1 | 2,
): { nodes: GraphNode[]; links: GraphLink[] } {
  const byId = new Map(terms.map((t) => [t.id, t]));
  if (!byId.has(focusId)) {
    return { nodes: [], links: [] };
  }

  const nodeIds = new Set<string>([focusId]);
  const linkKeys = new Set<string>();
  const links: GraphLink[] = [];

  const linkKey = (a: string, b: string) =>
    a < b ? `${a}::${b}` : `${b}::${a}`;

  function addEdge(a: string, b: string) {
    if (!byId.has(a) || !byId.has(b) || a === b) return;
    const k = linkKey(a, b);
    if (linkKeys.has(k)) return;
    linkKeys.add(k);
    links.push({ source: a, target: b });
  }

  let boundary = new Set<string>([focusId]);
  for (let hop = 0; hop < depth; hop++) {
    const nextBoundary = new Set<string>();
    for (const id of boundary) {
      for (const n of neighborsOf(id, byId, terms)) {
        addEdge(id, n);
        nodeIds.add(n);
        nextBoundary.add(n);
      }
    }
    boundary = nextBoundary;
  }

  const nodes: GraphNode[] = [...nodeIds].map((id) => {
    const t = byId.get(id)!;
    const isFocus = id === focusId;
    return {
      id,
      name: t.term,
      category: t.category,
      r: isFocus ? 22 : 14,
    };
  });

  return { nodes, links };
}

const DEFAULT_CATEGORY_COLOR = "#5c5c6a";

/** Solana-tinted palette by category slug. */
export const CATEGORY_GRAPH_COLORS: Record<string, string> = {
  "core-protocol": "#9945FF",
  "programming-model": "#00C2FF",
  defi: "#14F195",
  "token-ecosystem": "#F5A623",
  "solana-ecosystem": "#00FFA3",
  security: "#FF6B6B",
  network: "#7C7CF5",
  infrastructure: "#4ECDC4",
  "dev-tools": "#A78BFA",
  web3: "#94A3B8",
  "blockchain-general": "#64748B",
  "programming-fundamentals": "#38BDF8",
  "ai-ml": "#E879F9",
  "zk-compression": "#22D3EE",
};

export function graphColorForCategory(slug: string): string {
  return CATEGORY_GRAPH_COLORS[slug] ?? DEFAULT_CATEGORY_COLOR;
}
