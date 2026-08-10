import { describe, it, expect } from "vitest";
import {
  buildImageUrl,
  categoryLabel,
  clampText,
  detectLocale,
  escapeHtml,
  injectMeta,
  ogLocale,
  OG_VERSION,
  parseRoute,
  renderMetaTags,
} from "../meta.js";

const sp = (q: string) => new URLSearchParams(q);

describe("clampText", () => {
  it("collapses whitespace and leaves short text intact", () => {
    expect(clampText("  hello   world ", 100)).toBe("hello world");
  });

  it("truncates with an ellipsis at the limit", () => {
    const out = clampText("a".repeat(50), 10);
    expect(out).toHaveLength(10);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    );
  });
});

describe("detectLocale", () => {
  it("prefers a /pt or /es path prefix", () => {
    expect(detectLocale("/pt/t/pda", sp(""), null)).toBe("pt");
    expect(detectLocale("/es", sp(""), "en-US")).toBe("es");
  });

  it("falls back to ?lang then Accept-Language then en", () => {
    expect(detectLocale("/t/pda", sp("lang=es"), "en-US")).toBe("es");
    expect(detectLocale("/t/pda", sp(""), "pt-BR,pt;q=0.9")).toBe("pt");
    expect(detectLocale("/t/pda", sp(""), null)).toBe("en");
  });
});

describe("ogLocale", () => {
  it("maps to Open Graph locale codes", () => {
    expect(ogLocale("en")).toBe("en_US");
    expect(ogLocale("pt")).toBe("pt_BR");
    expect(ogLocale("es")).toBe("es_ES");
  });
});

describe("categoryLabel", () => {
  it("localizes known categories and falls back to the slug", () => {
    expect(categoryLabel("core-protocol", "en")).toBe("Core Protocol");
    expect(categoryLabel("core-protocol", "pt")).toBe("Protocolo Central");
    expect(categoryLabel("unknown-cat", "en")).toBe("unknown-cat");
  });
});

describe("parseRoute", () => {
  it("honors explicit rewrite-destination hints first", () => {
    expect(parseRoute("/api/meta", sp("path=term&id=pda"))).toEqual({
      kind: "term",
      id: "pda",
    });
    expect(parseRoute("/api/meta", sp("path=category&category=defi"))).toEqual({
      kind: "category",
      category: "defi",
    });
    expect(parseRoute("/api/meta", sp("path=copilot"))).toEqual({
      kind: "page",
      page: "copilot",
      id: undefined,
    });
    expect(parseRoute("/api/meta", sp("path=home"))).toEqual({
      kind: "default",
    });
  });

  it("threads ?term= into a learn page card", () => {
    expect(
      parseRoute("/api/meta", sp("path=learn&term=proof-of-history")),
    ).toEqual({ kind: "page", page: "learn", id: "proof-of-history" });
  });

  it("parses the raw path for direct hits and strips a locale prefix", () => {
    expect(parseRoute("/t/amm", sp(""))).toEqual({ kind: "term", id: "amm" });
    expect(parseRoute("/c/security", sp(""))).toEqual({
      kind: "category",
      category: "security",
    });
    expect(parseRoute("/pt/t/pda", sp(""))).toEqual({
      kind: "term",
      id: "pda",
    });
    expect(parseRoute("/", sp(""))).toEqual({ kind: "default" });
  });
});

describe("buildImageUrl", () => {
  it("builds an absolute, param-driven /api/og URL with a cache version", () => {
    const url = buildImageUrl("https://example.com", {
      title: "Proof of History",
      subtitle: "A clock before consensus",
      kind: "term",
      category: "Core Protocol",
      lang: "en",
    });
    expect(url.startsWith("https://example.com/api/og?")).toBe(true);
    const q = new URL(url).searchParams;
    expect(q.get("title")).toBe("Proof of History");
    expect(q.get("kind")).toBe("term");
    expect(q.get("category")).toBe("Core Protocol");
    expect(q.get("lang")).toBe("en");
    expect(q.get("v")).toBe(OG_VERSION);
  });
});

describe("renderMetaTags + injectMeta", () => {
  const fields = {
    title: "Proof of History",
    description: "A verifiable clock <before> consensus",
    ogType: "article" as const,
    url: "https://example.com/t/proof-of-history",
    image: "https://example.com/api/og?kind=term&v=1",
    imageAlt: "Proof of History — Solana Glossary",
    locale: "pt" as const,
  };

  it("renders escaped, complete OG + Twitter tags", () => {
    const tags = renderMetaTags(fields);
    expect(tags).toContain("<title>Proof of History</title>");
    expect(tags).toContain('property="og:image"');
    expect(tags).toContain('name="twitter:card" content="summary_large_image"');
    expect(tags).toContain('property="og:locale" content="pt_BR"');
    // description escaped
    expect(tags).toContain("&lt;before&gt;");
  });

  it("replaces the marker block and rewrites <html lang>", () => {
    const html = `<!doctype html><html lang="en"><head><!--OG:START-->OLD<!--OG:END--></head></html>`;
    const out = injectMeta(html, renderMetaTags(fields), "pt");
    expect(out).toContain('<html lang="pt"');
    expect(out).not.toContain("OLD");
    expect(out).toContain("<!--OG:START-->");
    expect(out).toContain("<!--OG:END-->");
    expect(out).toContain("<title>Proof of History</title>");
  });
});
