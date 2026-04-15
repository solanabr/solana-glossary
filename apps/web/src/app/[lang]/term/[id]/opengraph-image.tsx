import { ImageResponse } from "next/og";

import { getGlossaryTermSync, truncateMeta } from "@/lib/glossary-fs";
import { isUrlLang, localeFromUrlLang } from "@/lib/url-lang";

export const runtime = "nodejs";
export const alt = "Solana Glossary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const fallback = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050506",
        color: "#ececf1",
        fontSize: 42,
        fontWeight: 600,
      }}
    >
      Solana Glossary
    </div>
  );

  if (!isUrlLang(lang)) {
    return new ImageResponse(fallback, { ...size });
  }

  const term = getGlossaryTermSync(id, localeFromUrlLang(lang));
  if (!term) {
    return new ImageResponse(fallback, { ...size });
  }

  const excerpt = truncateMeta(term.definition, 220);

  return new ImageResponse(
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
          fontSize: 22,
          fontWeight: 600,
          color: "#14F195",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        Solana Glossary
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
        {term.term}
      </div>
      <div
        style={{
          fontSize: 26,
          color: "#9494a8",
          marginTop: 28,
          lineHeight: 1.35,
          maxWidth: 1040,
        }}
      >
        {excerpt}
      </div>
      <div
        style={{
          marginTop: 36,
          fontSize: 18,
          color: "#52525e",
        }}
      >
        {term.categoryLabel}
      </div>
    </div>,
    { ...size },
  );
}
