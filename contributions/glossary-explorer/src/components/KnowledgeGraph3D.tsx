"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Category } from "@/lib/types";

interface TermNode {
  id: string;
  term: string;
  category: Category;
  related: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "core-protocol": "#14F195",
  "programming-model": "#9945FF",
  "token-ecosystem": "#FFD93D",
  defi: "#FF6B6B",
  "zk-compression": "#00D4FF",
  infrastructure: "#FF9F43",
  security: "#EE5A24",
  "dev-tools": "#0ABDE3",
  network: "#10AC84",
  "blockchain-general": "#A29BFE",
  web3: "#FD79A8",
  "programming-fundamentals": "#6C5CE7",
  "ai-ml": "#00CEC9",
  "solana-ecosystem": "#E17055",
};

interface NodePosition {
  id: string;
  term: string;
  category: Category;
  position: [number, number, number];
  connections: string[];
  color: string;
}

function computeLayout(terms: TermNode[]): NodePosition[] {
  // Simple force-directed layout using category clustering
  const categoryGroups: Record<string, TermNode[]> = {};
  for (const term of terms) {
    if (!categoryGroups[term.category]) categoryGroups[term.category] = [];
    categoryGroups[term.category].push(term);
  }

  const categories = Object.keys(categoryGroups);
  const positions: NodePosition[] = [];
  const radius = 40;

  categories.forEach((cat, catIdx) => {
    const angle = (catIdx / categories.length) * Math.PI * 2;
    const cx = Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius;
    const group = categoryGroups[cat];

    group.forEach((term, termIdx) => {
      const spread = Math.min(group.length, 20);
      const innerAngle = (termIdx / spread) * Math.PI * 2;
      const innerRadius = 5 + Math.random() * 10;
      const y = (Math.random() - 0.5) * 15;

      positions.push({
        id: term.id,
        term: term.term,
        category: term.category,
        position: [
          cx + Math.cos(innerAngle) * innerRadius,
          y,
          cz + Math.sin(innerAngle) * innerRadius,
        ],
        connections: term.related,
        color: CATEGORY_COLORS[term.category] ?? "#666666",
      });
    });
  });

  return positions;
}

function NodeSphere({
  node,
  isHighlighted,
  onHover,
  onClick,
}: {
  node: NodePosition;
  isHighlighted: boolean;
  onHover: (node: NodePosition | null) => void;
  onClick: (node: NodePosition) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseScale = node.connections.length > 3 ? 0.8 : 0.5;
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetScale = hovered || isHighlighted ? baseScale * 1.5 : baseScale;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 5,
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(node);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        setHovered(false);
        onHover(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(node);
      }}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={node.color}
        emissive={node.color}
        emissiveIntensity={hovered || isHighlighted ? 0.8 : 0.3}
        transparent
        opacity={isHighlighted ? 1 : 0.85}
      />
    </mesh>
  );
}

function Edges({
  nodes,
  posMap,
}: {
  nodes: NodePosition[];
  posMap: Map<string, [number, number, number]>;
}) {
  const lineGeometry = useMemo(() => {
    const points: number[] = [];

    for (const node of nodes) {
      for (const connId of node.connections) {
        const target = posMap.get(connId);
        if (!target) continue;

        points.push(...node.position, ...target);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    );
    return geometry;
  }, [nodes, posMap]);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.04} />
    </lineSegments>
  );
}

function Scene({
  terms,
  selectedCategory,
  onNodeClick,
}: {
  terms: TermNode[];
  selectedCategory: Category | "all";
  onNodeClick: (id: string) => void;
}) {
  const [hoveredNode, setHoveredNode] = useState<NodePosition | null>(null);

  const filtered = useMemo(() => {
    if (selectedCategory === "all") {
      return terms.filter((t) => t.related.length > 0);
    }
    return terms.filter((t) => t.category === selectedCategory);
  }, [terms, selectedCategory]);

  const nodes = useMemo(() => computeLayout(filtered), [filtered]);

  const posMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const node of nodes) {
      map.set(node.id, node.position);
    }
    return map;
  }, [nodes]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[50, 50, 50]} intensity={1} />
      <pointLight position={[-50, -50, -50]} intensity={0.5} color="#9945FF" />

      <Edges nodes={nodes} posMap={posMap} />

      {nodes.map((node) => (
        <NodeSphere
          key={node.id}
          node={node}
          isHighlighted={
            hoveredNode !== null &&
            (hoveredNode.id === node.id ||
              hoveredNode.connections.includes(node.id))
          }
          onHover={setHoveredNode}
          onClick={(n) => onNodeClick(n.id)}
        />
      ))}

      {hoveredNode && (
        <Html
          position={hoveredNode.position}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded-xl border border-white/10 bg-black/90 px-3 py-2 shadow-lg backdrop-blur-sm">
            <p className="whitespace-nowrap font-mono text-xs font-semibold text-white">
              {hoveredNode.term}
            </p>
            <p className="text-[10px] text-white/50">{hoveredNode.category}</p>
          </div>
        </Html>
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={120}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function KnowledgeGraph3D({
  terms,
  selectedCategory,
  onNodeClick,
}: {
  terms: TermNode[];
  selectedCategory: Category | "all";
  onNodeClick: (id: string) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 30, 60], fov: 60 }}
      style={{ background: "#0a0a0a" }}
    >
      <Scene
        terms={terms}
        selectedCategory={selectedCategory}
        onNodeClick={onNodeClick}
      />
    </Canvas>
  );
}
