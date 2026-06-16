import { ImageResponse } from "next/og";

export const alt = "Solana WTF — What The Fork?!";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0B10 0%, #0d0f1a 50%, #12142a 100%)",
          position: "relative",
        }}
      >
        {/* Top gradient line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #00FFFF, #BD00FF, #FF003F, transparent)",
          }}
        />

        {/* Corner marks */}
        <div style={{ position: "absolute", top: 32, left: 32, width: 40, height: 40, borderTop: "3px solid #00FFFF", borderLeft: "3px solid #00FFFF", display: "flex" }} />
        <div style={{ position: "absolute", top: 32, right: 32, width: 40, height: 40, borderTop: "3px solid #00FFFF", borderRight: "3px solid #00FFFF", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 32, left: 32, width: 40, height: 40, borderBottom: "3px solid #00FFFF", borderLeft: "3px solid #00FFFF", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 32, right: 32, width: 40, height: 40, borderBottom: "3px solid #00FFFF", borderRight: "3px solid #00FFFF", display: "flex" }} />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: "#1a1d2b",
              border: "2px solid #00FFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 36,
                fontWeight: 900,
                color: "#00FFFF",
              }}
            >
              W
            </span>
          </div>
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: 40,
              color: "#E0E0E0",
              letterSpacing: 4,
              textTransform: "uppercase" as const,
            }}
          >
            Solana{" "}
            <span style={{ color: "#00FFFF" }}>WTF</span>
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 22,
            color: "#8A8FA8",
            marginBottom: 48,
            letterSpacing: 2,
          }}
        >
          What The Fork?!
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: 48, fontWeight: 900, color: "#00FFFF" }}>
              1001
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 14, color: "#4A5070", letterSpacing: 2, textTransform: "uppercase" as const }}>
              terms
            </span>
          </div>
          <div style={{ width: 1, height: 48, background: "rgba(0,255,255,0.15)", display: "flex" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: 48, fontWeight: 900, color: "#BD00FF" }}>
              14
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 14, color: "#4A5070", letterSpacing: 2, textTransform: "uppercase" as const }}>
              categories
            </span>
          </div>
          <div style={{ width: 1, height: 48, background: "rgba(0,255,255,0.15)", display: "flex" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: 48, fontWeight: 900, color: "#14F195" }}>
              4
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 14, color: "#4A5070", letterSpacing: 2, textTransform: "uppercase" as const }}>
              games
            </span>
          </div>
          <div style={{ width: 1, height: 48, background: "rgba(0,255,255,0.15)", display: "flex" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: 48, fontWeight: 900, color: "#FF003F" }}>
              3
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 14, color: "#4A5070", letterSpacing: 2, textTransform: "uppercase" as const }}>
              languages
            </span>
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontFamily: "monospace",
            fontSize: 16,
            color: "#4A5070",
            letterSpacing: 3,
          }}
        >
          The Solana glossary that doesn&apos;t suck.
        </div>

        {/* Bottom gradient line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #14F195, #00FFFF, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
