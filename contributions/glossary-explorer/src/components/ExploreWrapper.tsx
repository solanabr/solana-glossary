"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Category } from "@/lib/types";

const ExploreClient = dynamic(() => import("./ExploreClient"), { ssr: false });
const KnowledgeGraph3D = dynamic(() => import("./KnowledgeGraph3D"), {
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

export default function ExploreWrapper({
  terms,
  categories,
}: {
  terms: TermNode[];
  categories: CategoryInfo[];
}) {
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all",
  );
  const router = useRouter();

  const handleNodeClick = useCallback(
    (id: string) => {
      router.push(`/term/${id}`);
    },
    [router],
  );

  return (
    <div className="relative h-[calc(100vh-140px)]">
      {/* View Toggle */}
      <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
        <div className="flex rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-xl">
          <button
            onClick={() => setView("2d")}
            className={`rounded-full px-4 py-2 text-xs font-mono font-medium transition-all ${
              view === "2d"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            2D Graph
          </button>
          <button
            onClick={() => setView("3d")}
            className={`rounded-full px-4 py-2 text-xs font-mono font-medium transition-all ${
              view === "3d"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            3D Graph
          </button>
        </div>
      </div>

      {view === "2d" ? (
        <ExploreClient terms={terms} categories={categories} />
      ) : (
        <div className="h-full">
          {/* Category filter for 3D view */}
          <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all ${
                selectedCategory === "all"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all ${
                  selectedCategory === cat.slug
                    ? "text-black"
                    : "text-white/75 hover:text-white"
                }`}
                style={{
                  background:
                    selectedCategory === cat.slug
                      ? cat.color
                      : `${cat.color}22`,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <KnowledgeGraph3D
            terms={terms}
            selectedCategory={selectedCategory}
            onNodeClick={handleNodeClick}
          />
        </div>
      )}
    </div>
  );
}
