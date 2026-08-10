/** Category chip color classes shared by cards, search results, and chips. */
export const categoryColors: Record<string, string> = {
  "core-protocol": "bg-primary/10 text-primary border-primary/20",
  "programming-model": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "token-ecosystem": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  defi: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "zk-compression": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  infrastructure: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  security: "bg-red-500/10 text-red-400 border-red-500/20",
  "dev-tools": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  network: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "blockchain-general": "bg-slate-500/10 text-slate-400 border-slate-500/20",
  web3: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "programming-fundamentals":
    "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "ai-ml": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "solana-ecosystem": "bg-accent/10 text-accent border-accent/20",
};

/** Depth 1 (surface, Solana green) → 5 (deep, Solana purple) chip classes. */
export const depthColors: Record<number, string> = {
  1: "bg-primary/10 text-primary border-primary/25",
  2: "bg-teal-500/10 text-teal-400 border-teal-500/25",
  3: "bg-sky-500/10 text-sky-400 border-sky-500/25",
  4: "bg-violet-500/10 text-violet-400 border-violet-500/25",
  5: "bg-purple-600/15 text-purple-400 border-purple-500/30",
};

/** Stronger border accent per category (cards that should feel themed). */
export const categoryCardAccent: Record<string, string> = {
  "core-protocol": "border-primary/40",
  "programming-model": "border-blue-500/40",
  "token-ecosystem": "border-yellow-500/40",
  defi: "border-emerald-500/40",
  "zk-compression": "border-violet-500/40",
  infrastructure: "border-orange-500/40",
  security: "border-red-500/40",
  "dev-tools": "border-cyan-500/40",
  network: "border-teal-500/40",
  "blockchain-general": "border-slate-500/40",
  web3: "border-pink-500/40",
  "programming-fundamentals": "border-indigo-500/40",
  "ai-ml": "border-purple-500/40",
  "solana-ecosystem": "border-accent/40",
};
