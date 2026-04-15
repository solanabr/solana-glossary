"use client";
import { type GlossaryTerm } from "@stbr/solana-glossary";

type Props = {
  term: GlossaryTerm;
  color: string;
  onClick: () => void;
  style?: React.CSSProperties;
};

export default function TermCard({ term, color, onClick, style }: Props) {
  const def = term.definition.length > 120
    ? term.definition.slice(0, 120) + "…"
    : term.definition;

  return (
    <div
      className="card animate-in"
      onClick={onClick}
      style={{
        padding: "20px", cursor: "pointer", ...style,
        opacity: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
        <h3 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700,
          fontSize: 15, color: "var(--text)", lineHeight: 1.3,
        }}>
          {term.term}
        </h3>
        <span className="tag" style={{
          borderColor: color + "44", color, background: color + "11",
          flexShrink: 0, fontSize: 10,
        }}>
          {term.category.replace(/-/g, " ")}
        </span>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        {def}
      </p>

      {term.related && term.related.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {term.related.slice(0, 3).map(r => (
            <span key={r} style={{
              fontSize: 11, color: "var(--text-dim)",
              background: "var(--bg-3)", padding: "2px 6px",
              borderRadius: 3, fontFamily: "JetBrains Mono",
            }}>
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
