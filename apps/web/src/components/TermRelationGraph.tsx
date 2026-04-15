"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { type GlossaryTerm, type Locale } from "@/lib/glossary";
import { LEARN_PATH_TERM_IDS } from "@/lib/learn-path";
import {
  buildRelationGraph,
  graphColorForCategory,
  type GraphNode,
} from "@/lib/term-graph";
import { graphPath } from "@/lib/url-lang";

type SimNode = GraphNode & {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

const DEF_PREVIEW_LEN = 360;
const ZOOM_STEP = 1.14;
const K_MIN = 0.35;
const K_MAX = 3.8;

export type GraphLabels = {
  title: string;
  focus: string;
  depth1: string;
  depth2: string;
  searchPlaceholder: string;
  loading: string;
  resetView: string;
  zoomIn: string;
  zoomOut: string;
  categoriesLabel: string;
  relatedLabel: string;
};

function truncateDef(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return text.trim();
  return `${t.slice(0, max - 1).trim()}…`;
}

export default function TermRelationGraph({
  locale,
  terms,
  loading,
  focusId,
  depth,
  onDepthChange,
  labels,
}: {
  locale: Locale;
  terms: GlossaryTerm[];
  loading: boolean;
  focusId: string;
  depth: 1 | 2;
  onDepthChange: (d: 1 | 2) => void;
  labels: GraphLabels;
}) {
  const router = useRouter();
  const uid = "graph";
  const wrapRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ w: 400, h: 300 });
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [view, setView] = useState({ tx: 0, ty: 0, k: 1 });
  const dragRef = useRef<{ px: number; py: number; active: boolean }>({
    px: 0,
    py: 0,
    active: false,
  });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const termsById = useMemo(
    () => new Map(terms.map((t) => [t.id, t])),
    [terms],
  );

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const w = Math.max(280, Math.floor(r.width));
      // Height must not feed back into itself; derive from width for stability.
      const isMobile = window.innerWidth < 640;
      const h = isMobile
        ? Math.max(220, Math.min(420, Math.floor(w * 0.72)))
        : Math.max(460, Math.min(900, Math.floor(w * 0.78)));
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes, links } = useMemo(
    () => buildRelationGraph(terms, focusId, depth),
    [terms, focusId, depth],
  );

  useEffect(() => {
    if (!size.w || !size.h || nodes.length === 0) {
      setSimNodes([]);
      return;
    }

    const narrow = size.w < 520;
    const cx = size.w / 2;
    const cy = size.h / 2;
    const simNodesInit: SimNode[] = nodes.map((n, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      const rScale = narrow ? 0.88 : 1;
      return {
        ...n,
        r: Math.max(10, n.r * rScale),
        x: cx + Math.cos(angle) * (narrow ? 64 : 88),
        y: cy + Math.sin(angle) * (narrow ? 64 : 88),
      };
    });

    const focusN = simNodesInit.find((n) => n.id === focusId);
    if (focusN) {
      focusN.fx = cx;
      focusN.fy = cy;
    }

    const linkObjs = links.map((l) => ({ source: l.source, target: l.target }));
    const linkForce = forceLink<SimNode, (typeof linkObjs)[number]>(linkObjs)
      .id((d) => d.id)
      .distance(narrow ? 68 : 82)
      .strength(0.52);

    const sim = forceSimulation(simNodesInit)
      .force("link", linkForce)
      .force("charge", forceManyBody<SimNode>().strength(narrow ? -220 : -300))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => d.r + (narrow ? 8 : 10)),
      );

    let ticks = 0;
    while (sim.alpha() > 0.02 && ticks < 580) {
      sim.tick();
      ticks++;
    }
    sim.stop();

    setSimNodes(simNodesInit.map((n) => ({ ...n })));
  }, [nodes, links, size.w, size.h, focusId]);

  useEffect(() => {
    if (focusId) setSelectedId(focusId);
  }, [focusId]);

  const searchHits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return terms
      .filter(
        (t) =>
          t.term.toLowerCase().includes(q) || t.id.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [terms, search]);

  const zoomBy = useCallback((factor: number) => {
    setView((v) => ({
      ...v,
      k: Math.min(K_MAX, Math.max(K_MIN, v.k * factor)),
    }));
  }, []);

  const onWheelZoom = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
      zoomBy(factor);
    },
    [zoomBy],
  );

  const onMouseDownBg = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    dragRef.current = { px: e.clientX, py: e.clientY, active: true };
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const fixPan = useCallback((e: React.MouseEvent) => {
    const dx = e.clientX - dragRef.current.px;
    const dy = e.clientY - dragRef.current.py;
    dragRef.current.px = e.clientX;
    dragRef.current.py = e.clientY;
    setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
  }, []);

  useEffect(() => {
    const up = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  /** One-finger pan on touch devices (canvas background only). */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const state = {
      active: false,
      lastX: 0,
      lastY: 0,
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const under = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!under || !el.contains(under) || under.closest("[data-node]")) return;
      state.active = true;
      state.lastX = touch.clientX;
      state.lastY = touch.clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (!state.active || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - state.lastX;
      const dy = touch.clientY - state.lastY;
      state.lastX = touch.clientX;
      state.lastY = touch.clientY;
      setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
    };

    const onEnd = () => {
      state.active = false;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const nodeById = useMemo(
    () => new Map(simNodes.map((n) => [n.id, n])),
    [simNodes],
  );

  const refocus = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(graphPath(locale, id), { scroll: false });
      setView({ tx: 0, ty: 0, k: 1 });
    },
    [router, locale],
  );

  const selectedTerm = termsById.get(selectedId || focusId);
  const relatedTerms = useMemo(() => {
    if (!selectedTerm) return [] as GlossaryTerm[];
    const touchingIds = new Set<string>();
    for (const l of links) {
      const src = typeof l.source === "string" ? l.source : String(l.source);
      const dst = typeof l.target === "string" ? l.target : String(l.target);
      if (src === selectedTerm.id) touchingIds.add(dst);
      if (dst === selectedTerm.id) touchingIds.add(src);
    }
    return [...touchingIds]
      .map((id) => termsById.get(id))
      .filter((t): t is GlossaryTerm => Boolean(t))
      .sort((a, b) => a.term.localeCompare(b.term, locale));
  }, [selectedTerm, links, termsById, locale]);

  const relatedCategories = useMemo(() => {
    if (!selectedTerm) return [] as string[];
    const set = new Set<string>([selectedTerm.categoryLabel]);
    for (const t of relatedTerms) set.add(t.categoryLabel);
    return [...set].sort((a, b) => a.localeCompare(b, locale));
  }, [selectedTerm, relatedTerms, locale]);
  const labelFontSize = size.w < 480 ? 9 : 11;

  const dotPatternId = "graph-dots";
  const glowFilterId = "graph-glow";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-lg font-semibold tracking-tight text-sol-text">
          {labels.title}
        </h1>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-2 text-[11px] font-medium text-sol-muted">
            <select
              value={depth}
              onChange={(e) => onDepthChange(Number(e.target.value) as 1 | 2)}
              className="rounded-md border border-sol-line bg-sol-surface-elevated px-2 py-1 text-[12px] text-sol-text focus:outline-none focus:ring-2 focus:ring-sol-accent/30"
            >
              <option value={1}>{labels.depth1}</option>
              <option value={2}>{labels.depth2}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_320px] sm:gap-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div className="relative min-w-0">
            <label htmlFor={`graph-search-${uid}`} className="sr-only">
              {labels.focus}
            </label>
            <input
              id={`graph-search-${uid}`}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full rounded-xl border border-sol-line bg-sol-darker/60 py-2 pl-2.5 pr-2 text-[13px] text-sol-text placeholder:text-sol-muted focus:outline-none focus:ring-2 focus:ring-sol-accent/25 sm:py-2.5 sm:pl-3"
            />
            {searchHits.length > 0 && (
              <ul
                className="absolute z-30 mt-1 max-h-[min(40vh,220px)] w-full overflow-y-auto rounded-lg border border-sol-line-strong bg-sol-surface-elevated py-1 shadow-xl"
                role="listbox"
              >
                {searchHits.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[13px] text-sol-text hover:bg-sol-surface"
                      onClick={() => {
                        refocus(t.id);
                        setSearch("");
                      }}
                    >
                      <span className="font-medium">{t.term}</span>
                      <span className="ml-2 text-[11px] text-sol-muted">
                        {t.categoryLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            ref={wrapRef}
            className="relative isolate h-[clamp(220px,48vh,420px)] min-w-0 overflow-hidden rounded-xl border border-sol-line-strong/70 bg-sol-darker shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] select-none sm:h-[clamp(460px,74vh,900px)]"
            onWheel={onWheelZoom}
            onMouseDown={onMouseDownBg}
            onMouseMove={(e) => {
              if (dragRef.current.active) fixPan(e);
            }}
            onMouseLeave={onMouseUp}
            onMouseUp={onMouseUp}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.3]"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 100% 70% at 50% 0%, rgba(153,69,255,0.1), transparent), radial-gradient(ellipse 45% 35% at 100% 100%, rgba(20,241,149,0.05), transparent)",
              }}
              aria-hidden
            />

            <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
              <div
                className="flex items-center gap-1 rounded-lg border border-sol-line/90 bg-sol-surface/95 p-0.5 backdrop-blur-sm sm:bg-sol-surface/90"
                role="group"
                aria-label="zoom"
              >
                <button
                  type="button"
                  onClick={() => zoomBy(1 / ZOOM_STEP)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-base font-semibold text-sol-text hover:bg-sol-surface-elevated"
                  aria-label={labels.zoomOut}
                >
                  −
                </button>
                <span className="min-w-[2.4rem] text-center text-[10px] font-medium tabular-nums text-sol-subtle">
                  {Math.round(view.k * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => zoomBy(ZOOM_STEP)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-base font-semibold text-sol-text hover:bg-sol-surface-elevated"
                  aria-label={labels.zoomIn}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => setView({ tx: 0, ty: 0, k: 1 })}
                className="rounded-md border border-sol-line bg-sol-surface/95 px-2 py-1 text-[10px] font-medium text-sol-text hover:bg-sol-surface-elevated"
              >
                {labels.resetView}
              </button>
            </div>

            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-sol-darker/70 text-sol-subtle text-sm backdrop-blur-[2px]">
                {labels.loading}
              </div>
            )}

            <svg
              width={size.w}
              height={size.h}
              className="relative z-[1] block touch-none cursor-grab active:cursor-grabbing"
              aria-label={labels.title}
            >
              <defs>
                <pattern
                  id={dotPatternId}
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx="1.5"
                    cy="1.5"
                    r="0.9"
                    fill="rgba(236,236,241,0.05)"
                  />
                </pattern>
                <filter
                  id={glowFilterId}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="2" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect
                width={size.w}
                height={size.h}
                fill={`url(#${dotPatternId})`}
                opacity={0.85}
              />
              <g
                transform={`translate(${view.tx + size.w / 2},${view.ty + size.h / 2}) scale(${view.k}) translate(${-size.w / 2},${-size.h / 2})`}
              >
                {links.map((l) => {
                  const s =
                    typeof l.source === "object"
                      ? (l.source as SimNode)
                      : nodeById.get(l.source as string);
                  const t =
                    typeof l.target === "object"
                      ? (l.target as SimNode)
                      : nodeById.get(l.target as string);
                  if (!s || !t || s.x == null || t.x == null) return null;
                  const touchesFocus = s.id === focusId || t.id === focusId;
                  const touchesHover =
                    hoveredId && (s.id === hoveredId || t.id === hoveredId);
                  const strokeOpacity = touchesFocus
                    ? 0.5
                    : touchesHover
                      ? 0.38
                      : 0.2;
                  return (
                    <line
                      key={`${s.id}-${t.id}`}
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke="rgba(180,180,198,0.9)"
                      strokeWidth={touchesFocus ? 2 : 1.2}
                      strokeOpacity={strokeOpacity}
                      strokeLinecap="round"
                    />
                  );
                })}
                {simNodes.map((n) => {
                  if (n.x == null || n.y == null) return null;
                  const fill = graphColorForCategory(n.category);
                  const isFocus = n.id === focusId;
                  const isHover = hoveredId === n.id;
                  return (
                    <g
                      key={n.id}
                      data-node
                      transform={`translate(${n.x},${n.y})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredId(n.id)}
                      onMouseLeave={() =>
                        setHoveredId((h) => (h === n.id ? null : h))
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        refocus(n.id);
                      }}
                    >
                      <circle r={n.r + 18} fill="transparent" aria-hidden />
                      <circle
                        r={n.r + (isHover ? 2 : 0)}
                        fill={fill}
                        opacity={isFocus ? 1 : isHover ? 0.97 : 0.86}
                        stroke={
                          isFocus
                            ? "#f4f4f8"
                            : isHover
                              ? "rgba(255,255,255,0.5)"
                              : "rgba(0,0,0,0.35)"
                        }
                        strokeWidth={isFocus ? 2.5 : isHover ? 1.8 : 1}
                        filter={isFocus ? `url(#${glowFilterId})` : undefined}
                      />
                      <text
                        textAnchor="middle"
                        dy={n.r + 13}
                        fill={isHover || isFocus ? "#b8b8c8" : "#6b6b7a"}
                        fontSize={labelFontSize}
                        className="pointer-events-none"
                        style={{
                          fontFamily: "system-ui, sans-serif",
                        }}
                      >
                        {n.name.length > 18
                          ? `${n.name.slice(0, 16)}…`
                          : n.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        <aside className="min-h-[120px] rounded-xl border border-sol-line bg-sol-surface/50 p-3 sm:min-h-0 sm:overflow-auto">
          {selectedTerm ? (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-sol-muted">
                {selectedTerm.categoryLabel}
              </p>
              <h2 className="font-display text-base font-semibold text-sol-text">
                {selectedTerm.term}
              </h2>
              <p className="text-[13px] leading-relaxed text-sol-subtle whitespace-pre-wrap">
                {truncateDef(selectedTerm.definition, DEF_PREVIEW_LEN)}
              </p>
              <div className="pt-2 space-y-2">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-sol-muted">
                    {labels.categoriesLabel}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {relatedCategories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-md border border-sol-line bg-sol-darker/50 px-2 py-0.5 text-[11px] text-sol-subtle"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-sol-muted">
                    {labels.relatedLabel}
                  </p>
                  {relatedTerms.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {relatedTerms.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => refocus(t.id)}
                            className="rounded-md border border-sol-line bg-sol-darker/50 px-2 py-0.5 text-[11px] text-sol-text hover:border-sol-line-strong hover:bg-sol-surface-elevated"
                          >
                            {t.term}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12px] text-sol-muted">—</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export function defaultGraphFocusId(terms: GlossaryTerm[]): string {
  if (terms.length === 0) return "";
  for (const id of LEARN_PATH_TERM_IDS) {
    if (terms.some((t) => t.id === id)) return id;
  }
  return terms[0].id;
}
