import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { UI_LABELS } from "@/lib/glossary";
import { getSiteUrl } from "@/lib/site-url";
import { isUrlLang, localeFromUrlLang, URL_LANGS } from "@/lib/url-lang";

import GraphPageClient from "./GraphPageClient";

export const revalidate = 3600;

type Props = {
  params: Promise<{ lang: string }>;
};

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
  const path = `/${lang}/graph`;
  const canonical = `${base}${path}`;

  return {
    title: `${t.graph_title} — ${t.brand}`,
    description: truncateOneLine(t.graph_meta_description, 160),
    alternates: {
      canonical,
      languages: {
        en: `${base}/en/graph`,
        "pt-BR": `${base}/pt-BR/graph`,
        es: `${base}/es/graph`,
      },
    },
    openGraph: {
      title: t.graph_title,
      description: truncateOneLine(t.graph_meta_description, 160),
      url: canonical,
      type: "website",
      siteName: t.brand,
      locale:
        locale === "en" ? "en_US" : locale === "pt-BR" ? "pt_BR" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: t.graph_title,
      description: truncateOneLine(t.graph_meta_description, 160),
    },
  };
}

function GraphFallback({
  locale,
}: {
  locale: ReturnType<typeof localeFromUrlLang>;
}) {
  const t = UI_LABELS[locale];
  return (
    <div className="flex h-[100dvh] items-center justify-center overflow-hidden app-surface px-4">
      <p className="text-sol-subtle text-sm">{t.loading}</p>
    </div>
  );
}

export default async function GraphPage({ params }: Props) {
  const { lang } = await params;
  if (!isUrlLang(lang)) notFound();
  const locale = localeFromUrlLang(lang);

  return (
    <Suspense fallback={<GraphFallback locale={locale} />}>
      <GraphPageClient locale={locale} />
    </Suspense>
  );
}
