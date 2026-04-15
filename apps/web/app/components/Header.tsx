"use client";
type Props = { lang: "en" | "pt"; onLangToggle: () => void };

export default function Header({ lang, onLangToggle }: Props) {
  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      background: "rgba(8,11,15,0.8)",
      backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 24px",
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--green)", display: "inline-block",
            animation: "pulse-green 2s infinite",
          }} />
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
            @stbr/<span style={{ color: "var(--text)" }}>solana-glossary</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onLangToggle} style={{
            background: "var(--bg-3)", border: "1px solid var(--border)",
            color: lang === "pt" ? "var(--green)" : "var(--text-muted)",
            padding: "4px 12px", borderRadius: 4, cursor: "pointer",
            fontFamily: "JetBrains Mono", fontSize: 12,
            transition: "all 0.2s",
          }}>
            {lang === "en" ? "EN" : "PT"}
          </button>
          <a href="/quiz" style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none", fontFamily: "JetBrains Mono" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--green)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
            quiz
          </a>
          <a href="https://github.com/solanabr/solana-glossary" target="_blank" rel="noreferrer"
            style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
            GitHub ↗
          </a>
        </div>
      </div>
    </header>
  );
}
