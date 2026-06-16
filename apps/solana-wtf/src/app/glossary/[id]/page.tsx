import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllTerms,
  getTerm,
  getRelatedTerms,
  CATEGORY_LABELS,
} from "@/lib/glossary";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";

/* ---------- Static generation ---------- */

export async function generateStaticParams() {
  return getAllTerms().map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const term = getTerm(id);
  if (!term) return { title: "Term not found | Solana WTF" };

  const categoryLabel = CATEGORY_LABELS[term.category] ?? term.category;
  return {
    title: `${term.term} — ${categoryLabel} | Solana WTF`,
    description: term.definition.slice(0, 160),
  };
}

/* ---------- Category color mapping ---------- */

const CATEGORY_COLORS: Record<string, { color: string; border: string; bg: string }> = {
  "core-protocol":              { color: "#14F195",      border: "rgba(20,241,149,0.35)",  bg: "rgba(20,241,149,0.10)" },
  defi:                         { color: "#FF003F",      border: "rgba(255,0,63,0.35)",    bg: "rgba(255,0,63,0.10)" },
  "dev-tools":                  { color: "#00FFFF",      border: "rgba(0,255,255,0.35)",   bg: "rgba(0,255,255,0.10)" },
  security:                     { color: "#FF003F",      border: "rgba(255,0,63,0.35)",    bg: "rgba(255,0,63,0.10)" },
  network:                      { color: "#00FFFF",      border: "rgba(0,255,255,0.35)",   bg: "rgba(0,255,255,0.10)" },
  infrastructure:               { color: "#14F195",      border: "rgba(20,241,149,0.35)",  bg: "rgba(20,241,149,0.10)" },
  "token-ecosystem":            { color: "#00FFFF",      border: "rgba(0,255,255,0.35)",   bg: "rgba(0,255,255,0.10)" },
  "solana-ecosystem":           { color: "#BD00FF",      border: "rgba(189,0,255,0.35)",   bg: "rgba(189,0,255,0.10)" },
  "programming-model":          { color: "#00FFFF",      border: "rgba(0,255,255,0.35)",   bg: "rgba(0,255,255,0.10)" },
  "programming-fundamentals":   { color: "#BD00FF",      border: "rgba(189,0,255,0.35)",   bg: "rgba(189,0,255,0.10)" },
  "blockchain-general":         { color: "#BD00FF",      border: "rgba(189,0,255,0.35)",   bg: "rgba(189,0,255,0.10)" },
  web3:                         { color: "#14F195",      border: "rgba(20,241,149,0.35)",  bg: "rgba(20,241,149,0.10)" },
  "ai-ml":                      { color: "#00FFFF",      border: "rgba(0,255,255,0.35)",   bg: "rgba(0,255,255,0.10)" },
  "zk-compression":             { color: "#BD00FF",      border: "rgba(189,0,255,0.35)",   bg: "rgba(189,0,255,0.10)" },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? {
    color: "#BD00FF",
    border: "rgba(189,0,255,0.35)",
    bg: "rgba(189,0,255,0.10)",
  };
}

/* ---------- Page component ---------- */

