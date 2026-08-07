import { GlossaryTerm } from "@stbr/solana-glossary";

interface TermCardProps {
  // Already localized by the parent — this component renders it as-is.
  term: GlossaryTerm;
  onClick: (term: GlossaryTerm) => void;
}

const categoryColors: Record<string, string> = {
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

export function TermCard({ term, onClick }: TermCardProps) {
  const shortDef =
    term.definition.length > 120
      ? term.definition.slice(0, 120) + "…"
      : term.definition;

  return (
    <button
      onClick={() => onClick(term)}
      className="w-full text-left p-3.5 bg-card border border-border rounded-lg hover:bg-surface-elevated hover:border-primary/20 transition-all group animate-slide-up motion-reduce:animate-none"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {term.term}
        </h3>
        <span
          className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${categoryColors[term.category] || "bg-muted text-muted-foreground"}`}
        >
          {term.category}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
        {shortDef}
      </p>
      {term.aliases && term.aliases.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {term.aliases.slice(0, 3).map((a) => (
            <span
              key={a}
              className="text-[9px] px-1 py-0.5 bg-muted rounded text-muted-foreground"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
