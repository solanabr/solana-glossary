import type { MetadataRoute } from "next";

import { getAllTermIdsSync } from "@/lib/glossary-fs";
import { showNavCli, showNavMcp } from "@/lib/nav-platform-flags";
import { getSiteUrl } from "@/lib/site-url";
import { URL_LANGS } from "@/lib/url-lang";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const ids = getAllTermIdsSync();
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/flashcards`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${base}/match`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: `${base}/contributing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.78,
    },
  ];

  if (showNavMcp) {
    routes.push({
      url: `${base}/mcp`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  if (showNavCli) {
    routes.push({
      url: `${base}/cli`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const lang of URL_LANGS) {
    routes.push({
      url: `${base}/${lang}/learn`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    });
    routes.push({
      url: `${base}/${lang}/graph`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.88,
    });
  }

  for (const lang of URL_LANGS) {
    for (const id of ids) {
      routes.push({
        url: `${base}/${lang}/term/${encodeURIComponent(id)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.75,
      });
    }
  }

  return routes;
}
