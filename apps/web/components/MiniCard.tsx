import Link from "next/link";
import type { GlossaryTerm } from "@/lib/glossary";

export default function MiniCard({ term }: { term: GlossaryTerm }) {
  return (
    <Link href={`/term/${term.id}`}>
      <div className="bg-bg-card border border-border rounded p-2.5 hover:border-accent/30 transition-colors cursor-pointer group h-full">
        <p className="text-[9px] text-green font-bold uppercase tracking-wider mb-1">
          {term.category.replace(/-/g, " ")}
        </p>
        <p className="text-[11px] font-heading font-bold text-text group-hover:text-accent transition-colors leading-tight mb-1">
          {term.term}
        </p>
        <p className="text-[9px] text-text-dim leading-relaxed line-clamp-2">
          {term.definition}
        </p>
      </div>
    </Link>
  );
}
