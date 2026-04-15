/**
 * MCP Resources — Expose glossary categories and terms as navigable resources
 */

import {
  allTerms,
  getCategories,
  getTermsByCategory,
  getTerm,
  type Category,
} from "@stbr/solana-glossary";
import { getLocalizedTerms } from "@stbr/solana-glossary/i18n";
import type { GlossaryTerm } from "@stbr/solana-glossary";

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

/**
 * List all available resources
 */
export function listResources() {
  const categories = getCategories();
  const resources = [
    {
      uri: "solana-glossary://glossary/full",
      name: "Full Solana Glossary",
      description: `Complete glossary with all ${allTerms.length} Solana terms, categories, and cross-references`,
      mimeType: "application/json",
    },
    {
      uri: "solana-glossary://glossary/stats",
      name: "Glossary Statistics",
      description: "Statistics about the glossary: term counts, categories, relationship density",
      mimeType: "application/json",
    },
  ];

  for (const cat of categories) {
    const count = getTermsByCategory(cat).length;
    resources.push({
      uri: `solana-glossary://category/${cat}`,
      name: `Category: ${cat}`,
      description: `${count} terms in the ${cat} category`,
      mimeType: "application/json",
    });
  }

  return resources;
}

/**
 * List resource templates (dynamic resources with parameters)
 */
export function listResourceTemplates() {
  return [
    {
      uriTemplate: "solana-glossary://term/{termId}",
      name: "Solana Glossary Term",
      description: "Look up a specific term by its ID",
      mimeType: "application/json",
    },
    {
      uriTemplate: "solana-glossary://{locale}/category/{category}",
      name: "Localized Category",
      description: "Get all terms in a category in a specific language (pt, es, en)",
      mimeType: "application/json",
    },
    {
      uriTemplate: "solana-glossary://{locale}/term/{termId}",
      name: "Localized Term",
      description: "Look up a specific term in a specific language",
      mimeType: "application/json",
    },
  ];
}

/**
 * Read a resource by URI
 */
export function readResource(uri: string): ResourceContent | null {
  const url = new URL(uri);
  const path = url.hostname + url.pathname;

  // solana-glossary://glossary/full
  if (path === "glossary/full") {
    const compact = allTerms.map((t) => ({
      id: t.id,
      term: t.term,
      definition: t.definition,
      category: t.category,
      ...(t.aliases ? { aliases: t.aliases } : {}),
    }));
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(compact, null, 2),
    };
  }

  // solana-glossary://glossary/stats
  if (path === "glossary/stats") {
    const categories = getCategories();
    const stats = {
      totalTerms: allTerms.length,
      totalCategories: categories.length,
      termsWithDefinitions: allTerms.filter((t) => t.definition.length > 0).length,
      termsWithRelated: allTerms.filter((t) => (t.related?.length ?? 0) > 0).length,
      termsWithAliases: allTerms.filter((t) => (t.aliases?.length ?? 0) > 0).length,
      categoryCounts: Object.fromEntries(
        categories.map((c) => [c, getTermsByCategory(c).length])
      ),
      availableLocales: ["en", "pt", "es"],
    };
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(stats, null, 2),
    };
  }

  // solana-glossary://category/{name}
  const categoryMatch = path.match(/^category\/(.+)$/);
  if (categoryMatch) {
    const cat = categoryMatch[1] as Category;
    const terms = getTermsByCategory(cat);
    if (terms.length === 0) return null;
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(terms, null, 2),
    };
  }

  // solana-glossary://term/{id}
  const termMatch = path.match(/^term\/(.+)$/);
  if (termMatch) {
    const term = getTerm(termMatch[1]);
    if (!term) return null;
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(term, null, 2),
    };
  }

  // solana-glossary://{locale}/category/{name}
  const localeCatMatch = path.match(/^(pt|es|en)\/category\/(.+)$/);
  if (localeCatMatch) {
    const [, locale, cat] = localeCatMatch;
    const localizedTerms = getLocalizedTerms(locale);
    const filtered = localizedTerms.filter((t) => t.category === cat);
    if (filtered.length === 0) return null;
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(filtered, null, 2),
    };
  }

  // solana-glossary://{locale}/term/{id}
  const localeTermMatch = path.match(/^(pt|es|en)\/term\/(.+)$/);
  if (localeTermMatch) {
    const [, locale, termId] = localeTermMatch;
    const localizedTerms = getLocalizedTerms(locale);
    const term = localizedTerms.find((t) => t.id === termId);
    if (!term) return null;
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(term, null, 2),
    };
  }

  return null;
}
