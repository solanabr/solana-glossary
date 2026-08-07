// GET /api/meta — crawler-visible <head> injector for the Vite SPA.
//
// Vercel rewrites the shareable routes (/, /copilot, /learn, /t/:id, /c/:cat)
// to this function so social crawlers — which never run JS — receive real
// per-page <title>/OG/Twitter tags and an absolute, per-page /api/og image.
// It loads the built index.html and swaps the block between the OG markers.
//
// Design guarantees:
//   • Absolute URLs are host-derived (no hardcoded domain): origin = https://
//     + the request Host header, so it is correct on any preview/prod domain.
//   • The front door never goes down: on ANY error the untouched index.html is
//     returned, so the SPA still boots.
//   • It MAY import @stbr/solana-glossary (no OG-function size limit here).

import {
  getCategories,
  getTerm,
  getTermsByCategory,
  type Category,
  type GlossaryTerm,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";

export const config = { runtime: "nodejs" };

type Locale = "en" | "pt" | "es";
const SITE_NAME = "Solana Glossary — Dev Copilot";
const OG_VERSION = "1"; // bump to invalidate every cached OG image at once
const IMG_W = "1200";
const IMG_H = "630";

// ---------------------------------------------------------------------------
// Route model
// ---------------------------------------------------------------------------

type Route =
  | { kind: "default" }
  | { kind: "term"; id?: string }
  | { kind: "category"; category?: string }
  | { kind: "page"; page: "copilot" | "learn"; id?: string };

/**
 * Resolve the incoming request to a route. Explicit hints set by the vercel
 * rewrite destination (`?path=…&id=…&category=…`) win; otherwise the request
 * path is parsed directly (covers local dev and direct `/api/meta` hits).
 */
export function parseRoute(pathname: string, sp: URLSearchParams): Route {
  const path = sp.get("path");
  const idHint = sp.get("id") || undefined;
  const catHint = sp.get("category") || undefined;
  const termQuery = sp.get("term") || undefined;

  if (path === "term" || idHint) return { kind: "term", id: idHint };
  if (path === "category" || catHint)
    return { kind: "category", category: catHint };
  if (path === "copilot")
    return { kind: "page", page: "copilot", id: termQuery };
  if (path === "learn") return { kind: "page", page: "learn", id: termQuery };
  if (path === "home") return { kind: "default" };

  const seg = stripLocale(pathname).split("/").filter(Boolean);
  if (seg[0] === "t" && seg[1])
    return { kind: "term", id: decodeURIComponent(seg[1]) };
  if (seg[0] === "c" && seg[1])
    return { kind: "category", category: decodeURIComponent(seg[1]) };
  if (seg[0] === "copilot")
    return { kind: "page", page: "copilot", id: termQuery };
  if (seg[0] === "learn") return { kind: "page", page: "learn", id: termQuery };
  return { kind: "default" };
}

// ---------------------------------------------------------------------------
// Locale
// ---------------------------------------------------------------------------

function stripLocale(pathname: string): string {
  const m = pathname.match(/^\/(pt|es)(\/.*|$)/);
  return m ? m[2] || "/" : pathname;
}

export function detectLocale(
  pathname: string,
  sp: URLSearchParams,
  acceptLanguage: string | null,
): Locale {
  if (/^\/pt(\/|$)/.test(pathname)) return "pt";
  if (/^\/es(\/|$)/.test(pathname)) return "es";

  const q = sp.get("lang");
  if (q === "pt" || q === "es" || q === "en") return q;

  const al = (acceptLanguage || "").toLowerCase().trim();
  if (al.startsWith("pt")) return "pt";
  if (al.startsWith("es")) return "es";
  return "en";
}

export function ogLocale(locale: Locale): string {
  return locale === "pt" ? "pt_BR" : locale === "es" ? "es_ES" : "en_US";
}

// ---------------------------------------------------------------------------
// Category labels (mirror apps/web/src/lib/i18n.tsx `cat.*`)
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    "core-protocol": "Core Protocol",
    "programming-model": "Programming Model",
    "token-ecosystem": "Token Ecosystem",
    defi: "DeFi",
    "zk-compression": "ZK Compression",
    infrastructure: "Infrastructure",
    security: "Security",
    "dev-tools": "Dev Tools",
    network: "Network",
    "blockchain-general": "Blockchain General",
    web3: "Web3",
    "programming-fundamentals": "Programming",
    "ai-ml": "AI / ML",
    "solana-ecosystem": "Solana Ecosystem",
  },
  pt: {
    "core-protocol": "Protocolo Central",
    "programming-model": "Modelo de Programação",
    "token-ecosystem": "Ecossistema de Tokens",
    defi: "DeFi",
    "zk-compression": "Compressão ZK",
    infrastructure: "Infraestrutura",
    security: "Segurança",
    "dev-tools": "Ferramentas Dev",
    network: "Rede",
    "blockchain-general": "Blockchain Geral",
    web3: "Web3",
    "programming-fundamentals": "Programação",
    "ai-ml": "IA / ML",
    "solana-ecosystem": "Ecossistema Solana",
  },
  es: {
    "core-protocol": "Protocolo Central",
    "programming-model": "Modelo de Programación",
    "token-ecosystem": "Ecosistema de Tokens",
    defi: "DeFi",
    "zk-compression": "Compresión ZK",
    infrastructure: "Infraestructura",
    security: "Seguridad",
    "dev-tools": "Herramientas Dev",
    network: "Red",
    "blockchain-general": "Blockchain General",
    web3: "Web3",
    "programming-fundamentals": "Programación",
    "ai-ml": "IA / ML",
    "solana-ecosystem": "Ecosistema Solana",
  },
};

