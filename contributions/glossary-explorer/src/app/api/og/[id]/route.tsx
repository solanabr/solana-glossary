import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Dynamic import to avoid bundling all terms in edge runtime
  const { getTerm } = await import("@/lib/glossary");
  const term = getTerm(id);

  if (!term) {
    return new Response("Term not found", { status: 404 });
  }

  const categoryColors: Record<string, string> = {
    "core-protocol": "#14F195",
    "programming-model": "#9945FF",
    "token-ecosystem": "#FFD93D",
    defi: "#FF6B6B",
    "zk-compression": "#00D4FF",
    infrastructure: "#FF9F43",
    security: "#EE5A24",
    "dev-tools": "#0ABDE3",
    network: "#10AC84",
    "blockchain-general": "#A29BFE",
    web3: "#FD79A8",
    "programming-fundamentals": "#6C5CE7",
    "ai-ml": "#00CEC9",
    "solana-ecosystem": "#E17055",
  };

  const color = categoryColors[term.category] ?? "#9945FF";

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
        padding: "60px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Top: category badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            background: `${color}22`,
            color: color,
            padding: "6px 16px",
            borderRadius: "999px",
            fontSize: "16px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {term.category}
        </div>
        {term.aliases && term.aliases.length > 0 && (
          <div
            style={{
              color: "#ffffff66",
              fontSize: "16px",
            }}
          >
            {term.aliases.join(" · ")}
          </div>
        )}
      </div>

      {/* Center: term + definition */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            fontSize: "56px",
            fontWeight: 800,
            background: `linear-gradient(135deg, ${color}, #ffffff)`,
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1.1,
          }}
        >
          {term.term}
        </div>
        <div
          style={{
            fontSize: "22px",
            color: "#ffffffcc",
            lineHeight: 1.5,
            maxWidth: "900px",
          }}
        >
          {term.definition.length > 200
            ? `${term.definition.slice(0, 200)}...`
            : term.definition}
        </div>
      </div>

      {/* Bottom: branding */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #9945FF, #14F195)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            solexicon
          </div>
          <div style={{ color: "#ffffff44", fontSize: "16px" }}>
            1001 terms · 14 categories
          </div>
        </div>
        <div style={{ color: "#ffffff44", fontSize: "14px" }}>
          @stbr/solexicon
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
