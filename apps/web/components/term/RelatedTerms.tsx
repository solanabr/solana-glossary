import Link from "next/link";
import { getTermById } from "@/lib/glossary";
import type { Locale } from "@/lib/glossary";

export default function RelatedTerms({
  relatedIds,
  locale,
}: {
  relatedIds: string[];
  locale: Locale;
}) {
  if (!relatedIds?.length) return null;

  return (
    <div className="mt-6">
      <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">
        Termos relacionados
      </p>
      <div className="flex flex-wrap gap-2">
        {relatedIds.map((id) => {
          const term = getTermById(id, locale);
          return (
            <Link
              key={id}
              href={`/term/${id}`}
              className="text-[11px] text-accent border border-accent/25 px-2.5 py-1 rounded-full hover:bg-accent/10 transition-colors"
            >
              {term?.term ?? id}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
