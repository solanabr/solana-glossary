import {
  useState,
  useCallback,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from "react";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  BookOpen,
  Tag,
  Sparkles,
  Code2,
  Brain,
  MessageSquare,
  Zap,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { GraduationCap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useGlossary } from "@/hooks/useGlossary";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { streamChat, buildGlossaryContext } from "@/lib/ai-chat";
import { TermHighlightedMarkdown } from "@/components/TermHighlightedMarkdown";
import { SmartQuiz } from "@/components/SmartQuiz";
import { getCategoryBadgeClass } from "@/lib/category-colors";

const TermGraph = lazy(() =>
  import("@/components/TermGraph").then((m) => ({ default: m.TermGraph })),
);

interface TermDetailProps {
  term: GlossaryTerm;
  onClose: () => void;
  onNavigate: (term: GlossaryTerm) => void;
}

// AI Insight cache
const insightCache = new Map<string, string>();

export function TermDetail({
  term: rawTerm,
  onClose,
  onNavigate,
}: TermDetailProps) {
  const { t, locale } = useI18n();
  const glossary = useGlossary();
  const navigate = useNavigate();
  const term = glossary.localizeTerm(rawTerm);
  const related = glossary.getRelatedTerms(term.id);
  const catBadgeClass = getCategoryBadgeClass(term.category);

  const [showGraph, setShowGraph] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>(
    insightCache.get(term.id) || "",
  );
  const [insightLoading, setInsightLoading] = useState(
    !insightCache.has(term.id),
  );
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-generate AI insight
  const insightFetched = useRef<string | null>(null);
  useEffect(() => {
    if (insightCache.has(term.id)) {
      setAiInsight(insightCache.get(term.id)!);
      setInsightLoading(false);
      return;
    }
    if (insightFetched.current === term.id) return;
    insightFetched.current = term.id;
    setAiInsight("");
    setInsightLoading(true);
    let content = "";
    streamChat({
      messages: [
        {
          role: "user",
          content: `Term: "${term.term}" (${term.category}). Definition: "${term.definition}". Related: ${(term.related || []).join(", ")}. Give a practical insight about how this concept connects to other Solana concepts and when developers typically encounter it. Be specific. Include a short code example (CLI command or Rust/TypeScript snippet) showing real usage. Use markdown with code blocks. Keep it concise (3-5 sentences + code).`,
        },
      ],
      glossaryContext: buildGlossaryContext(term.term, locale),
      locale,
      mode: "usage-example",
      onDelta: (chunk) => {
        content += chunk;
        setAiInsight(content);
      },
      onDone: () => {
        insightCache.set(term.id, content);
        setInsightLoading(false);
      },
      onError: () => setInsightLoading(false),
    });
  }, [term.id]);

  const handleCopyDefinition = useCallback(() => {
    navigator.clipboard.writeText(`${term.term}: ${term.definition}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [term]);

  const handleExplainWithAI = useCallback(() => {
    navigate("/copilot", {
      state: {
        prefill: `Explain the concept "${term.term}" in detail with examples`,
      },
    });
  }, [term, navigate]);

  const handleSimplify = useCallback(() => {
    navigate("/copilot", {
      state: { prefill: `Explain "${term.term}" like I'm 5 years old (ELI5)` },
    });
  }, [term, navigate]);

  const handleUseInCode = useCallback(() => {
    navigate("/copilot?mode=explain-code", {
      state: {
        prefill: `Show me a real code example using "${term.term}" in Solana/Anchor`,
      },
    });
  }, [term, navigate]);

  const handleCompare = useCallback(() => {
    const relatedName = related[0]?.term || "another concept";
    navigate("/copilot", {
      state: {
        prefill: `Compare "${term.term}" with "${relatedName}" in Solana`,
      },
    });
  }, [term, related, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${catBadgeClass}`}
          >
            {t(`cat.${term.category}` as any) || term.category}
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-surface-elevated"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="text-lg font-bold text-foreground mb-1">{term.term}</h2>

        {term.aliases && term.aliases.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {term.aliases.map((a) => (
              <span
                key={a}
                className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md flex items-center gap-0.5"
              >
                <Tag className="h-2.5 w-2.5" />
                {a}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-foreground/80 leading-relaxed">
          {term.definition}
        </p>

        <button
          onClick={handleCopyDefinition}
          className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copiedCode ? (
            <Check className="h-3 w-3 text-primary" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copiedCode ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* AI Insight */}
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Brain className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-primary">
              {t("term.ai_insight")}
            </span>
          </div>
          {insightLoading && !aiInsight ? (
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ) : (
            <div className="text-xs text-foreground/80 leading-relaxed [&_pre]:bg-[hsl(150_60%_10%)] [&_pre]:border [&_pre]:border-emerald-500/20 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre_code]:text-emerald-400 [&_pre_code]:text-[11px] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_strong]:text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0">
              <TermHighlightedMarkdown
                content={aiInsight}
                onTermClick={onNavigate}
              />
            </div>
          )}
        </div>

        {/* AI Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExplainWithAI}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border text-[11px] font-medium text-foreground hover:bg-surface-hover hover:border-primary/20 transition-all group"
          >
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            {t("term.cta_explain")}
            <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>
          <button
            onClick={handleSimplify}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border text-[11px] font-medium text-foreground hover:bg-surface-hover hover:border-primary/20 transition-all group"
          >
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            {t("term.cta_simplify")}
            <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>
          <button
            onClick={handleUseInCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border text-[11px] font-medium text-foreground hover:bg-surface-hover hover:border-primary/20 transition-all group"
          >
            <Code2 className="h-3.5 w-3.5 text-accent" />
            {t("term.cta_code")}
            <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>
          <button
            onClick={handleCompare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border text-[11px] font-medium text-foreground hover:bg-surface-hover hover:border-primary/20 transition-all group"
          >
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            {t("term.cta_compare")}
            <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Related Terms */}
        {related.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" />
              {t("term.related")}
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {related.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onNavigate(r)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/50 hover:bg-surface-hover text-left transition-all group border border-transparent hover:border-primary/10"
                >
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {r.term}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {r.definition.slice(0, 80)}...
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Learning Path button */}
        <button
          onClick={() => navigate(`/learn?term=${term.id}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 text-sm font-medium text-foreground hover:from-accent/20 hover:to-primary/20 transition-all group mb-2"
        >
          <GraduationCap className="h-4 w-4 text-accent" />
          {t("learn.start" as any)}
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>

        {/* Smart Quiz */}
        <SmartQuiz
          term={term}
          onNavigate={onNavigate}
          onOpenGraph={() => setShowGraph(true)}
          onExplainCode={(code) => {
            navigate("/copilot", { state: { explainCode: code } });
          }}
        />

        {/* Knowledge Graph button */}
        <button
          onClick={() => setShowGraph(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-sm font-medium text-foreground hover:from-primary/20 hover:to-accent/20 transition-all group"
        >
          <Globe className="h-4 w-4 text-primary" />
          {t("term.cta_graph")}
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>

        {/* Graph view */}
        {showGraph && (
          <Suspense
            fallback={
              <div className="h-[400px] flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>
            }
          >
            <TermGraph
              centerTerm={term}
              onSelectTerm={onNavigate}
              onClose={() => setShowGraph(false)}
            />
          </Suspense>
        )}
      </div>
    </motion.div>
  );
}
