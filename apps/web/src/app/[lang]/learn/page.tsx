import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { GlossaryTerm } from "@/lib/glossary";
import { UI_LABELS } from "@/lib/glossary";
import { getGlossaryTermSync } from "@/lib/glossary-fs";
import { LEARN_PATH_TERM_IDS } from "@/lib/learn-path";
import { getSiteUrl } from "@/lib/site-url";
import { isUrlLang, localeFromUrlLang, URL_LANGS } from "@/lib/url-lang";

import LearnPathRouteClient from "./LearnPathRouteClient";

export const revalidate = 3600;

type Props = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  return URL_LANGS.map((lang) => ({ lang }));
}

function truncateOneLine(text: string, max: number): string {
  const s = text.replace(/\s+/g, " ").trim();
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isUrlLang(lang)) {
    return { title: "Not found", robots: { index: false } };
  }
  const locale = localeFromUrlLang(lang);
  const t = UI_LABELS[locale];
  const base = getSiteUrl();
  const path = `/${lang}/learn`;
  const canonical = `${base}${path}`;

  return {
    title: `${t.learn_title} — ${t.brand}`,
    description: truncateOneLine(t.learn_intro, 160),
    alternates: {
      canonical,
      languages: {
        en: `${base}/en/learn`,
        "pt-BR": `${base}/pt-BR/learn`,
        es: `${base}/es/learn`,
      },
    },
    openGraph: {
      title: t.learn_title,
      description: truncateOneLine(t.learn_intro, 160),
      url: canonical,
      type: "website",
      siteName: t.brand,
      locale:
        locale === "en" ? "en_US" : locale === "pt-BR" ? "pt_BR" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: t.learn_title,
      description: truncateOneLine(t.learn_intro, 160),
    },
  };
}

export default async function LearnPage({ params }: Props) {
  const { lang } = await params;
  if (!isUrlLang(lang)) notFound();
  const locale = localeFromUrlLang(lang);

  const pathTerms = LEARN_PATH_TERM_IDS.map((id) =>
    getGlossaryTermSync(id, locale),
  ).filter((x): x is GlossaryTerm => x != null);

  return <LearnPathRouteClient locale={locale} pathTerms={pathTerms} />;
}
