import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { useGlossary } from "@/hooks/useGlossary";
import { getCategoryHexColor } from "@/lib/category-colors";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface TermGraphProps {
  centerTerm: GlossaryTerm;
  onSelectTerm: (term: GlossaryTerm) => void;
  onClose: () => void;
}

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

export function TermGraph({
  centerTerm,
  onSelectTerm,
  onClose,
}: TermGraphProps) {
  const glossary = useGlossary();
  const { t } = useI18n();
  const graphRef = useRef<any>(null);
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

  // Resize observer with cleanup
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    obs.observe(el);
    return () => {
      obs.unobserve(el);
      obs.disconnect();
    };
  }, [isFullscreen]);

  // Center on mount
  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => graphRef.current?.zoomToFit(400, 50), 300);
    }
  }, [graphData]);

  const handleNodeClick = useCallback(
    (node: any) => {
      onSelectTerm(node.term);
    },
    [onSelectTerm],
  );

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = node.isCenter ? 14 / globalScale : 11 / globalScale;
      const nodeR = node.isCenter ? 10 : node.val * 2;
      const color = getCategoryHexColor(node.category);

      // Glow for center
      if (node.isCenter) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeR + 6, 0, 2 * Math.PI);
        ctx.fillStyle = `${color}33`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI);
      ctx.fillStyle = node.isCenter ? color : `${color}cc`;
      ctx.fill();
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();

      // Label
      ctx.font = `${node.isCenter ? "600" : "400"} ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(label, node.x, node.y + nodeR + fontSize + 2);
    },
    [],
  );

  const linkColor = useCallback(() => "rgba(148, 163, 184, 0.15)", []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${
          isFullscreen
            ? "fixed inset-0 z-50"
            : "relative rounded-xl overflow-hidden border border-border"
        } bg-background`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background via-background/90 to-transparent">
          <div>
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              {t("graph.title")}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("graph.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
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
}
