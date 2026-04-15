"use client";
import { useState, useMemo, useCallback } from "react";
import {
  getTerm,
  searchTerms,
  getTermsByCategory,
  getCategories,
  allTerms,
  type GlossaryTerm,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import TermModal from "./components/TermModal";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import TermCard from "./components/TermCard";
import Header from "./components/Header";

const CATEGORY_COLORS: Record<string, string> = {
  "core-protocol": "#9945ff",
  "programming-model": "#14f195",
  "token-ecosystem": "#03e1ff",
  "defi": "#f5a623",
  "zk-compression": "#e040fb",
  "infrastructure": "#64b5f6",
  "security": "#ef5350",
  "dev-tools": "#66bb6a",
  "network": "#26c6da",
  "blockchain-general": "#8d8d8d",
  "web3": "#ff7043",
  "programming-fundamentals": "#ab47bc",
  "ai-ml": "#29b6f6",
  "solana-ecosystem": "#ffd54f",
};

export { CATEGORY_COLORS };

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [lang, setLang] = useState<"en" | "pt">("en");
  const [page, setPage] = useState(1);
  const PER_PAGE = 30;

  const categories = getCategories();

  const ptTerms = useMemo(() => {
    try { return getLocalizedTerms("pt"); } catch { return []; }
  }, []);

  const localize = useCallback((term: GlossaryTerm): GlossaryTerm => {
    if (lang === "en") return term;
    const loc = ptTerms.find((t) => t.id === term.id);
    if (!loc) return term;
    return { ...term, term: loc.term, definition: loc.definition || term.definition };
  }, [lang, ptTerms]);

  const filtered = useMemo(() => {
    let terms = allTerms;
    if (activeCategory) terms = getTermsByCategory(activeCategory as never);
    if (query.trim()) terms = searchTerms(query).filter(t =>
      activeCategory ? t.category === activeCategory : true
    );
    return terms;
  }, [query, activeCategory]);

  const paginated = useMemo(() => filtered.slice(0, page * PER_PAGE), [filtered, page]);

  const handleSearch = (q: string) => { setQuery(q); setPage(1); };
  const handleCategory = (c: string | null) => { setActiveCategory(c); setPage(1); };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header lang={lang} onLangToggle={() => setLang(l => l === "en" ? "pt" : "en")} />

      {/* Hero */}
      <section style={{ padding: "40px 16px 32px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--green)", fontFamily: "JetBrains Mono", fontSize: 13 }}>
            $ solana-glossary
          </span>
          <span style={{ color: "var(--text-dim)", fontSize: 13 }}>—</span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>v1.0.0</span>
        </div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(36px, 6vw, 72px)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          marginBottom: 16,
        }}>
          <span style={{ color: "var(--text)" }}>Solana</span>{" "}
          <span style={{ color: "var(--green)" }} className="glow-green">{lang === "pt" ? "Glossário" : "Glossary"}</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 560, lineHeight: 1.6, marginBottom: 32 }}>
          {allTerms.length} {lang === "pt" ? "termos" : "terms"} · {categories.length} {lang === "pt" ? "categorias" : "categories"} · {lang === "pt" ? "referências cruzadas completas" : "full cross-references"}
          {lang === "pt" && " · pt-BR"}
        </p>
        <SearchBar value={query} onChange={handleSearch} placeholder={lang === "pt" ? "buscar termos, definições, aliases..." : "search terms, definitions, aliases..."} />
      </section>

      {/* Stats bar */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 24, overflowX: "auto" }}>
          {categories.map(c => (
            <button key={c} onClick={() => handleCategory(activeCategory === c ? null : c)}
              style={{
                background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                color: activeCategory === c ? CATEGORY_COLORS[c] || "var(--green)" : "var(--text-muted)",
                fontSize: 12, fontFamily: "JetBrains Mono", padding: "4px 0",
                borderBottom: activeCategory === c ? `2px solid ${CATEGORY_COLORS[c] || "var(--green)"}` : "2px solid transparent",
                transition: "all 0.15s",
              }}>
              {c} <span style={{ color: "var(--text-dim)" }}>({getTermsByCategory(c as never).length})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Results */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: 20, color: "var(--text-muted)", fontSize: 13 }}>
          {query || activeCategory
            ? <><span style={{ color: "var(--green)" }}>{filtered.length}</span> {lang === "pt" ? "resultados" : "results"}{query ? ` ${lang === "pt" ? "para" : "for"} "${query}"` : ""}{activeCategory ? ` ${lang === "pt" ? "em" : "in"} ${activeCategory}` : ""}</>
            : <><span style={{ color: "var(--green)" }}>{filtered.length}</span> {lang === "pt" ? "termos" : "terms"}</>
          }
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}>
          {paginated.map((term, i) => (
            <TermCard
              key={term.id}
              term={localize(term)}
              color={CATEGORY_COLORS[term.category] || "var(--green)"}
              onClick={() => setSelectedTerm(term)}
              style={{ animationDelay: `${(i % PER_PAGE) * 20}ms` }}
            />
          ))}
        </div>

        {paginated.length < filtered.length && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button onClick={() => setPage(p => p + 1)} style={{
              background: "var(--bg-3)", border: "1px solid var(--border-bright)",
              color: "var(--text)", padding: "10px 28px", borderRadius: 6,
              cursor: "pointer", fontFamily: "JetBrains Mono", fontSize: 13,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-bright)")}
            >
              {lang === "pt" ? `carregar mais (${filtered.length - paginated.length} restantes)` : `load more (${filtered.length - paginated.length} remaining)`}
            </button>
          </div>
        )}
      </section>

      {selectedTerm && (
        <TermModal
          term={localize(selectedTerm)}
          originalTerm={selectedTerm}
          color={CATEGORY_COLORS[selectedTerm.category] || "var(--green)"}
          onClose={() => setSelectedTerm(null)}
          onRelatedClick={(id) => {
            const t = getTerm(id);
            if (t) setSelectedTerm(t);
          }}
          categoryColor={CATEGORY_COLORS}
        />
      )}
    </main>
  );
}