export function categoryLabel(category: string, locale: Locale): string {
  return (
    CATEGORY_LABELS[locale][category] ??
    CATEGORY_LABELS.en[category] ??
    category
  );
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const HOME_DESC: Record<Locale, string> = {
  en: "AI-powered Solana developer assistant built on the official Solana Glossary — 1059 terms, instant search, and code explanations.",
  pt: "Assistente de desenvolvimento Solana com IA, construído sobre o Glossário Solana oficial — 1059 termos, busca instantânea e explicações de código.",
  es: "Asistente de desarrollo Solana con IA, construido sobre el Glosario Solana oficial — 1059 términos, búsqueda instantánea y explicaciones de código.",
};

const COPILOT_TITLE: Record<Locale, string> = {
  en: "Solana Dev Copilot",
  pt: "Solana Dev Copilot",
  es: "Solana Dev Copilot",
};
const COPILOT_DESC: Record<Locale, string> = {
  en: "Ask anything about Solana development — glossary-grounded, contextual AI answers with real code.",
  pt: "Pergunte qualquer coisa sobre desenvolvimento Solana — respostas de IA contextuais e fundamentadas no glossário, com código real.",
  es: "Pregunta lo que sea sobre desarrollo Solana — respuestas de IA contextuales y fundamentadas en el glosario, con código real.",
};

const LEARN_TITLE: Record<Locale, string> = {
  en: "Learning Paths",
  pt: "Trilhas de Aprendizado",
  es: "Rutas de Aprendizaje",
};
const LEARN_DESC: Record<Locale, string> = {
  en: "Guided, glossary-grounded learning paths that connect Solana concepts step by step, with AI explanations and code.",
  pt: "Trilhas de aprendizado guiadas e fundamentadas no glossário que conectam conceitos da Solana passo a passo, com explicações de IA e código.",
  es: "Rutas de aprendizaje guiadas y fundamentadas en el glosario que conectan conceptos de Solana paso a paso, con explicaciones de IA y código.",
};

function categoryDesc(label: string, count: number, locale: Locale): string {
  if (locale === "pt")
    return `Explore ${count} termos de ${label} no Glossário Solana — definições, conceitos relacionados e exemplos de código.`;
  if (locale === "es")
    return `Explora ${count} términos de ${label} en el Glosario Solana — definiciones, conceptos relacionados y ejemplos de código.`;
  return `Explore ${count} ${label} terms in the Solana Glossary — definitions, related concepts, and code examples.`;
}

// ---------------------------------------------------------------------------
// Text + URL helpers
// ---------------------------------------------------------------------------

export function clampText(value: string, max: number): string {
  const s = value.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface ImageParams {
  title: string;
  subtitle: string;
  kind: "default" | "term" | "category" | "page";
  category?: string;
  lang: Locale;
}

export function buildImageUrl(origin: string, p: ImageParams): string {
  const q = new URLSearchParams();
  q.set("title", p.title);
  if (p.subtitle) q.set("subtitle", p.subtitle);
  q.set("kind", p.kind);
  if (p.category) q.set("category", p.category);
  q.set("lang", p.lang);
  q.set("v", OG_VERSION);
  return `${origin}/api/og?${q.toString()}`;
}

// ---------------------------------------------------------------------------
// Field composition + tag rendering
// ---------------------------------------------------------------------------

interface MetaFields {
  title: string; // <title> and og:title
  description: string;
  ogType: "website" | "article";
  url: string;
  image: string;
  imageAlt: string;
  locale: Locale;
}

function localized(term: GlossaryTerm, locale: Locale): GlossaryTerm {
  if (locale === "en") return term;
  return getLocalizedTerms(locale).find((t) => t.id === term.id) ?? term;
}

function composeFields(
  route: Route,
  locale: Locale,
  origin: string,
): MetaFields {
  if (route.kind === "term" && route.id) {
    const base = getTerm(route.id);
    if (base) {
      const term = localized(base, locale);
      const label = categoryLabel(term.category, locale);
      const title = term.term;
      const description =
        clampText(term.definition, 200) || `${title} — ${SITE_NAME}`;
      return {
        title,
        description,
        ogType: "article",
        url: `${origin}/t/${base.id}`,
        image: buildImageUrl(origin, {
          title: clampText(title, 100),
          subtitle: clampText(term.definition, 180),
          kind: "term",
          category: label,
          lang: locale,
        }),
        imageAlt: `${title} — Solana Glossary`,
        locale,
      };
    }
  }

  if (route.kind === "category" && route.category) {
    const cat = route.category as Category;
    if (getCategories().includes(cat)) {
      const label = categoryLabel(cat, locale);
      const count = getTermsByCategory(cat).length;
      const description = categoryDesc(label, count, locale);
      return {
        title: `${label} — Solana Glossary`,
        description,
        ogType: "website",
        url: `${origin}/c/${cat}`,
        image: buildImageUrl(origin, {
          title: clampText(label, 100),
          subtitle: clampText(description, 180),
          kind: "category",
          category: label,
          lang: locale,
        }),
        imageAlt: `${label} — Solana Glossary`,
        locale,
      };
    }
  }

  if (route.kind === "page") {
    // A learning path seeded by ?term= gets a term-flavoured card.
    if (route.page === "learn" && route.id) {
      const base = getTerm(route.id);
      if (base) {
        const term = localized(base, locale);
        const title = `${LEARN_TITLE[locale]}: ${term.term}`;
        return {
          title,
          description: clampText(term.definition, 200) || LEARN_DESC[locale],
          ogType: "article",
          url: `${origin}/learn?term=${base.id}`,
          image: buildImageUrl(origin, {
            title: clampText(title, 100),
            subtitle: clampText(term.definition, 180),
            kind: "page",
            lang: locale,
          }),
          imageAlt: `${title} — Solana Glossary`,
          locale,
        };
      }
    }

    const title =
      route.page === "copilot" ? COPILOT_TITLE[locale] : LEARN_TITLE[locale];
    const description =
      route.page === "copilot" ? COPILOT_DESC[locale] : LEARN_DESC[locale];
    return {
      title: `${title} — Solana Glossary`,
      description,
      ogType: "website",
      url: `${origin}/${route.page}`,
      image: buildImageUrl(origin, {
        title: clampText(title, 100),
        subtitle: clampText(description, 180),
        kind: "page",
        lang: locale,
      }),
      imageAlt: `${title} — Solana Glossary`,
      locale,
    };
  }

  // Default / home
  const description = HOME_DESC[locale];
  return {
    title: SITE_NAME,
    description,
    ogType: "website",
    url: `${origin}/`,
    image: buildImageUrl(origin, {
      title: "Solana Glossary — Dev Copilot",
      subtitle: clampText(description, 180),
      kind: "default",
      lang: locale,
    }),
    imageAlt: "Solana Glossary — Dev Copilot",
    locale,
  };
}

export function renderMetaTags(f: MetaFields): string {
  const e = escapeHtml;
  return [
    `<title>${e(f.title)}</title>`,
    `<meta name="description" content="${e(f.description)}" />`,
    `<meta property="og:type" content="${f.ogType}" />`,
    `<meta property="og:site_name" content="${e(SITE_NAME)}" />`,
    `<meta property="og:title" content="${e(f.title)}" />`,
    `<meta property="og:description" content="${e(f.description)}" />`,
    `<meta property="og:url" content="${e(f.url)}" />`,
    `<meta property="og:image" content="${e(f.image)}" />`,
    `<meta property="og:image:width" content="${IMG_W}" />`,
    `<meta property="og:image:height" content="${IMG_H}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:alt" content="${e(f.imageAlt)}" />`,
    `<meta property="og:locale" content="${ogLocale(f.locale)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(f.title)}" />`,
    `<meta name="twitter:description" content="${e(f.description)}" />`,
    `<meta name="twitter:image" content="${e(f.image)}" />`,
  ].join("\n    ");
}

export function injectMeta(html: string, tags: string, locale: Locale): string {
  const withTags = html.replace(
    /<!--OG:START-->[\s\S]*?<!--OG:END-->/,
    () => `<!--OG:START-->\n    ${tags}\n    <!--OG:END-->`,
  );
  return withTags.replace(
    /<html\s+lang="[^"]*"/i,
    () => `<html lang="${locale}"`,
  );
}

// ---------------------------------------------------------------------------
// index.html loader (memoized ~5 min) + handler
// ---------------------------------------------------------------------------

const INDEX_TTL_MS = 5 * 60 * 1000;
let indexCache: { html: string; at: number } | null = null;

async function loadIndexHtml(origin: string): Promise<string> {
  const now = Date.now();
  if (indexCache && now - indexCache.at < INDEX_TTL_MS) return indexCache.html;
  const res = await fetch(`${origin}/index.html`, {
    headers: { "user-agent": "solana-glossary-meta" },
  });
  if (!res.ok) throw new Error(`index.html fetch failed: ${res.status}`);
  const html = await res.text();
  indexCache = { html, at: now };
  return html;
}

function htmlHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  };
}

const FALLBACK_HTML = `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${SITE_NAME}</title><meta name="description" content="${HOME_DESC.en}" /></head><body><div id="root"></div></body></html>`;

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const host = req.headers.get("host");
  const origin = host ? `https://${host}` : url.origin;

  let html: string | null = null;
  try {
    html = await loadIndexHtml(origin);
    const locale = detectLocale(
      url.pathname,
      url.searchParams,
      req.headers.get("accept-language"),
    );
    const route = parseRoute(url.pathname, url.searchParams);
    const fields = composeFields(route, locale, origin);
    const out = injectMeta(html, renderMetaTags(fields), locale);
    return new Response(out, { headers: htmlHeaders() });
  } catch (err) {
    console.error("[meta] error, serving untouched index.html:", err);
    if (html) return new Response(html, { headers: htmlHeaders() });
    try {
      const raw = await fetch(`${origin}/index.html`).then((r) => r.text());
      return new Response(raw, { headers: htmlHeaders() });
    } catch {
      return new Response(FALLBACK_HTML, { headers: htmlHeaders() });
    }
  }
}
