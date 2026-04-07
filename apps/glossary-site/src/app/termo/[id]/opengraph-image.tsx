import { ImageResponse } from "next/og";
import { getTerm } from "@stbr/solana-glossary";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/categories";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const term = getTerm(id);

  // Fallback image
  if (!term) {
    return new ImageResponse(
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0F0F13",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #9945FF, #14F195)",
          }}
        />
        <div style={{ color: "#14F195", fontSize: 48, fontWeight: 800 }}>
          Glossário Solana
        </div>
        <div style={{ color: "#A0A0B0", fontSize: 24 }}>1001 termos</div>
      </div>,
      { width: 1200, height: 630 },
    );
  }

  const catColor = CATEGORY_COLORS[term.category] ?? "#9945FF";
  const catLabel = CATEGORY_LABELS[term.category] ?? term.category;
  const definition =
    term.definition.length > 120
      ? term.definition.slice(0, 120) + "…"
      : term.definition;

  // Clamp term name so it doesn't overflow
  const termName =
    term.term.length > 40 ? term.term.slice(0, 40) + "…" : term.term;

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#0F0F13",
        display: "flex",
        flexDirection: "column",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Top gradient bar */}
      <div
        style={{
          width: "100%",
          height: 8,
          background: "linear-gradient(90deg, #9945FF, #14F195)",
          flexShrink: 0,
        }}
      />

      {/* Subtle background glow */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `${catColor}18`,
          filter: "blur(80px)",
        }}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "56px 80px 48px",
          gap: 0,
        }}
      >
        {/* Category badge */}
        <div
          style={{
            display: "flex",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: `${catColor}33`,
              color: catColor,
              borderRadius: 100,
              padding: "6px 20px",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {catLabel}
          </div>
        </div>

        {/* Term name */}
        <div
          style={{
            color: "#FFFFFF",
            fontSize: termName.length > 25 ? 64 : 80,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            marginBottom: 28,
          }}
        >
          {termName}
        </div>

        {/* Definition */}
        <div
          style={{
            color: "#B0B0C0",
            fontSize: 26,
            lineHeight: 1.55,
            flex: 1,
          }}
        >
          {definition}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Solana logo dots */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {["#9945FF", "#14F195", "#00C2FF"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 16,
                    height: 4,
                    borderRadius: 2,
                    background: c,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                color: "#14F195",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Glossário Solana · 1001 termos
            </div>
          </div>

          <div
            style={{
              color: "#606070",
              fontSize: 18,
            }}
          >
            solana-glossary-lek6.vercel.app
          </div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
