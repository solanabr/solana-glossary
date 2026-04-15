"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useChatContext } from "@/contexts/ChatContext";
import { useLocale } from "@/contexts/LocaleContext";
import type { Category } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface TermNode {
  id: string;
  term: string;
  category: Category;
  related: string[];
}

interface CategoryInfo {
  slug: Category;
  label: string;
  color: string;
}

interface GraphNode {
  id: string;
  name: string;
  category: Category;
  color: string;
  val: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface TooltipState {
  node: GraphNode;
  left: number;
  top: number;
}

export default function ExploreClient({
  terms,
  categories,
}: {
  terms: TermNode[];
  categories: CategoryInfo[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const { copy, getCategoryMeta, localizeTerm } = useLocale();
  const { openWithPrompt } = useChatContext();
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all",
  );
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const focusPendingRef = useRef<string | null>(null);
  const tooltipNodeRef = useRef<GraphNode | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const syncDimensions = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 140,
      });

    syncDimensions();
    window.addEventListener("resize", syncDimensions);
    return () => window.removeEventListener("resize", syncDimensions);
  }, []);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const category of categories) {
      map[category.slug] = category.color;
    }
    return map;
  }, [categories]);

  const localizedTerms = useMemo(
    () =>
      terms.map((term) => {
        const localized = localizeTerm({
          ...term,
          definition: "",
        });

        return {
          ...term,
          term: localized.term,
        };
      }),
    [localizeTerm, terms],
  );

  const graphData = useMemo(() => {
    const filtered =
      selectedCategory === "all"
        ? localizedTerms.filter((term) => term.related.length > 0)
        : localizedTerms.filter((term) => term.category === selectedCategory);

    const nodeIds = new Set(filtered.map((term) => term.id));

    const nodes: GraphNode[] = filtered.map((term) => ({
      id: term.id,
      name: term.term,
      category: term.category,
      color: colorMap[term.category] || "#666666",
      val: term.related.length + 1,
    }));

    const links: GraphLink[] = [];
    for (const term of filtered) {
      for (const relatedId of term.related) {
        if (nodeIds.has(relatedId)) {
          links.push({ source: term.id, target: relatedId });
        }
      }
    }

    return { nodes, links };
  }, [colorMap, localizedTerms, selectedCategory]);

  const scheduleHideTooltip = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      if (!tooltipHovered) {
        tooltipNodeRef.current = null;
        setTooltip(null);
      }
    }, 200);
  }, [tooltipHovered]);

  const cancelHideTooltip = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const updateTooltipPosition = useCallback(
    (node: GraphNode | null) => {
      cancelHideTooltip();

      if (!node) {
        scheduleHideTooltip();
        return;
      }

      tooltipNodeRef.current = node;

      if (
        typeof node.x !== "number" ||
        typeof node.y !== "number" ||
        !graphRef.current?.graph2ScreenCoords
      ) {
        scheduleHideTooltip();
        return;
      }

      const screen = graphRef.current.graph2ScreenCoords(node.x, node.y);
      const width = 248;
      const height = 122;
      const left = Math.min(
        Math.max(screen.x + 16, 12),
        window.innerWidth - width - 12,
      );
      const top = Math.min(
        Math.max(screen.y - 18, 76),
        window.innerHeight - height - 12,
      );

      setTooltip({ node, left, top });
    },
    [cancelHideTooltip, scheduleHideTooltip],
  );

  const focusNode = useCallback(
    (targetId: string | null) => {
      if (!targetId) return;

      const node = graphData.nodes.find((item) => item.id === targetId);
      if (!node) return;

      if (typeof node.x !== "number" || typeof node.y !== "number") {
        focusPendingRef.current = targetId;
        return;
      }

      focusPendingRef.current = null;
      graphRef.current?.centerAt(node.x, node.y, 500);
      graphRef.current?.zoom(3.2, 500);
    },
    [graphData.nodes],
  );

  useEffect(() => {
    if (!highlight) return;

    const highlighted = terms.find((term) => term.id === highlight);
    if (
      highlighted &&
      selectedCategory !== "all" &&
      highlighted.category !== selectedCategory
    ) {
      setSelectedCategory("all");
      return;
    }

    focusNode(highlight);
  }, [focusNode, highlight, selectedCategory, terms]);

  useEffect(() => {
    if (tooltipNodeRef.current) {
      updateTooltipPosition(tooltipNodeRef.current);
    }
  }, [dimensions, updateTooltipPosition]);

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (typeof node.x !== "number" || typeof node.y !== "number") return;

      const isHighlighted = node.id === highlight;
      const isHovered = tooltip?.node.id === node.id;
      const radius = Math.sqrt(node.val) * 2;
      const fontSize = Math.max(10 / globalScale, 1.5);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle =
        isHighlighted || isHovered ? "#ffffff" : `${node.color}cc`;
      ctx.fill();

      if (isHighlighted || isHovered) {
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }

      if (globalScale > 1.5 || isHighlighted || isHovered) {
        ctx.font = `${fontSize}px JetBrains Mono, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isHighlighted || isHovered ? "#ffffff" : "#ffffff99";
        ctx.fillText(node.name, node.x, node.y + radius + 2);
      }
    },
    [highlight, tooltip],
  );

  return (
    <div className="relative h-full">
      <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all ${
            selectedCategory === "all"
              ? "bg-white text-black"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          {copy.graph.all} (
          {terms.filter((term) => term.related.length > 0).length})
        </button>
        {categories.map((category) => {
          const meta = getCategoryMeta(category.slug);

          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => setSelectedCategory(category.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all ${
                selectedCategory === category.slug
                  ? "text-black"
                  : "text-white/75 hover:text-white"
              }`}
              style={{
                background:
                  selectedCategory === category.slug
                    ? meta.color
                    : `${meta.color}22`,
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="absolute right-4 top-4 z-20 rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-right text-xs text-muted backdrop-blur-md">
        <p>
          {graphData.nodes.length} {copy.graph.nodes}
        </p>
        <p>
          {graphData.links.length} {copy.graph.edges}
        </p>
      </div>

      {tooltip ? (
        <div
          className="fixed z-30"
          style={{
            left: tooltip.left,
            top: tooltip.top,
            width: 248,
          }}
          onMouseEnter={() => {
            cancelHideTooltip();
            setTooltipHovered(true);
          }}
          onMouseLeave={() => {
            setTooltipHovered(false);
            tooltipNodeRef.current = null;
            setTooltip(null);
          }}
        >
          <div className="rounded-[24px] border border-white/10 bg-[#101014]/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-white">
                  {tooltip.node.name}
                </p>
                <span
                  className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${getCategoryMeta(tooltip.node.category).color}22`,
                    color: getCategoryMeta(tooltip.node.category).color,
                  }}
                >
                  {getCategoryMeta(tooltip.node.category).label}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">{copy.graph.clickToView}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/term/${tooltip.node.id}`)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {copy.chat.openTerm}
              </button>
              <button
                type="button"
                onClick={() =>
                  openWithPrompt(
                    `Explain ${tooltip.node.name} and how it connects to nearby Solana concepts.`,
                    {
                      pageType: "graph",
                      focusId: tooltip.node.id,
                      focusLabel: tooltip.node.name,
                    },
                  )
                }
                className="rounded-full border border-solana-purple/20 bg-solana-purple/10 px-3 py-1.5 text-xs text-white transition-colors hover:border-solana-green/30 hover:bg-solana-green/12"
              >
                {copy.graph.askAi}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#0a0a0a"
        nodeCanvasObject={nodeCanvasObject as never}
        nodePointerAreaPaint={
          ((node: never, color: string, ctx: CanvasRenderingContext2D) => {
            const graphNode = node as GraphNode;
            if (
              typeof graphNode.x !== "number" ||
              typeof graphNode.y !== "number"
            ) {
              return;
            }

            const radius = Math.sqrt(graphNode.val) * 2 + 2;
            ctx.beginPath();
            ctx.arc(graphNode.x, graphNode.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }) as never
        }
        linkColor={() => "rgba(255,255,255,0.06)"}
        linkWidth={0.5}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        onNodeClick={
          ((node: never) => {
            const graphNode = node as GraphNode;
            router.push(`/term/${graphNode.id}`);
          }) as never
        }
        onNodeHover={
          ((node: never) =>
            updateTooltipPosition((node as GraphNode | null) ?? null)) as never
        }
        onZoom={
          (() => {
            if (tooltipNodeRef.current) {
              updateTooltipPosition(tooltipNodeRef.current);
            }
          }) as never
        }
        onZoomEnd={
          (() => {
            if (tooltipNodeRef.current) {
              updateTooltipPosition(tooltipNodeRef.current);
            }
          }) as never
        }
        onEngineStop={
          (() => {
            if (focusPendingRef.current) {
              focusNode(focusPendingRef.current);
            }

            if (tooltipNodeRef.current) {
              updateTooltipPosition(tooltipNodeRef.current);
            }
          }) as never
        }
      />
    </div>
  );
}
