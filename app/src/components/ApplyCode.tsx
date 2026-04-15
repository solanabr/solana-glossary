import { useState, useCallback } from "react";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { useGlossary } from "@/hooks/useGlossary";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import {
  Code2,
  ArrowRight,
  Copy,
  Check,
  Globe,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const APPLY_URL = `${import.meta.env.VITE_AI_API_URL}/apply-code`;

interface CodeResult {
  title: string;
  code: string;
  language: string;
  explanation: string;
  keyConcepts: string[];
}

interface ApplyCodeProps {
  term: GlossaryTerm;
  wrongTerms: string[];
  difficulty: string;
  mode: string;
  onNavigate: (term: GlossaryTerm) => void;
  onOpenGraph?: () => void;
  onExplainCode?: (code: string) => void;
}

export function ApplyCode({
  term,
  wrongTerms,
  difficulty,
  mode,
  onNavigate,
  onOpenGraph,
  onExplainCode,
}: ApplyCodeProps) {
  const { t, locale } = useI18n();
  const glossary = useGlossary();
  const related = glossary.getRelatedTerms(term.id);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CodeResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch(APPLY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: term.term,
          incorrectTerms: wrongTerms,
          relatedTerms: related.map((r) => r.term).slice(0, 6),
          difficulty,
          mode,
          locale,
        }),
      });
      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      console.error("Apply code error:", e);
    } finally {
      setLoading(false);
    }
  }, [term, wrongTerms, related, difficulty, mode, locale]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  // Initial state -- show generate button
  if (!loading && !result) {
    return (
      <div className="bg-gradient-to-br from-emerald-500/5 to-primary/5 border border-emerald-500/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-foreground">
            {t("apply.title" as Parameters<typeof t>[0])}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("apply.description" as Parameters<typeof t>[0])}
        </p>
        <button
          onClick={generate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-primary/20 border border-emerald-500/30 text-xs font-semibold text-foreground hover:from-emerald-500/30 hover:to-primary/30 hover:shadow-[0_0_16px_rgba(16,185,129,0.2)] transition-all group"
        >
          <Code2 className="h-4 w-4 text-emerald-400" />
          {t("apply.generate" as Parameters<typeof t>[0])}
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-500/5 to-primary/5 border border-emerald-500/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-foreground">
            {t("apply.generating" as Parameters<typeof t>[0])}
          </span>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // Result
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-500/5 to-primary/5 border border-emerald-500/20 rounded-lg p-4 space-y-3"
    >
      {/* Title */}
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-yellow-400" />
        <span className="text-xs font-bold text-foreground">
          {result.title}
        </span>
      </div>

      {/* Code block */}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-secondary/80 hover:bg-surface-hover transition-colors z-10"
          title="Copy"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
        <pre className="bg-[#0d1117] rounded-lg p-3 overflow-x-auto text-[11px] leading-relaxed font-mono text-emerald-300 border border-emerald-500/10">
          <code>{result.code}</code>
        </pre>
      </div>

      {/* Explanation */}
      <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {t("apply.explanation" as Parameters<typeof t>[0])}
        </p>
        <p className="text-[11px] text-foreground/80 leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* Key concepts */}
      {result.keyConcepts && result.keyConcepts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            {t("apply.key_concepts" as Parameters<typeof t>[0])}
          </p>
          <div className="flex flex-wrap gap-1">
            {result.keyConcepts.map((concept) => {
              const found = glossary.allTerms.find(
                (gt) => gt.term.toLowerCase() === concept.toLowerCase(),
              );
              return (
                <button
                  key={concept}
                  onClick={() => found && onNavigate(found)}
                  className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                    found
                      ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                      : "bg-secondary/50 text-muted-foreground cursor-default"
                  }`}
                >
                  {concept}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {onExplainCode && (
          <button
            onClick={() => onExplainCode(result.code)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border text-[11px] font-medium text-foreground hover:bg-surface-hover transition-all"
          >
            <MessageSquare className="h-3 w-3" />
            {t("apply.explain_code" as Parameters<typeof t>[0])}
          </button>
        )}
        {onOpenGraph && (
          <button
            onClick={onOpenGraph}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-medium text-foreground hover:bg-primary/20 transition-all"
          >
            <Globe className="h-3 w-3 text-primary" />
            {t("apply.view_graph" as Parameters<typeof t>[0])}
          </button>
        )}
      </div>

      {/* Regenerate */}
      <button
        onClick={generate}
        className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {t("apply.regenerate" as Parameters<typeof t>[0])}
      </button>
    </motion.div>
  );
}
