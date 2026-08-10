// GET /api/og — dynamic 1200×630 Open Graph image for the Solana Glossary.
//
// Purely query-param driven so it stays tiny and fast: it does NOT import
// @stbr/solana-glossary (that 1.7 MB data set blows Vercel's OG-function size
// limit). All copy is passed in by /api/meta. Fonts are fetched once from
// Google's gstatic CDN and memoized at module scope for the function's warm
// lifetime. The rendered PNG is immutable and cached for a year — bump the
// caller's `v=` param to invalidate.
//
// Plain .ts with React.createElement, NOT .tsx: @vercel/node does not
// JSX-compile vanilla api/ .tsx functions — the file dies at parse and every
// invocation returns FUNCTION_INVOCATION_FAILED (verified in production).

import React from "react";
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "nodejs" };

const h = React.createElement;

const WIDTH = 1200;
const HEIGHT = 630;

// Brand tokens (mirror apps/web/src/index.css).
const BG = "#0d0e12";
const GREEN = "#21ca97";
const PURPLE = "#8354d4";
const FG = "#f4f5f7";
const MUTED = "#9da3af";
const BORDER = "#272c34";
const GRADIENT = `linear-gradient(90deg, ${GREEN}, ${PURPLE})`;

const TITLE_MAX = 100;
const SUBTITLE_MAX = 200;

type OgKind = "default" | "term" | "category" | "page";
const KINDS: readonly OgKind[] = ["default", "term", "category", "page"];

// ---------------------------------------------------------------------------
// Fonts — fetched from the Google Fonts CSS API, memoized per family+weight.
// An old User-Agent forces a WOFF/TTF payload (Satori cannot parse WOFF2), and
// we isolate the `latin` subset whose unicode-range (U+0000-00FF) already
// covers the accents used by en/pt/es (á é í ó ú ã õ ç ñ ¿ ¡).
// ---------------------------------------------------------------------------

interface LoadedFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 700;
  style: "normal";
}

const LEGACY_UA =
  "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko";

const fontCache = new Map<string, Promise<LoadedFont | null>>();

function pickLatinFontUrl(css: string): string | null {
  // The CSS API emits one `@font-face` per subset, each preceded by a
  // `/* latin */`-style comment. Grab the block after the exact `latin`
  // marker (not `latin-ext`) and read its font URL.
  const segment = css.split(/\/\*\s*latin\s*\*\//)[1] ?? css;
  const match = segment.match(
    /url\((https:\/\/[^)]+)\)\s*format\('(?:woff|truetype|opentype)'\)/,
  );
  return match ? match[1] : null;
}

function loadFont(
  family: string,
  weight: 400 | 500 | 700,
): Promise<LoadedFont | null> {
  const key = `${family}:${weight}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const promise = (async (): Promise<LoadedFont | null> => {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@${weight}`;
    const cssRes = await fetch(cssUrl, {
      headers: { "User-Agent": LEGACY_UA },
    });
    if (!cssRes.ok) return null;
    const url = pickLatinFontUrl(await cssRes.text());
    if (!url) return null;
    const fontRes = await fetch(url);
    if (!fontRes.ok) return null;
    return {
      name: family,
      data: await fontRes.arrayBuffer(),
      weight,
      style: "normal",
    };
  })().catch(() => null);

  fontCache.set(key, promise);
  return promise;
}

async function loadFonts(): Promise<LoadedFont[]> {
  const fonts = await Promise.all([
    loadFont("Inter", 400),
    loadFont("Inter", 700),
    loadFont("JetBrains Mono", 500),
  ]);
  return fonts.filter((f): f is LoadedFont => f !== null);
}

// ---------------------------------------------------------------------------
// Param parsing
// ---------------------------------------------------------------------------

function clamp(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length > max
    ? `${trimmed.slice(0, max - 1).trimEnd()}…`
    : trimmed;
}

function parseKind(raw: string | null): OgKind {
  return KINDS.includes(raw as OgKind) ? (raw as OgKind) : "default";
}

