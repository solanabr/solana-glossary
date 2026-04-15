"use client";
type Props = {
  categories: string[];
  active: string | null;
  onChange: (c: string | null) => void;
  colors: Record<string, string>;
  counts: Record<string, number>;
};
export default function CategoryFilter({ categories, active, onChange, colors, counts }: Props) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button onClick={() => onChange(null)} className="tag" style={{
        borderColor: !active ? "var(--green)" : "var(--border)",
        color: !active ? "var(--green)" : "var(--text-muted)",
        background: "none", cursor: "pointer",
      }}>all ({Object.values(counts).reduce((a, b) => a + b, 0)})</button>
      {categories.map(c => (
        <button key={c} onClick={() => onChange(active === c ? null : c)} className="tag" style={{
          borderColor: active === c ? colors[c] || "var(--green)" : "var(--border)",
          color: active === c ? colors[c] || "var(--green)" : "var(--text-muted)",
          background: "none", cursor: "pointer", transition: "all 0.15s",
        }}>{c} ({counts[c] || 0})</button>
      ))}
    </div>
  );
}
