import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ForceGraph2D, {
  type ForceGraphMethods,
  type NodeObject,
  type LinkObject,
} from "react-force-graph-2d";
import { GlossaryTerm } from "@stbr/solana-glossary";
import { useGlossary } from "@/hooks/useGlossary";
import {
  X,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Scan,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useTheme, type Theme } from "@/lib/theme";

interface KnowledgeGraphProps {
  centerTerm: GlossaryTerm;
  onSelectTerm: (term: GlossaryTerm) => void;
  /** When omitted the graph is a permanent card section — no dismiss X. */
  onClose?: () => void;
}

// Canvas can't read Tailwind classes, so the node palette is spelled out here.
// It mirrors the category chips: the `-400` rung on dark, its light-surface
// counterpart on paper (the same pairs index.css maps to `--pal-*`).
const CATEGORY_COLORS: Record<Theme, Record<string, string>> = {
  dark: {
    "core-protocol": "#34d399",
    "programming-model": "#60a5fa",
    "token-ecosystem": "#facc15",
    defi: "#34d399",
    "zk-compression": "#a78bfa",
    infrastructure: "#fb923c",
    security: "#f87171",
    "dev-tools": "#22d3ee",
    network: "#2dd4bf",
    "blockchain-general": "#94a3b8",
    web3: "#f472b6",
    "programming-fundamentals": "#818cf8",
    "ai-ml": "#c084fc",
    "solana-ecosystem": "#a78bfa",
  },
  light: {
    "core-protocol": "#047857",
    "programming-model": "#1d4ed8",
    "token-ecosystem": "#854d0e",
    defi: "#047857",
    "zk-compression": "#7c3aed",
    infrastructure: "#9a3412",
    security: "#b91c1c",
    "dev-tools": "#0e7490",
    network: "#0f766e",
    "blockchain-general": "#475569",
    web3: "#be185d",
    "programming-fundamentals": "#4f46e5",
    "ai-ml": "#7e22ce",
    "solana-ecosystem": "#7c3aed",
  },
};

const FALLBACK_COLOR: Record<Theme, string> = {
  dark: "#94a3b8",
  light: "#475569",
};

const LABEL_COLOR: Record<Theme, string> = {
  dark: "#e2e8f0",
  light: "#1e293b",
};

const LINK_COLOR: Record<Theme, string> = {
  dark: "rgba(148, 163, 184, 0.15)",
  light: "rgba(71, 85, 105, 0.25)",
};

interface GraphNode {
  id: string;
  name: string;
  category: string;
  val: number;
  isCenter: boolean;
  term: GlossaryTerm;
}

interface GraphLink {
  source: string;
  target: string;
}

