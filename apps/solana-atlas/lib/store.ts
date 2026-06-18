import { create } from "zustand";
import type { GlossaryTerm } from "@/lib/glossary";

export type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    return (localStorage.getItem("atlas-theme") as Theme) || "light";
  } catch {
    return "light";
  }
}

interface AtlasState {
  selectedTerm: GlossaryTerm | null;
  hoveredId: string | null;
  searchQuery: string;
  theme: Theme;
  setSelectedTerm: (term: GlossaryTerm | null) => void;
  setHoveredId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setTheme: (t: Theme) => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedTerm: null,
  hoveredId: null,
  searchQuery: "",
  theme: getInitialTheme(),
  setSelectedTerm: (term) => set({ selectedTerm: term }),
  setHoveredId: (id) => set({ hoveredId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTheme: (t) =>
    set(() => {
      document.documentElement.classList.toggle("dark", t === "dark");
      try {
        localStorage.setItem("atlas-theme", t);
      } catch {}
      return { theme: t };
    }),
}));