/** Title-case a raw category slug as a display fallback (meta.ts passes a real label). */
function prettify(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function titleSize(title: string): number {
  const n = title.length;
  if (n > 72) return 46;
  if (n > 52) return 54;
  if (n > 34) return 62;
  return 70;
}

// ---------------------------------------------------------------------------
// Logo mark — inline SVG with a green→purple linear gradient. Inline
// <linearGradient> renders reliably in Satori (CSS background-clip:text does
// not), so the wordmark gradient lives here rather than in text styling.
// ---------------------------------------------------------------------------

function logoMark(): React.ReactElement {
  return h(
    "svg",
    {
      width: "52",
      height: "52",
      viewBox: "0 0 48 48",
      xmlns: "http://www.w3.org/2000/svg",
    },
    h(
      "defs",
      null,
      h(
        "linearGradient",
        {
          id: "markGradient",
          x1: "0",
          y1: "0",
          x2: "48",
          y2: "48",
          gradientUnits: "userSpaceOnUse",
        },
        h("stop", { offset: "0", stopColor: GREEN }),
        h("stop", { offset: "1", stopColor: PURPLE }),
      ),
    ),
    h("rect", {
      x: "0",
      y: "0",
      width: "48",
      height: "48",
      rx: "13",
      fill: "url(#markGradient)",
    }),
    h("rect", {
      x: "12",
      y: "15",
      width: "24",
      height: "4.5",
      rx: "2.25",
      fill: BG,
    }),
    h("rect", {
      x: "12",
      y: "22",
      width: "24",
      height: "4.5",
      rx: "2.25",
      fill: BG,
    }),
    h("rect", {
      x: "12",
      y: "29",
      width: "15",
      height: "4.5",
      rx: "2.25",
      fill: BG,
    }),
  );
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handler(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);

    const kind = parseKind(searchParams.get("kind"));
    const title = clamp(
      searchParams.get("title") || "Solana Glossary",
      TITLE_MAX,
    );
    const subtitle = clamp(searchParams.get("subtitle") || "", SUBTITLE_MAX);
    const categoryRaw = (searchParams.get("category") || "").trim();
    const category = categoryRaw.includes("-")
      ? prettify(categoryRaw)
      : categoryRaw;

    // Eyebrow above the title: a category badge for terms, a "CATEGORY" tag for
    // category pages, nothing otherwise.
    const eyebrow =
      kind === "term" && category
        ? category
        : kind === "category"
          ? "CATEGORY"
          : "";

    const footerLabel =
      kind === "category" && category ? category : "1059 terms";

    const fonts = await loadFonts();

    const accentBar = h("div", {
      style: {
        display: "flex",
        width: "100%",
        height: 10,
        backgroundImage: GRADIENT,
      },
    });

    const brandRow = h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 18 } },
      logoMark(),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "JetBrains Mono",
            fontWeight: 500,
            fontSize: 26,
            letterSpacing: 0.5,
            color: FG,
          },
        },
        "solana glossary",
      ),
    );

    const eyebrowEl = eyebrow
      ? h(
          "div",
          {
            style: {
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              padding: "8px 16px",
              marginBottom: 22,
              borderRadius: 999,
              border: `1px solid rgba(33,202,151,0.28)`,
              backgroundColor: "rgba(33,202,151,0.10)",
              color: GREEN,
              fontFamily: "JetBrains Mono",
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: 1,
              textTransform: "uppercase",
            },
          },
          eyebrow,
        )
      : null;

    const titleEl = h(
      "div",
      {
        style: {
          display: "flex",
          fontWeight: 700,
          fontSize: titleSize(title),
          lineHeight: 1.08,
          color: FG,
          letterSpacing: -0.5,
          maxWidth: 1000,
        },
      },
      title,
    );

    const subtitleEl = subtitle
      ? h(
          "div",
          {
            style: {
              display: "flex",
              marginTop: 24,
              fontSize: 28,
              lineHeight: 1.4,
              color: MUTED,
              maxWidth: 940,
            },
          },
          subtitle,
        )
      : null;

    const centerBlock = h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        },
      },
      eyebrowEl,
      titleEl,
      subtitleEl,
    );

    const footer = h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 26,
          borderTop: `1px solid ${BORDER}`,
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 12 } },
        h("div", {
          style: {
            display: "flex",
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundImage: GRADIENT,
          },
        }),
        h(
          "div",
          {
            style: {
              display: "flex",
              fontFamily: "JetBrains Mono",
              fontWeight: 500,
              fontSize: 22,
              color: FG,
            },
          },
          footerLabel,
        ),
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "JetBrains Mono",
            fontWeight: 500,
            fontSize: 20,
            color: MUTED,
          },
        },
        "Solana Glossary · 14 categories",
      ),
    );

    const body = h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "62px 76px",
        },
      },
      brandRow,
      centerBlock,
      footer,
    );

    const root = h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: BG,
          backgroundImage: `radial-gradient(1000px 480px at 88% -8%, rgba(131,84,212,0.18), transparent 60%), radial-gradient(900px 460px at -6% 108%, rgba(33,202,151,0.16), transparent 58%)`,
          fontFamily: "Inter",
        },
      },
      accentBar,
      body,
    );

    return new ImageResponse(root, {
      width: WIDTH,
      height: HEIGHT,
      fonts: fonts.length
        ? fonts.map((f) => ({
            name: f.name,
            data: f.data,
            weight: f.weight,
            style: f.style,
          }))
        : undefined,
      headers: {
        "Cache-Control":
          "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[og] render error:", err);
    return new Response("Failed to generate image", { status: 500 });
  }
}

// Web-standard invocation on Vercel: a bare default-exported function would be
// invoked Node-style (req, res); the { fetch } form selects the Request/Response path.
export default { fetch: handler };
