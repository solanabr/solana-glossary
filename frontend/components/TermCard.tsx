import Link from "next/link";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/glossary-config";
import type { GlossaryTerm } from "@/lib/glossary-config";
import type { Locale } from "@/lib/i18n";

interface Props {
  term: GlossaryTerm;
  localizedName: string;
  localizedDef: string;
  locale: Locale;
  query?: string;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((p, i) =>
    regex.test(p) ? (
      <mark key={i} className="bg-accent/20 text-accent rounded-sm px-0.5">
        {p}
      </mark>
    ) : (
      p
    )
  );
}

export function TermCard({ term, localizedName, localizedDef, locale, query = "" }: Props) {
  const preview = localizedDef.length > 160 ? localizedDef.slice(0, 160) + "…" : localizedDef;
  const catLabel = CATEGORY_LABELS[term.category][locale];
  const catEmoji = CATEGORY_EMOJI[term.category];

  return (
    <Link
      href={`/term/${term.id}?locale=${locale}`}
      className="group block p-4 rounded-xl bg-card border border-base hover:border-accent/50 hover:bg-accent/5 transition-all animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-base group-hover:text-accent transition-colors text-sm leading-snug">
          {highlight(localizedName, query)}
        </h3>
        <span className="shrink-0 text-xs text-muted bg-base px-2 py-0.5 rounded-full border border-base flex items-center gap-1">
          {catEmoji} {catLabel}
        </span>
      </div>

      <p className="text-muted text-xs leading-relaxed">
        {highlight(preview, query)}
      </p>

      {term.aliases && term.aliases.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {term.aliases.slice(0, 3).map((a) => (
            <span key={a} className="text-xs text-accent/80 bg-accent/10 px-1.5 py-0.5 rounded font-mono">
              {a}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
