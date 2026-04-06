"use client";

import type { GlossaryTerm } from "@/lib/builder";

const CATEGORY_COLORS: Record<string, string> = {
  "core-protocol": "#9945FF",
  "programming-model": "#14F195",
  "token-ecosystem": "#F5A623",
  defi: "#00C2FF",
  "zk-compression": "#FF6B6B",
  infrastructure: "#A8E063",
  security: "#FF4D6D",
  "dev-tools": "#4ECDC4",
  network: "#45B7D1",
  "blockchain-general": "#96CEB4",
  web3: "#FFEAA7",
  "programming-fundamentals": "#DDA0DD",
  "ai-ml": "#98D8C8",
  "solana-ecosystem": "#FFB347",
};

interface Props {
  concepts: GlossaryTerm[];
  showDefinitions: boolean;
  onCopy: () => void;
}

export default function ConceptsPanel({ concepts, showDefinitions, onCopy }: Props) {
  const grouped = concepts.reduce<Record<string, GlossaryTerm[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-white/30">
          Concepts
        </span>
        <button
          onClick={onCopy}
          className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
        >
          Copy
        </button>
      </div>
      {concepts.length === 0 ? (
        <p className="text-sm text-white/20 italic">No concepts detected.</p>
      ) : (
        Object.entries(grouped).map(([category, terms]) => (
          <div key={category}>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-white/20">{category}</p>
            <div className="flex flex-wrap gap-1.5">
              {terms.map((t) => (
                <div key={t.id} className={showDefinitions ? "w-full" : ""}>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[t.category] ?? "#666"}22`,
                      color: CATEGORY_COLORS[t.category] ?? "#ccc",
                      border: `1px solid ${CATEGORY_COLORS[t.category] ?? "#666"}44`,
                    }}
                  >
                    {t.term}
                  </span>
                  {showDefinitions && t.definition && (
                    <p className="mt-1 mb-2 pl-1 text-xs text-white/40 leading-relaxed">
                      {t.definition}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
