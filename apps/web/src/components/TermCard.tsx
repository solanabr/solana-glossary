import { GlossaryTerm } from "@stbr/solana-glossary";
import { categoryColors } from "@/lib/category-colors";

interface TermCardProps {
  // Already localized by the parent — this component renders it as-is.
  term: GlossaryTerm;
  onClick: (term: GlossaryTerm) => void;
}

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
