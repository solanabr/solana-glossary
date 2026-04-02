"use client";
import { useEffect, useRef } from "react";
import { getTerm, type GlossaryTerm } from "@stbr/solana-glossary";

type Props = {
  term: GlossaryTerm;
  color: string;
  onNodeClick: (id: string) => void;
};

export default function TermGraph({ term, color, onNodeClick }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !term.related?.length) return;

    const loadD3 = async () => {
      const d3 = await import("d3");
      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();

      const width = ref.current!.clientWidth || 400;
      const height = 220;

      // build nodes and links
      const nodes: { id: string; label: string; main: boolean }[] = [
        { id: term.id, label: term.term, main: true },
        ...(term.related || []).slice(0, 8).map((id) => ({
          id,
          label: getTerm(id)?.term || id,
          main: false,
        })),
      ];

      const links = (term.related || []).slice(0, 8).map((id) => ({
        source: term.id,
        target: id,
      }));

      const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide(40));

      // links
      const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", color + "44")
        .attr("stroke-width", 1.5);

      // nodes
      const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .style("cursor", (d: any) => d.main ? "default" : "pointer")
        .on("click", (_: any, d: any) => { if (!d.main) onNodeClick(d.id); });

      node.append("circle")
        .attr("r", (d: any) => d.main ? 10 : 6)
        .attr("fill", (d: any) => d.main ? color : color + "66")
        .attr("stroke", (d: any) => d.main ? color : color + "44")
        .attr("stroke-width", 2);

      node.append("text")
        .text((d: any) => d.label.length > 18 ? d.label.slice(0, 18) + "…" : d.label)
        .attr("text-anchor", "middle")
        .attr("dy", (d: any) => d.main ? -16 : -12)
        .attr("fill", "#e6edf3")
        .attr("font-size", (d: any) => d.main ? "11px" : "10px")
        .attr("font-family", "JetBrains Mono, monospace")
        .style("pointer-events", "none");

      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });
    };

    loadD3();
  }, [term, color, onNodeClick]);

  if (!term.related?.length) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 8, fontFamily: "JetBrains Mono" }}>
        knowledge graph
      </div>
      <div style={{ background: "var(--bg-3)", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
        <svg ref={ref} width="100%" height="220" />
      </div>
      <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 6, fontFamily: "JetBrains Mono" }}>
        click any node to navigate
      </div>
    </div>
  );
}
