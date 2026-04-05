import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { URL_LANGS } from "@/lib/url-lang";

/** Modes that live at site root; locale is chosen inside the page (not in the path). */
const TOP_LEVEL_MODES = ["flashcards", "match", "contributing"] as const;

/**
 * - `/term/:id` without locale → `/en/term/:id` (terms only exist under `[lang]`).
 * - `/{locale}/flashcards|match|contributing` → strip the locale prefix (matches real routes).
 * Query strings are preserved on redirects.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/term/")) {
    const rest = pathname.slice("/term/".length);
    if (rest) {
      const url = request.nextUrl.clone();
      url.pathname = `/en/term/${rest}`;
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  for (const lang of URL_LANGS) {
    const prefix = `/${lang}`;
    if (!pathname.startsWith(prefix + "/") && pathname !== prefix) {
      continue;
    }
    for (const mode of TOP_LEVEL_MODES) {
      const segment = `${prefix}/${mode}`;
      if (pathname === segment || pathname.startsWith(`${segment}/`)) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.slice(prefix.length) || "/";
        return NextResponse.redirect(url, 308);
      }
    }
  }

  return NextResponse.next();
}

/** Static literals only — Next.js parses `matcher` at compile time. */
export const config = {
  matcher: [
    "/term/:path*",
    "/en/flashcards",
    "/en/flashcards/:path*",
    "/en/match",
    "/en/match/:path*",
    "/en/contributing",
    "/en/contributing/:path*",
    "/pt-BR/flashcards",
    "/pt-BR/flashcards/:path*",
    "/pt-BR/match",
    "/pt-BR/match/:path*",
    "/pt-BR/contributing",
    "/pt-BR/contributing/:path*",
    "/es/flashcards",
    "/es/flashcards/:path*",
    "/es/match",
    "/es/match/:path*",
    "/es/contributing",
    "/es/contributing/:path*",
  ],
};