export default async function TermDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const term = getTerm(id);

  if (!term) {
    return <TermNotFound id={id} />;
  }

  const relatedTerms = getRelatedTerms(term.id);
  const categoryLabel = CATEGORY_LABELS[term.category] ?? term.category;
  const catStyle = getCategoryStyle(term.category);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--bg-0)" }}
    >
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="orb animate-pulse-glow"
          style={{
            width: 500,
            height: 500,
            background: catStyle.color,
            top: -200,
            left: "30%",
          }}
        />
        <div
          className="orb animate-pulse-glow"
          style={{
            width: 350,
            height: 350,
            background: "var(--cyber-cyan)",
            bottom: "10%",
            right: "10%",
            animationDelay: "1.5s",
          }}
        />
      </div>

      {/* Nav */}
      <CyberNav active="glossary" />

      {/* Main content */}
      <main className="relative z-10 px-4 sm:px-8 pt-4 pb-16 sm:pb-20 max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/glossary"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-[var(--cyber-cyan)] transition-colors duration-150 mb-6 group"
          style={{ fontFamily: "var(--font-label)", letterSpacing: "1px", textTransform: "uppercase", fontSize: "12px" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="transition-transform duration-150 group-hover:-translate-x-1"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Glossary
        </Link>

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs mb-8"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <Link
            href="/glossary"
            className="text-text-muted hover:text-[var(--cyber-cyan)] transition-colors duration-150"
          >
            Glossary
          </Link>
          <span className="text-text-muted">/</span>
          <Link
            href={`/glossary?category=${term.category}`}
            className="transition-colors duration-150"
            style={{ color: catStyle.color }}
          >
            {categoryLabel}
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-text-primary">{term.term}</span>
        </nav>

        {/* Term header card */}
        <div className="glow-card p-8 md:p-10 mb-8" style={{ transform: "none" }}>
          {/* Category badge + pixel ID */}
          <div className="flex items-center gap-3 mb-5">
            <span
              className="px-3 py-1.5 text-xs font-medium"
              style={{
                color: catStyle.color,
                background: catStyle.bg,
                border: `1px solid ${catStyle.border}`,
                fontFamily: "var(--font-label)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
              }}
            >
              {categoryLabel}
            </span>
            <span
              className="pixel-badge"
              style={{
                borderColor: "var(--text-muted)",
                color: "var(--text-muted)",
              }}
            >
              {term.id}
            </span>
          </div>

          {/* Term name */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            style={{ fontFamily: "var(--font-title)" }}>
            <span className="gradient-text">{term.term}</span>
          </h1>

          {/* Aliases */}
          {term.aliases && term.aliases.length > 0 && (
            <div className="flex items-center flex-wrap gap-2 mb-6">
              <span
                className="text-xs uppercase tracking-wider"
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  letterSpacing: "2px",
                }}
              >
                Also known as
              </span>
              {term.aliases.map((alias) => (
                <span
                  key={alias}
                  className="px-3 py-1 text-xs"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-mono)",
                    clipPath: "polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0% calc(100% - 3px), 0% 3px)",
                  }}
                >
                  {alias}
                </span>
              ))}
            </div>
          )}

          {/* Definition */}
          <div
            className="leading-[1.8] text-base md:text-lg max-w-[65ch]"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {term.definition}
          </div>

          {/* Decode CTA */}
          <div className="mt-8 flex items-center gap-4">
            <Link
              href={`/decoder?term=${term.id}`}
              className="neon-btn text-sm py-2.5 px-7 inline-flex items-center gap-2.5 no-underline"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Decode this term
            </Link>
          </div>
        </div>

        {/* Related terms section */}
        {relatedTerms.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-semibold text-text-secondary"
                style={{ fontFamily: "var(--font-label)", letterSpacing: "1px", textTransform: "uppercase" }}>
                Related terms
              </h2>
              <span className="pixel-badge" style={{ borderColor: "var(--cyber-cyan)", color: "var(--cyber-cyan)" }}>
                {relatedTerms.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedTerms.map((related) => {
                const relCatStyle = getCategoryStyle(related.category);
                const relCatLabel =
                  CATEGORY_LABELS[related.category] ?? related.category;
                const shortDef =
                  related.definition.length > 120
                    ? related.definition.slice(0, 120).trimEnd() + "..."
                    : related.definition;

                return (
                  <Link
                    key={related.id}
                    href={`/glossary/${related.id}`}
                    className="block no-underline"
                  >
                    <div className="glow-card p-5 h-full">
                      {/* Category badge */}
                      <span
                        className="inline-block px-2.5 py-1 text-[10px] font-medium mb-3"
                        style={{
                          color: relCatStyle.color,
                          background: relCatStyle.bg,
                          border: `1px solid ${relCatStyle.border}`,
                          fontFamily: "var(--font-label)",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          clipPath: "polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0% calc(100% - 3px), 0% 3px)",
                        }}
                      >
                        {relCatLabel}
                      </span>

                      {/* Term name */}
                      <h3 className="text-base font-semibold text-text-primary mb-2"
                        style={{ fontFamily: "var(--font-label)" }}>
                        {related.term}
                      </h3>

                      {/* Short definition */}
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                      >
                        {shortDef}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <CyberFooter />
    </div>
  );
}

/* ---------- 404-like fallback ---------- */

function TermNotFound({ id }: { id: string }) {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: "var(--bg-0)" }}
    >
      {/* Nav */}
      <CyberNav />

      {/* 404 content */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center max-w-md px-8">
          <div
            className="text-6xl font-bold mb-4 gradient-text"
            style={{ fontFamily: "var(--font-title)", fontSize: "48px", letterSpacing: "4px" }}
          >
            404
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-3"
            style={{ fontFamily: "var(--font-title)" }}>
            WTF is{" "}
            <span
              style={{ color: "var(--cyber-cyan)", fontFamily: "var(--font-mono)" }}
            >
              &quot;{id}&quot;
            </span>
            ?
          </h1>
          <p className="text-text-muted text-sm mb-8 leading-relaxed"
            style={{ fontFamily: "var(--font-mono)" }}>
            We couldn&apos;t find that term in our glossary. It might not exist
            yet, or you may have followed a broken link.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/glossary"
              className="neon-btn text-sm py-2.5 px-7 inline-flex items-center gap-2 no-underline"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Browse Glossary
            </Link>
            <Link
              href={`/decoder?term=${id}`}
              className="px-6 py-2.5 text-sm font-medium transition-all duration-150 no-underline border"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
                fontFamily: "var(--font-label)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                clipPath: "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)",
              }}
            >
              Try the Decoder
            </Link>
          </div>
        </div>
      </div>

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="orb animate-pulse-glow"
          style={{
            width: 400,
            height: 400,
            background: "var(--cyber-magenta)",
            top: "20%",
            left: "40%",
            opacity: 0.15,
          }}
        />
      </div>
    </div>
  );
}
