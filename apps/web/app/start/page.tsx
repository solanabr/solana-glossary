import Link from "next/link";
import { getTermById } from "@/lib/glossary";
import { LEARNING_PATH_IDS } from "@/lib/learningPath";

export default function StartPage() {
  const terms = LEARNING_PATH_IDS.map((id) => getTermById(id, "en")!).filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <p className="text-[10px] text-accent font-bold uppercase tracking-widest mb-3">
        Comece aqui
      </p>
      <h1 className="font-heading font-black text-3xl text-text tracking-tight mb-2">
        Os 10 termos essenciais
      </h1>
      <p className="text-[13px] text-text-muted mb-8">
        Leia estes termos nesta ordem antes de escrever seu primeiro programa Solana.
        Cada um desbloqueia o próximo.
      </p>

      <ol className="flex flex-col gap-0">
        {terms.map((term, i) => (
          <li key={term.id}>
            <Link href={`/term/${term.id}`}>
              <div className="flex items-start gap-4 py-4 border-b border-border hover:bg-bg-card px-2 -mx-2 transition-colors group">
                <span className="font-heading font-black text-2xl text-accent/30 w-8 shrink-0 leading-none mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-heading font-bold text-[15px] text-text group-hover:text-accent transition-colors">
                    {term.term}
                  </p>
                  <p className="text-[12px] text-text-dim mt-0.5 line-clamp-2 leading-relaxed">
                    {term.definition}
                  </p>
                </div>
                <span className="text-text-dim text-sm ml-auto mt-1">→</span>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-[12px] text-text-dim mb-3">Pronto para o próximo nível?</p>
        <Link
          href="/category/core-protocol"
          className="inline-flex items-center gap-2 bg-accent text-bg text-[12px] font-bold px-4 py-2 rounded font-heading hover:bg-accent/90 transition-colors"
        >
          Explorar Core Protocol →
        </Link>
      </div>
    </div>
  );
}
