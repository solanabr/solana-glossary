import Link from "next/link";

export default function CyberFooter() {
  return (
    <footer
      className="px-4 sm:px-8 md:px-10"
      style={{
        borderTop: "1px solid rgba(0,255,255,0.08)",
        paddingTop: 20,
        paddingBottom: 20,
        maxWidth: 1200,
        margin: "20px auto 0",
        position: "relative",
      }}
    >
      {/* Gradient top line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, #00FFFF, #BD00FF, transparent)",
          opacity: 0.2,
          pointerEvents: "none",
        }}
      />

      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Left side — logo + name */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              background: "#14161F",
              border: "1px solid #00FFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              clipPath:
                "polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0% calc(100% - 3px), 0% 3px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 7,
                fontWeight: 900,
                color: "#00FFFF",
                lineHeight: 1,
              }}
            >
              W
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Fira Code', monospace",
              fontSize: 11,
              color: "#4A5070",
            }}
          >
            Solana WTF &mdash; What The Fork?!
          </span>
        </Link>

        {/* Right side — SDK info */}
        <span
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: 11,
            color: "#4A5070",
          }}
        >
          Built on{" "}
          <span style={{ color: "#00FFFF" }}>@stbr/solana-glossary</span>
        </span>
      </div>

      {/* Bottom row — creator info */}
      <div
        className="flex-col sm:flex-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid rgba(0,255,255,0.04)",
        }}
      >
        <span
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: 11,
            color: "#4A5070",
          }}
        >
          Created by{" "}
          <a
            href="https://www.giulopesgalvao.com.br"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#BD00FF",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
          >
            Giuliana Lopes Galvão
          </a>
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "'Fira Code', monospace",
            fontSize: 11,
          }}
        >
          <a
            href="https://www.linkedin.com/in/giulopesg"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#4A5070", textDecoration: "none" }}
          >
            LinkedIn
          </a>
          <Link
            href="/about"
            style={{ color: "#4A5070", textDecoration: "none" }}
          >
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
