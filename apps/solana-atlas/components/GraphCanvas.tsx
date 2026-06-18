"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import { searchTerms } from "@/lib/glossary";
import { buildGraph, type GraphNode } from "@/lib/buildGraph";
import { categoryColor } from "@/lib/colors";
import { useAtlasStore } from "@/lib/store";

const graphData = buildGraph();

const nodeMeshes = new Map<string, THREE.Mesh>();
const nodeMaterials = new Map<string, THREE.MeshLambertMaterial>();

function initNodeObjects() {
  if (nodeMeshes.size > 0) return;
  for (const node of graphData.nodes) {
    const radius = Math.sqrt(node.val) * 2;
    const geo = new THREE.SphereGeometry(radius, 8, 8);
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(categoryColor(node.category)),
      transparent: true,
      opacity: 0.88,
    });
    const mesh = new THREE.Mesh(geo, mat);
    nodeMeshes.set(node.id, mesh);
    nodeMaterials.set(node.id, mat);
  }
}

export default function GraphCanvas() {
  const fgRef = useRef<any>(null);
  const { selectedTerm, hoveredId, searchQuery, setSelectedTerm, setHoveredId, theme } =
    useAtlasStore();

  const highlightIds = useMemo<Set<string>>(() => {
    if (!selectedTerm) return new Set();
    const ids = new Set<string>([selectedTerm.id]);
    for (const rel of selectedTerm.related ?? []) ids.add(rel);
    return ids;
  }, [selectedTerm]);

  const searchResultIds = useMemo<Set<string>>(() => {
    if (!searchQuery.trim()) return new Set();
    return new Set(searchTerms(searchQuery).map((t) => t.id));
  }, [searchQuery]);

  useEffect(() => {
    initNodeObjects();
    const hasSearch = !!searchQuery.trim();
    const hasSelection = !!selectedTerm;
    const dimColor = theme === "dark" ? "#0d0d20" : "#d0d0e4";
    const dimOpacity = theme === "dark" ? 0.12 : 0.3;

    for (const node of graphData.nodes) {
      const mat = nodeMaterials.get(node.id);
      const mesh = nodeMeshes.get(node.id);
      if (!mat || !mesh) continue;

      if (hasSearch) {
        if (searchResultIds.has(node.id)) {
          mat.color.set(categoryColor(node.category));
          mat.opacity = 0.95;
          mesh.scale.setScalar(1);
        } else {
          mat.color.set(dimColor);
          mat.opacity = dimOpacity;
          mesh.scale.setScalar(1);
        }
      } else if (hasSelection) {
        if (node.id === selectedTerm!.id) {
          mat.color.set(theme === "dark" ? "#ffffff" : "#0a0a1a");
          mat.opacity = 1;
          mesh.scale.setScalar(1.6);
        } else if (highlightIds.has(node.id)) {
          mat.color.set(categoryColor(node.category));
          mat.opacity = 0.95;
          mesh.scale.setScalar(1);
        } else {
          mat.color.set(dimColor);
          mat.opacity = dimOpacity;
          mesh.scale.setScalar(1);
        }
      } else if (node.id === hoveredId) {
        mat.color.set(theme === "dark" ? "#ffffff" : "#0a0a1a");
        mat.opacity = 1;
        mesh.scale.setScalar(1.5);
      } else {
        mat.color.set(categoryColor(node.category));
        mat.opacity = 0.88;
        mesh.scale.setScalar(1);
      }
      mat.needsUpdate = true;
    }
  }, [selectedTerm, hoveredId, highlightIds, searchQuery, searchResultIds, theme]);

  const nodeThreeObject = useCallback((node: object) => {
    initNodeObjects();
    const n = node as GraphNode;
    return nodeMeshes.get(n.id) ?? new THREE.Mesh();
  }, []);

  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedTerm?.id ?? null;

  const themeRef = useRef<string>("dark");
  themeRef.current = theme;

  const getLinkColor = useCallback((link: object) => {
    const l = link as { source: string | GraphNode; target: string | GraphNode };
    const srcId = typeof l.source === "object" ? l.source.id : l.source;
    const tgtId = typeof l.target === "object" ? l.target.id : l.target;
    const isDark = themeRef.current === "dark";
    if (selectedIdRef.current && (srcId === selectedIdRef.current || tgtId === selectedIdRef.current)) {
      return isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)";
    }
    return isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.07)";
  }, []);

  const handleNodeClick = useCallback(
    (node: object) => {
      const n = node as GraphNode;
      if (selectedIdRef.current === n.id) {
        setSelectedTerm(null);
        return;
      }
      setSelectedTerm(n.term);
      if (fgRef.current) {
        const a = node as any;
        const dist = Math.hypot(a.x ?? 1, a.y ?? 1, a.z ?? 1);
        const ratio = 1 + 120 / dist;
        fgRef.current.cameraPosition(
          { x: (a.x ?? 0) * ratio, y: (a.y ?? 0) * ratio, z: (a.z ?? 0) * ratio },
          { x: a.x ?? 0, y: a.y ?? 0, z: a.z ?? 0 },
          800
        );
      }
    },
    [setSelectedTerm]
  );

  const handleNodeHover = useCallback(
    (node: object | null) => {
      const n = node as GraphNode | null;
      setHoveredId(n?.id ?? null);
      document.body.style.cursor = n ? "pointer" : "default";
    },
    [setHoveredId]
  );

  useEffect(() => {
    initNodeObjects();
    if (!fgRef.current) return;
    const fg = fgRef.current;
    fg.d3Force("charge")?.strength(-80).distanceMax(250);
    fg.d3Force("link")?.distance(35).strength(0.35);
    fg.d3Force("center")?.strength(0.05);
  }, []);

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={graphData}
      nodeId="id"
      nodeLabel="label"
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      linkColor={getLinkColor}
      linkWidth={0.3}
      linkOpacity={1}
      backgroundColor={theme === "dark" ? "#050510" : "#f0f0f8"}
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      enableNodeDrag={false}
      warmupTicks={200}
      cooldownTicks={80}
      d3AlphaDecay={0.04}
      d3VelocityDecay={0.35}
      rendererConfig={{ antialias: false, alpha: false }}
    />
  );
}