export function KnowledgeGraph({
  centerTerm,
  onSelectTerm,
  onClose,
}: KnowledgeGraphProps) {
  const glossary = useGlossary();
  const { t } = useI18n();
  const theme = useTheme();
  const graphRef =
    useRef<ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode>>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Build graph data from center term
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const seen = new Set<string>();

    const addNode = (term: GlossaryTerm, isCenter: boolean, depth: number) => {
      if (seen.has(term.id)) return;
      seen.add(term.id);
      nodes.push({
        id: term.id,
        name: term.term,
        category: term.category,
        val: isCenter ? 8 : depth === 1 ? 4 : 2,
        isCenter,
        term,
      });
    };

    // Add center
    addNode(centerTerm, true, 0);

    // Add direct related (depth 1)
    const related = glossary.getRelatedTerms(centerTerm.id);
    for (const r of related) {
      addNode(r, false, 1);
      links.push({ source: centerTerm.id, target: r.id });
    }

    // Add depth 2 (related of related), limited
    for (const r of related.slice(0, 6)) {
      const r2 = glossary.getRelatedTerms(r.id);
      for (const rr of r2.slice(0, 3)) {
        if (!seen.has(rr.id)) {
          addNode(rr, false, 2);
          links.push({ source: r.id, target: rr.id });
        }
      }
    }

    // Add same-category terms if graph is small
    if (nodes.length < 8) {
      const sameCat = glossary
        .getTermsByCategory(centerTerm.category)
        .slice(0, 10);
      for (const sc of sameCat) {
        if (!seen.has(sc.id)) {
          addNode(sc, false, 2);
          links.push({ source: centerTerm.id, target: sc.id });
        }
        if (nodes.length >= 20) break;
      }
    }

    return { nodes, links };
  }, [centerTerm, glossary]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isFullscreen]);

  // Center on mount
  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => graphRef.current?.zoomToFit(400, 50), 300);
    }
  }, [graphData]);

  const handleNodeClick = useCallback(
    (node: NodeObject & GraphNode) => {
      onSelectTerm(node.term);
    },
    [onSelectTerm],
  );

  const nodeCanvasObject = useCallback(
    (
      node: NodeObject<GraphNode>,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => {
      const { x, y } = node;
      if (x === undefined || y === undefined) return;
      const label = node.name;
      const fontSize = node.isCenter ? 14 / globalScale : 11 / globalScale;
      const nodeR = node.isCenter ? 10 : node.val * 2;
      const color =
        CATEGORY_COLORS[theme][node.category] || FALLBACK_COLOR[theme];

      // Glow for center
      if (node.isCenter) {
        ctx.beginPath();
        ctx.arc(x, y, nodeR + 6, 0, 2 * Math.PI);
        ctx.fillStyle = `${color}33`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, nodeR, 0, 2 * Math.PI);
      ctx.fillStyle = node.isCenter ? color : `${color}cc`;
      ctx.fill();
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();

      // Label
      ctx.font = `${node.isCenter ? "600" : "400"} ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = LABEL_COLOR[theme];
      ctx.fillText(label, x, y + nodeR + fontSize + 2);
    },
    [theme],
  );

  const linkColor = useCallback(() => LINK_COLOR[theme], [theme]);

  const zoomBy = useCallback((factor: number) => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoom(graph.zoom() * factor, 200);
  }, []);
  const fitView = useCallback(() => {
    graphRef.current?.zoomToFit(400, 50);
  }, []);

  const graph = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${
          isFullscreen
            ? "fixed inset-0 z-[60]"
            : "relative rounded-xl overflow-hidden border border-border"
        } bg-background`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background via-background/90 to-transparent">
          <div className="flex items-center gap-2">
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                aria-label={t("graph.back")}
                className="flex items-center gap-1 px-2 py-1 -ml-1 rounded-md bg-secondary/70 border border-border text-[11px] font-medium text-foreground hover:bg-surface-hover transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("graph.back")}
              </button>
            )}
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              🌐 {t("graph.title")}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {isFullscreen && (
              <>
                <button
                  onClick={() => zoomBy(1.4)}
                  aria-label="Zoom in"
                  className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => zoomBy(1 / 1.4)}
                  aria-label="Zoom out"
                  className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={fitView}
                  aria-label="Fit graph to view"
                  className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Scan className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-border mx-0.5" />
              </>
            )}
            <button
              onClick={() => setIsFullscreen((f) => !f)}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close knowledge graph"
                className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Graph */}
        <div
          ref={containerRef}
          className={isFullscreen ? "w-full h-full" : "w-full h-[400px]"}
        >
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={isFullscreen ? window.innerHeight : 400}
            nodeCanvasObject={nodeCanvasObject}
            linkColor={linkColor}
            linkWidth={1}
            onNodeClick={handleNodeClick}
            cooldownTime={2000}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            backgroundColor="transparent"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );

  // Fullscreen renders in a body portal: ancestors of the inline card (the
  // sticky browse pane, mid-animation framer transforms) create stacking
  // contexts that would otherwise trap the overlay beneath the app header —
  // hiding these very controls and leaving no way out of fullscreen.
  return isFullscreen ? createPortal(graph, document.body) : graph;
}
