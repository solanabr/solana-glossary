import { notFound } from "next/navigation";
import { getAllTerms, getTermById, getTermsByCategory } from "@/lib/glossary";
import { getDifficulty } from "@/lib/difficulty";
import DifficultyBadge from "@/components/DifficultyBadge";
import WhySection from "@/components/term/WhySection";
import CodeExample from "@/components/term/CodeExample";
import KnowledgeGraph from "@/components/term/KnowledgeGraph";
import RelatedTerms from "@/components/term/RelatedTerms";
import MiniCard from "@/components/MiniCard";
import Link from "next/link";

export async function generateStaticParams() {
  return getAllTerms("en").map((t) => ({ id: t.id }));
}

export default async function TermPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const term = getTermById(id, "en");
  if (!term) notFound();

  const difficulty = getDifficulty(term.id, term.category);
  const others = getTermsByCategory(term.category, "en")
    .filter((t) => t.id !== term.id)
    .slice(0, 4);

  return (
    <article className="max-w-2xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-[11px] text-text-dim mb-6">
        <Link href="/" className="hover:text-text">
          Glossário
        </Link>
        <span className="mx-2">›</span>
        <Link
          href={`/category/${term.category}`}
          className="hover:text-text capitalize"
        >
          {term.category.replace(/-/g, " ")}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-text">{term.term}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <span className="text-[10px] text-green font-bold uppercase tracking-widest mt-1">
          {term.category.replace(/-/g, " ")}
        </span>
        <DifficultyBadge difficulty={difficulty} />
      </div>
      <h1 className="font-heading font-black text-4xl text-text tracking-tight mb-4">
        {term.term}
      </h1>

      {/* Aliases */}
      {term.aliases && term.aliases.length > 0 && (
        <p className="text-[11px] text-text-dim mb-4">
          Também conhecido como:{" "}
          {term.aliases.map((a, i) => (
            <span key={a}>
              {i > 0 ? ", " : ""}
              <span className="italic">{a}</span>
            </span>
          ))}
        </p>
      )}

      {/* Definition */}
      <p className="text-[15px] text-text-muted leading-relaxed">{term.definition}</p>

      {/* Why */}
      <WhySection termId={term.id} category={term.category} />

      {/* Code Example */}
      <CodeExample termId={term.id} />

      {/* Knowledge Graph */}
      <KnowledgeGraph term={term} locale="en" />

      {/* Related Terms */}
      {term.related && <RelatedTerms relatedIds={term.related} locale="en" />}

      {/* More from category */}
      {others.length > 0 && (
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">
            Mais em {term.category.replace(/-/g, " ")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {others.map((t) => (
              <MiniCard key={t.id} term={t} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
