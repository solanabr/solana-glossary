"use client";
import { useRef } from "react";

type Props = { value: string; onChange: (v: string) => void; placeholder?: string };

export default function SearchBar({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={{ position: "relative", maxWidth: 600, width: "100%" }}>
      <span style={{
        position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
        color: "var(--green)", fontSize: 14, pointerEvents: "none",
      }}>$</span>
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "search terms, definitions, aliases..."}
        style={{
          width: "100%", background: "var(--bg-3)",
          border: "1px solid var(--border)", borderRadius: 8,
          padding: "14px 16px 14px 36px",
          color: "var(--text)", fontFamily: "JetBrains Mono", fontSize: 14,
          outline: "none", transition: "border-color 0.2s",
        }}
        onFocus={e => (e.target.style.borderColor = "var(--green)")}
        onBlur={e => (e.target.style.borderColor = "var(--border)")}
      />
      {value && (
        <button onClick={() => onChange("")} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", color: "var(--text-muted)",
          cursor: "pointer", fontSize: 18, lineHeight: 1,
        }}>×</button>
      )}
    </div>
  );
}
