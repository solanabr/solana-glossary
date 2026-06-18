"use client";

import { useCallback } from "react";
import { getTerm } from "@/lib/glossary";
import { useAtlasStore } from "@/lib/store";
import { categoryColor, CATEGORY_COLORS } from "@/lib/colors";

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
  "blockchain-general": "Blockchain General",
  web3: "Web3",
  "programming-fundamentals": "Programming Fundamentals",
  "ai-ml": "AI / ML",
  "solana-ecosystem": "Solana Ecosystem",
};

export default function TermPanel() {
  const { selectedTerm, setSelectedTerm } = useAtlasStore();

  const handleClose = useCallback(() => setSelectedTerm(null), [setSelectedTerm]);

  const handleRelatedClick = useCallback(
    (id: string) => {
      const t = getTerm(id);
      if (t) setSelectedTerm(t);
    },
    [setSelectedTerm]
  );

  if (!selectedTerm) return null;

  const color = categoryColor(selectedTerm.category);

  return (
    <div
      className="
        absolute left-1/2 -translate-x-1/2 bottom-2 max-h-[62vh] w-[calc(100%-2rem)] max-w-sm
        md:left-auto md:translate-x-0 md:right-4 md:top-[64px] md:bottom-4 md:w-80 md:max-h-none md:max-w-none
        flex flex-col rounded-xl border
        border-black/10 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl
        dark:border-white/10 dark:bg-[#0a0a1a]/90
      "
      style={{ borderTopColor: color }}
    >
      <div className="flex items-start justify-between gap-2 p-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color }}>
              {CATEGORY_LABELS[selectedTerm.category] ?? selectedTerm.category}
            </span>
          </div>
          <h2 className="text-base font-semibold leading-snug text-[#0a0a1a] dark:text-white">
            {selectedTerm.term}
          </h2>
        </div>
        <button
          onClick={handleClose}
          className="mt-0.5 shrink-0 text-[#0a0a1a]/30 hover:text-[#0a0a1a]/70 transition-colors dark:text-white/30 dark:hover:text-white/70"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 3l10 10M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5 custom-scrollbar">
        {selectedTerm.definition ? (
          <p className="text-sm leading-relaxed text-[#0a0a1a]/70 dark:text-white/70">{selectedTerm.definition}</p>
        ) : (
          <p className="text-sm italic text-[#0a0a1a]/30 dark:text-white/30">No definition yet.</p>
        )}

        {selectedTerm.aliases && selectedTerm.aliases.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-[10px] uppercase tracking-widest font-medium text-[#0a0a1a]/40 dark:text-white/30">
              Also known as
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {selectedTerm.aliases.map((alias: string) => (
                <span
                  key={alias}
                  className="rounded-md border border-black/10 bg-black/5 px-2 py-0.5 text-xs text-[#0a0a1a]/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedTerm.related && selectedTerm.related.length > 0 && (
          <div>
            <h3 className="mb-2 text-[10px] uppercase tracking-widest font-medium text-[#0a0a1a]/40 dark:text-white/30">
              Related Terms
            </h3>
            <div className="flex flex-col gap-1">
              {selectedTerm.related.map((relId: string) => {
                const rel = getTerm(relId);
                if (!rel) return null;
                const relColor = categoryColor(rel.category);
                return (
                  <button
                    key={relId}
                    onClick={() => handleRelatedClick(relId)}
                    className="
                      flex items-center gap-2 rounded-lg border border-black/5 bg-black/5
                      px-3 py-2 text-left text-sm text-[#0a0a1a]/70
                      hover:border-black/10 hover:bg-black/10 hover:text-[#0a0a1a]
                      transition-all
                      dark:border-white/5 dark:bg-white/5 dark:text-white/70
                      dark:hover:border-white/15 dark:hover:bg-white/10 dark:hover:text-white
                    "
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: relColor }}
                    />
                    <span className="truncate">{rel.term}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
