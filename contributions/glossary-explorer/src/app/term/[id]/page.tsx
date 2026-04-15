import { notFound } from "next/navigation";
import { allTerms, getTerm } from "@/lib/glossary";
import TermDetail from "@/components/TermDetail";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return allTerms.map((term) => ({ id: term.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const term = getTerm(id);

  if (!term) {
    return { title: "Term Not Found" };
  }

  return {
    title: `${term.term} — solexicon`,
    description: term.definition.slice(0, 160),
    openGraph: {
      title: `${term.term} — solexicon`,
      description: term.definition.slice(0, 160),
      images: [`/api/og/${term.id}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${term.term} — solexicon`,
      description: term.definition.slice(0, 160),
      images: [`/api/og/${term.id}`],
    },
  };
}

export default async function TermPage({ params }: Props) {
  const { id } = await params;
  const term = getTerm(id);

  if (!term) {
    notFound();
  }

  const relatedTerms = (term.related ?? [])
    .map((relatedId) => getTerm(relatedId))
    .filter(Boolean) as NonNullable<ReturnType<typeof getTerm>>[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <TermDetail term={term} relatedTerms={relatedTerms} />
    </div>
  );
}
