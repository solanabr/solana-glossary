import { notFound } from "next/navigation";

import { CopilotHub } from "@/components/copilot-hub";
import { getFeaturedTerms, getLocalizedTerms, getTermById } from "@/lib/glossary";
import { isSupportedLocale, type Locale } from "@/lib/locales";

export default async function CopilotPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const resolvedSearchParams = await searchParams;
  const localizedTerms = getLocalizedTerms(currentLocale);
  const fallbackTerm = getFeaturedTerms(currentLocale)[0] ?? localizedTerms[0];
  const selectedTerm =
    (resolvedSearchParams.term ? getTermById(resolvedSearchParams.term, currentLocale) : undefined) ??
    fallbackTerm;

  if (!selectedTerm) {
    notFound();
  }

  return (
    <CopilotHub
      locale={currentLocale}
      selectedTerm={selectedTerm}
      terms={localizedTerms}
    />
  );
}
