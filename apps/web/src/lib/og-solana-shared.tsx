/**
 * Shared JSX for `next/og` ImageResponse — Solana gradient stripes + title + summary.
 * Term pages keep their own `opengraph-image.tsx` (unchanged).
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

function truncateSummary(text: string, max = 200): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function SolanaBrandOg(props: {
  eyebrow: string;
  title: string;
  summary: string;
}) {
  const excerpt = truncateSummary(props.summary);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, #050506 0%, #12121a 45%, #0a1f18 100%)",
        padding: 56,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 220,
            height: 22,
            borderRadius: 5,
            background: "linear-gradient(90deg, #9945FF 0%, #14F195 100%)",
          }}
        />
        <div
          style={{
            width: 190,
            height: 22,
            borderRadius: 5,
            marginLeft: 28,
            background: "linear-gradient(90deg, #00C2FF 0%, #9945FF 100%)",
          }}
        />
        <div
          style={{
            width: 210,
            height: 22,
            borderRadius: 5,
            marginLeft: 14,
            background: "linear-gradient(90deg, #14F195 0%, #00C2FF 100%)",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#14F195",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        {props.eyebrow}
      </div>
      <div
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: "#ececf1",
          lineHeight: 1.12,
          maxWidth: 1040,
        }}
      >
        {props.title}
      </div>
      <div
        style={{
          fontSize: 26,
          color: "#9494a8",
          marginTop: 26,
          lineHeight: 1.35,
          maxWidth: 1000,
        }}
      >
        {excerpt}
      </div>
    </div>
  );
}
