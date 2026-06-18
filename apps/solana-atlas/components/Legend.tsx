"use client";

import { CATEGORY_COLORS } from "@/lib/colors";

const CATEGORY_LABELS: Record<string, string> = {
  "core-protocol": "Core Protocol",
  "programming-model": "Programming Model",
  "token-ecosystem": "Token Ecosystem",
  defi: "DeFi",
  "zk-compression": "ZK Compression",
  infrastructure: "Infrastructure",
  security: "Security",
  "dev-tools": "Dev Tools",
  network: "Network",
  "blockchain-general": "Blockchain",
  web3: "Web3",
  "programming-fundamentals": "Prog. Fundamentals",
  "ai-ml": "AI / ML",
  "solana-ecosystem": "Solana Ecosystem",
};

export default function Legend() {
  return (
    <div
      className="
        absolute bottom-4 left-4
        hidden md:grid
        rounded-xl border border-black/10 bg-white/90
        backdrop-blur-md p-3 grid-cols-2 gap-x-4 gap-y-1.5
        shadow-xl
        dark:border-white/10 dark:bg-[#0a0a1a]/80
      "
    >
      {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
        <div key={cat} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] text-[#0a0a1a]/50 dark:text-white/50">{CATEGORY_LABELS[cat] ?? cat}</span>
        </div>
      ))}
    </div>
  );
}
