"use client";

import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { allTerms } from "@stbr/solana-glossary";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/categories";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#9945FF] border-t-transparent animate-spin" />
        <p className="text-[#A0A0B0] text-sm">Construindo grafo...</p>
      </div>
    </div>
  ),
});

interface HoveredNode {
  id: string;
  name: string;
  category: string;
}

export default function KnowledgeGraph({ locale = "pt" }: { locale?: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );
  const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: Math.round(width), h: Math.round(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const filtered =
      activeCategories.size > 0
        ? allTerms.filter((t) => activeCategories.has(t.category))
        : allTerms;

    const idSet = new Set(filtered.map((t) => t.id));
    const seenLinks = new Set<string>();

    const nodes = filtered.map((t) => ({
      id: t.id,
      name: t.term,
      category: t.category,
      color: CATEGORY_COLORS[t.category] ?? "#9945FF",
    }));

    const links: { source: string; target: string }[] = [];
    for (const t of filtered) {
      for (const relId of t.related ?? []) {
        if (!idSet.has(relId)) continue;
        const key = [t.id, relId].sort().join("\0");
        if (seenLinks.has(key)) continue;
        seenLinks.add(key);
        links.push({ source: t.id, target: relId });
      }
    }

    return { nodes, links };
  }, [activeCategories]);

  const searchedNodeId = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allTerms.find((t) => t.term.toLowerCase().includes(q))?.id ?? null;
  }, [searchQuery]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback(
    (node: any) => {
      router.push(`/termo/${node.id}?lang=${locale}`);
    },
    [router, locale],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(
      node ? { id: node.id, name: node.name, category: node.category } : null,
    );
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-white/8 shrink-0">
        <div className="relative w-full sm:w-64 shrink-0">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0A0B0]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar termo no grafo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-[#1A1A24] border border-white/8 py-2 pl-9 pr-3 text-sm text-white placeholder-[#A0A0B0] focus:outline-none focus:border-[#9945FF] transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategories.has(key)
                  ? "text-black"
                  : "bg-[#1A1A24] text-[#A0A0B0] border border-white/8 hover:text-white"
              }`}
              style={
                activeCategories.has(key)
                  ? { background: CATEGORY_COLORS[key] }
                  : {}
              }
            >
              {label}
            </button>
          ))}
          {activeCategories.size > 0 && (
            <button
              onClick={() => setActiveCategories(new Set())}
              className="rounded-full px-3 py-1 text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      {/* Graph */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <ForceGraph2D
          graphData={graphData}
          width={dims.w}
          height={dims.h}
          backgroundColor="#0F0F13"
          nodeRelSize={4}
          linkColor={() => "rgba(153,69,255,0.12)"}
          linkWidth={0.6}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          cooldownTicks={120}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const isHovered = hoveredNode?.id === node.id;
            const isSearched = searchedNodeId === node.id;
            const r = isHovered || isSearched ? 7 : 4;

            if (isSearched) {
              ctx.beginPath();
              ctx.arc(x, y, r + 5, 0, 2 * Math.PI);
              ctx.fillStyle = `${node.color}44`;
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle =
              isHovered || isSearched ? node.color : `${node.color}BB`;
            ctx.fill();

            if (globalScale > 2.5 || isHovered || isSearched) {
              const fontSize =
                isHovered || isSearched
                  ? Math.max(9 / globalScale, 6)
                  : Math.max(8 / globalScale, 4);
              ctx.font = `${isSearched ? "bold " : ""}${fontSize}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = "rgba(255,255,255,0.9)";
              ctx.fillText(node.name, x, y + r + 2);
            }
          }}
          nodeCanvasObjectMode={() => "replace"}
        />

        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 pointer-events-none bg-[#1A1A24] border border-white/8 rounded-xl px-4 py-3 shadow-xl">
            <p className="text-white text-sm font-semibold">
              {hoveredNode.name}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{
                color: CATEGORY_COLORS[hoveredNode.category] ?? "#9945FF",
              }}
            >
              {CATEGORY_LABELS[hoveredNode.category] ?? hoveredNode.category}
            </p>
            <p className="text-[#A0A0B0] text-xs mt-1">
              Clique para ver o termo
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="absolute bottom-4 right-4 bg-[#0F0F13]/80 backdrop-blur border border-white/8 rounded-xl px-4 py-2 text-xs text-[#A0A0B0]">
          <span className="text-white font-medium">
            {graphData.nodes.length}
          </span>{" "}
          termos ·{" "}
          <span className="text-white font-medium">
            {graphData.links.length}
          </span>{" "}
          conexões
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-[#0F0F13]/80 backdrop-blur border border-white/8 rounded-xl px-4 py-2 text-xs text-[#A0A0B0] hidden sm:block">
          Scroll para zoom · Arraste para navegar · Clique para ver o termo
        </div>
      </div>
    </div>
  );
}
