"use client";

import { useEffect, useState } from "react";

const VISITED_KEY = "solana-glossary-visited";

function markVisited(termId: string) {
  try {
    const visited = new Set<string>(
      JSON.parse(localStorage.getItem(VISITED_KEY) ?? "[]"),
    );
    visited.add(termId);
    localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
  } catch {
    // localStorage not available
  }
}

export default function TermProgress({
  termId,
  relatedIds,
}: {
  termId: string;
  relatedIds: string[];
}) {
  const [visitedCount, setVisitedCount] = useState(0);
  const [totalVisited, setTotalVisited] = useState(0);

  useEffect(() => {
    try {
      const visited = new Set<string>(
        JSON.parse(localStorage.getItem(VISITED_KEY) ?? "[]"),
      );
      // Mark current term as visited
      visited.add(termId);
      localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));

      const count = relatedIds.filter((id) => visited.has(id)).length;
      setVisitedCount(count);
      setTotalVisited(visited.size);
    } catch {
      // localStorage not available
    }
  }, [termId, relatedIds]);

  if (relatedIds.length === 0) return null;

  const pct =
    relatedIds.length > 0
      ? Math.round((visitedCount / relatedIds.length) * 100)
      : 0;

  return (
    <div className="rounded-xl bg-[#1A1A24] border border-white/8 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Sua exploração</p>
        <span className="text-xs text-[#A0A0B0]">
          {totalVisited} termo{totalVisited !== 1 ? "s" : ""} visitado
          {totalVisited !== 1 ? "s" : ""} no total
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-[#A0A0B0]">
          <span>Termos relacionados explorados</span>
          <span className="text-white font-medium">
            {visitedCount}/{relatedIds.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #9945FF, #14F195)",
            }}
          />
        </div>
      </div>

      {pct === 100 && (
        <p className="text-xs text-[#14F195] font-medium">
          Você explorou todos os termos relacionados!
        </p>
      )}
    </div>
  );
}
