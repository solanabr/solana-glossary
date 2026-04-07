import { URL } from "node:url";

import { formatContextForPrompt, getMultiTermContext } from "../glossary/context-builder.js";
import { getTerm } from "../glossary/loader.js";
import type { Locale } from "../types/glossary.js";

export const resourceCatalog = [
  {
    uri: "glossary://catalog/term",
    name: "glossary_term_resource",
    description: "Read a single glossary term as structured JSON.",
    mimeType: "application/json",
    uriTemplate: "glossary://term/{termId}?locale={locale}",
  },
  {
    uri: "glossary://catalog/context",
    name: "glossary_context_bundle_resource",
    description: "Read a prompt-ready multi-term context bundle as structured JSON.",
    mimeType: "application/json",
    uriTemplate: "glossary://context/{termIds}?locale={locale}&maxRelated={n}",
  },
];

function normalizeLocale(value: string | null): Locale {
  return value === "pt" || value === "es" || value === "en" ? value : "en";
}

export function readResource(uri: string): { mimeType: string; text: string } {
  const parsed = new URL(uri);
  const locale = normalizeLocale(parsed.searchParams.get("locale"));

  if (parsed.protocol !== "glossary:") {
    throw new Error(`Unsupported resource uri: ${uri}`);
  }

  if (parsed.hostname === "term") {
    const termId = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    const term = getTerm(termId, locale);
    if (!term) {
      throw new Error(`Unknown glossary term for resource: ${termId}`);
    }

    return {
      mimeType: "application/json",
      text: JSON.stringify(
        {
          locale,
          term: {
            id: term.id,
            term: term.term,
            definition: term.definition,
            category: term.category,
            aliases: term.aliases ?? [],
            related: term.related ?? [],
          },
        },
        null,
        2,
      ),
    };
  }

  if (parsed.hostname === "context") {
    const ids = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const maxRelatedParam = parsed.searchParams.get("maxRelated");
    const maxRelated = maxRelatedParam ? Math.max(1, Math.min(12, Number.parseInt(maxRelatedParam, 10))) : 8;
    const context = getMultiTermContext(ids, locale, { maxRelated, maxNextSteps: 5 });

    return {
      mimeType: "application/json",
      text: JSON.stringify(
        {
          locale,
          anchorTerms: context.anchorTerms,
          relatedTerms: context.relatedTerms,
          nextSteps: context.nextSteps,
          aliases: context.aliases,
          tokenEstimate: context.totalTokenEstimate,
          promptContext: formatContextForPrompt(context),
        },
        null,
        2,
      ),
    };
  }

  throw new Error(`Unsupported resource uri: ${uri}`);
}
