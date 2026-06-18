import { allTerms, type GlossaryTerm } from "@/lib/glossary";

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  val: number;
  term: GlossaryTerm;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function buildGraph(): GraphData {
  const termIds = new Set(allTerms.map((t) => t.id));

  const nodes: GraphNode[] = allTerms.map((t) => ({
    id: t.id,
    label: t.term,
    category: t.category,
    val: Math.max(1, (t.related?.length ?? 0) * 1.5 + 1),
    term: t,
  }));

  const links: GraphLink[] = [];
  const seen = new Set<string>();

  for (const t of allTerms) {
    for (const relId of t.related ?? []) {
      if (!termIds.has(relId)) continue;
      const key = [t.id, relId].sort().join("--");
      if (!seen.has(key)) {
        seen.add(key);
        links.push({ source: t.id, target: relId });
      }
    }
  }

  return { nodes, links };
}
