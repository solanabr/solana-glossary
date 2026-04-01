"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getTermById } from "@/lib/glossary";
import type { GlossaryTerm, Locale } from "@/lib/glossary";
import { useRouter } from "next/navigation";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  term: string;
  isCenter: boolean;
}

interface GraphLink {
  source: string;
  target: string;
}

export default function KnowledgeGraph({
  term,
  locale,
}: {
  term: GlossaryTerm;
  locale: Locale;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!ref.current || !term.related?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const W = ref.current.clientWidth || 400;
    const H = 220;

    const nodes: GraphNode[] = [
      { id: term.id, term: term.term, isCenter: true },
      ...term.related.slice(0, 8).map((id) => {
        const t = getTermById(id, locale);
        return { id, term: t?.term ?? id, isCenter: false };
      }),
    ];

    const links: GraphLink[] = term.related.slice(0, 8).map((id) => ({
      source: term.id,
      target: id,
    }));

    const sim = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => (d as GraphNode).id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(W / 2, H / 2));

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(247,234,203,0.1)")
      .attr("stroke-width", 1);

    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", (d) => (d.isCenter ? "default" : "pointer"))
      .on("click", (_, d) => {
        if (!d.isCenter) router.push(`/term/${d.id}`);
      });

    node
      .append("circle")
      .attr("r", (d) => (d.isCenter ? 20 : 14))
      .attr("fill", (d) =>
        d.isCenter ? "rgba(255,210,63,0.15)" : "rgba(247,234,203,0.04)"
      )
      .attr("stroke", (d) => (d.isCenter ? "#ffd23f" : "rgba(247,234,203,0.15)"))
      .attr("stroke-width", (d) => (d.isCenter ? 1.5 : 1));

    node
      .append("text")
      .text((d) => (d.term.length > 10 ? d.term.slice(0, 10) + "…" : d.term))
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", (d) => (d.isCenter ? "#ffd23f" : "rgba(247,234,203,0.5)"))
      .style("font-size", (d) => (d.isCenter ? "9px" : "8px"))
      .style("pointer-events", "none");

    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as unknown as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as unknown as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as unknown as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as unknown as GraphNode).y ?? 0);
      node.attr(
        "transform",
        (d) => `translate(${d.x ?? 0},${d.y ?? 0})`
      );
    });

    return () => {
      sim.stop();
    };
  }, [term, locale, router]);

  if (!term.related?.length) return null;

  return (
    <div className="mt-6">
      <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">
        Grafo de conhecimento
      </p>
      <div className="border border-border rounded overflow-hidden">
        <svg ref={ref} className="w-full" style={{ height: 220 }} />
      </div>
      <p className="text-[9px] text-text-dim mt-1">Clique em um nó para navegar ao termo</p>
    </div>
  );
}
