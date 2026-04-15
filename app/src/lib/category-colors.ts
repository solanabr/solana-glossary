/**
 * Centralized category color mappings used across TermCard, SearchBar,
 * TermDetailPanel, CategoryGrid, and KnowledgeGraph components.
 */

/** Tailwind class-based colors for component badges and backgrounds. */
export const categoryBadgeColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "core-protocol": {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
  },
  "programming-model": {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  "token-ecosystem": {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  defi: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  "zk-compression": {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/20",
  },
  infrastructure: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  security: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  "dev-tools": {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  network: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/20",
  },
  "blockchain-general": {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
  },
  web3: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
  },
  "programming-fundamentals": {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
  },
  "ai-ml": {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  "solana-ecosystem": {
    bg: "bg-accent/10",
    text: "text-accent",
    border: "border-accent/20",
  },
};

/** Hex colors for canvas rendering (KnowledgeGraph, charts). */
export const categoryHexColors: Record<string, string> = {
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
};

/** Icon text color per category (for CategoryGrid and icon tinting). */
export const categoryIconColors: Record<string, string> = {
  "core-protocol": "text-primary",
  "programming-model": "text-blue-400",
  "token-ecosystem": "text-yellow-400",
  defi: "text-emerald-400",
  "zk-compression": "text-violet-400",
  infrastructure: "text-orange-400",
  security: "text-red-400",
  "dev-tools": "text-cyan-400",
  network: "text-teal-400",
  "blockchain-general": "text-slate-400",
  web3: "text-pink-400",
  "programming-fundamentals": "text-indigo-400",
  "ai-ml": "text-purple-400",
  "solana-ecosystem": "text-accent",
};

/**
 * Get combined Tailwind class string for a category badge.
 * Falls back to muted styling for unknown categories.
 */
export function getCategoryBadgeClass(category: string): string {
  const colors = categoryBadgeColors[category];
  if (!colors) return "bg-muted text-muted-foreground";
  return `${colors.bg} ${colors.text} ${colors.border}`;
}

/**
 * Get hex color for a category (for canvas/SVG rendering).
 * Falls back to a neutral gray.
 */
export function getCategoryHexColor(category: string): string {
  return categoryHexColors[category] || "#94a3b8";
}
