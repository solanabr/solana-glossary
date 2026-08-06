import { GlossaryTerm } from "@stbr/solana-glossary";
import { motion } from "framer-motion";
import { X, ArrowRight, BookOpen, Tag } from "lucide-react";
import { UsageExample } from "@/components/UsageExample";
import { useI18n } from "@/lib/i18n";
import { useGlossary } from "@/hooks/useGlossary";

interface TermDetailPanelProps {
  term: GlossaryTerm;
  onClose: () => void;
  onNavigate: (term: GlossaryTerm) => void;
}

const categoryColors: Record<string, string> = {
  "core-protocol": "text-primary bg-primary/10",
  "programming-model": "text-blue-400 bg-blue-500/10",
  "token-ecosystem": "text-yellow-400 bg-yellow-500/10",
  defi: "text-emerald-400 bg-emerald-500/10",
  "zk-compression": "text-violet-400 bg-violet-500/10",
  infrastructure: "text-orange-400 bg-orange-500/10",
  security: "text-red-400 bg-red-500/10",
  "dev-tools": "text-cyan-400 bg-cyan-500/10",
  network: "text-teal-400 bg-teal-500/10",
  "blockchain-general": "text-slate-400 bg-slate-500/10",
  web3: "text-pink-400 bg-pink-500/10",
  "programming-fundamentals": "text-indigo-400 bg-indigo-500/10",
  "ai-ml": "text-purple-400 bg-purple-500/10",
  "solana-ecosystem": "text-accent bg-accent/10",
};

export function TermDetailPanel({
  term: rawTerm,
  onClose,
  onNavigate,
}: TermDetailPanelProps) {
  const { t } = useI18n();
  const glossary = useGlossary();
  const term = glossary.localizeTerm(rawTerm);
  const related = glossary.getRelatedTerms(term.id);
  const catColor =
    categoryColors[term.category] || "text-muted-foreground bg-muted";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-card border border-border rounded-lg p-5 h-full overflow-y-auto scrollbar-thin"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catColor}`}
          >
            {t(`cat.${term.category}` as any) || term.category}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <h2 className="text-base font-semibold text-foreground mb-1">
        {term.term}
      </h2>

      {term.aliases && term.aliases.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {term.aliases.map((a) => (
            <span
              key={a}
              className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded flex items-center gap-0.5"
            >
              <Tag className="h-2.5 w-2.5" />
              {a}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-foreground/90 leading-relaxed mb-4">
        {term.definition}
      </p>

      <UsageExample term={term} onTermClick={onNavigate} />

      {related.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t("term.related")}
          </h3>
          <div className="space-y-1">
            {related.map((r) => (
              <button
                key={r.id}
                onClick={() => onNavigate(r)}
                className="w-full flex items-center gap-2 p-2 rounded-md bg-secondary/50 hover:bg-surface-hover text-left transition-colors group"
              >
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {r.term}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {r.definition.slice(0, 80)}…
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
