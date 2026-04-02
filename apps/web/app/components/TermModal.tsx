"use client";
import { useEffect } from "react";
import { type GlossaryTerm } from "@stbr/solana-glossary";
import TermGraph from "./TermGraph";

type Props = {
  term: GlossaryTerm;
  originalTerm: GlossaryTerm;
  color: string;
  onClose: () => void;
  onRelatedClick: (id: string) => void;
  categoryColor: Record<string, string>;
};

export default function TermModal({ term, originalTerm, color, onClose, onRelatedClick }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(8,11,15,0.85)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg-2)", border: `1px solid ${color}44`,
          borderRadius: 12, padding: "24px 16px", maxWidth: 640, width: "100%",
          maxHeight: "85vh", overflowY: "auto",
          boxShadow: `0 0 40px ${color}22`,
          animation: "fadeIn 0.2s ease",
          margin: "0 8px",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 6, fontFamily: "JetBrains Mono" }}>
              {term.id}
            </div>
            <h2 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              fontSize: 26, color: "var(--text)", lineHeight: 1.2,
            }}>
              {term.term}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: "var(--bg-3)", border: "1px solid var(--border)",
            color: "var(--text-muted)", width: 32, height: 32,
            borderRadius: 6, cursor: "pointer", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>×</button>
        </div>

        {/* category + aliases */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <span className="tag" style={{ borderColor: color + "66", color, background: color + "11" }}>
            {term.category}
          </span>
          {term.aliases?.map(a => (
            <span key={a} className="tag" style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "none" }}>
              {a}
            </span>
          ))}
        </div>

        {/* definition */}
        <div style={{
          background: "var(--bg-3)", borderLeft: `3px solid ${color}`,
          padding: "16px 20px", borderRadius: "0 8px 8px 0", marginBottom: 24,
        }}>
          <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.7 }}>
            {term.definition}
          </p>
          {term.definition === originalTerm.definition && term.term !== originalTerm.term && (
            <p style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 10, fontFamily: "JetBrains Mono" }}>
              * definição ainda não traduzida
            </p>
          )}
        </div>

        {/* graph */}
        <TermGraph term={originalTerm} color={color} onNodeClick={onRelatedClick} />

        {/* related */}
        {term.related && term.related.length > 0 && (
          <div>
            <div style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 12, fontFamily: "JetBrains Mono" }}>
              related terms
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {term.related.map(r => (
                <button key={r} onClick={() => onRelatedClick(r)} style={{
                  background: "var(--bg-3)", border: "1px solid var(--border)",
                  color: "var(--text-muted)", padding: "6px 12px",
                  borderRadius: 6, cursor: "pointer", fontFamily: "JetBrains Mono",
                  fontSize: 12, transition: "all 0.15s",
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.color = color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
