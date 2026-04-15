import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useGlossary } from "@/hooks/useGlossary";
import { useI18n } from "@/lib/i18n";
import { generateTopicPath, type LearningStep } from "@/lib/learning-path";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { TermHighlightedMarkdown } from "@/components/TermHighlightedMarkdown";
import { streamChat, buildGlossaryContext } from "@/lib/ai-chat";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  BookOpen,
  Brain,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Home,
} from "lucide-react";

const LearningPath = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t: _t, locale } = useI18n();
  const t = (key: string) => _t(key as any);
  const glossary = useGlossary();

  const startTermId = searchParams.get("term") || "proof-of-stake";
  const startTerm = glossary.getTerm(startTermId);

  const pathData = useMemo(() => {
    if (!startTerm) return null;
    return generateTopicPath(startTerm, glossary.allTerms, 8);
  }, [startTerm, glossary.allTerms]);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);

  const step = pathData?.steps[currentStep];

  // Auto-generate explanation for current step
  useEffect(() => {
    if (!step) return;
    setExplanation("");
    setLoading(true);
    let content = "";

    const relatedNames = (step.term.related || []).slice(0, 3).join(", ");
    const stepContext =
      currentStep === 0
        ? "This is the FIRST step in a learning path. Explain this concept from scratch for someone new to Solana."
        : `This is step ${step.number} of a learning path. The student already learned the previous concepts. Build on that knowledge.`;

    streamChat({
      messages: [
        {
          role: "user",
          content: `${stepContext}\n\nTerm: "${step.term.term}" (${step.term.category}).\nDefinition: "${step.term.definition}".\nRelated: ${relatedNames}.\n\nExplain this concept clearly in 3-4 sentences. Then show a short practical code example (Rust, TypeScript, or CLI). Use markdown with code blocks. Be didactic and encouraging.`,
        },
      ],
      glossaryContext: buildGlossaryContext(step.term.term, locale),
      locale,
      mode: "usage-example",
      onDelta: (chunk) => {
        content += chunk;
        setExplanation(content);
      },
      onDone: () => setLoading(false),
      onError: () => setLoading(false),
    });
  }, [currentStep, step?.term.id]);

  const handleNext = useCallback(() => {
    if (!pathData) return;
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < pathData.steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, pathData]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleStepClick = useCallback((idx: number) => {
    setCurrentStep(idx);
  }, []);

  const handleTermNavigate = useCallback(
    (term: GlossaryTerm) => {
      navigate(`/learn?term=${term.id}`);
    },
    [navigate],
  );

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  if (!startTerm || !pathData || pathData.steps.length === 0) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{t("learn.not_found")}</p>
          <button
            onClick={() => navigate("/")}
            className="text-primary hover:underline text-sm"
          >
            {t("notfound.link")}
          </button>
        </div>
      </div>
    );
  }

  const progress = (completedSteps.size / pathData.steps.length) * 100;
  const allDone = completedSteps.size === pathData.steps.length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
          </button>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
            <GraduationCap className="h-3.5 w-3.5" />
            {t("learn.mode")}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          {t("learn.title")}:{" "}
          <span className="gradient-text">{startTerm.term}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {pathData.steps.length} {t("learn.steps_label")} ·{" "}
          {t("learn.based_on_graph")}
        </p>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {completedSteps.size}/{pathData.steps.length}
          </span>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Step sidebar */}
        <div className="hidden md:block w-56 shrink-0">
          <div className="sticky top-20 space-y-1">
            {pathData.steps.map((s, i) => {
              const done = completedSteps.has(i);
              const active = i === currentStep;
              return (
                <button
                  key={s.term.id}
                  onClick={() => handleStepClick(i)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-xs ${
                    active
                      ? "bg-primary/10 border border-primary/20 text-foreground"
                      : done
                        ? "bg-secondary/50 text-muted-foreground"
                        : "hover:bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : active ? (
                    <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground">
                      Step {i + 1}
                    </span>
                    <p
                      className={`font-medium truncate ${active ? "text-foreground" : ""}`}
                    >
                      {s.term.term}
                    </p>
                  </div>
                </button>
              );
            })}

            {allDone && (
              <button
                onClick={handleRestart}
                className="w-full flex items-center gap-2 px-3 py-2 mt-3 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("learn.restart")}
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {step && (
              <motion.div
                key={step.term.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step header */}
                <div className="bg-card border border-border rounded-xl p-6 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      STEP {step.number}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {step.term.category}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {step.term.term}
                  </h2>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {step.term.definition}
                  </p>
                </div>

                {/* AI Explanation */}
                <div className="bg-card border border-border rounded-xl p-6 mb-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {t("learn.explanation")}
                    </span>
                  </div>

                  {loading && !explanation ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/5" />
                      <Skeleton className="h-20 w-full mt-3" />
                    </div>
                  ) : (
                    <div className="text-sm text-foreground/80 leading-relaxed [&_pre]:bg-[hsl(150_60%_10%)] [&_pre]:border [&_pre]:border-emerald-500/20 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre_code]:text-emerald-400 [&_pre_code]:text-[11px] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_strong]:text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0">
                      <TermHighlightedMarkdown
                        content={explanation}
                        onTermClick={handleTermNavigate}
                      />
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("learn.prev")}
                  </button>

                  {currentStep < pathData.steps.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all group"
                    >
                      {t("learn.next")}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCompletedSteps(
                          (prev) => new Set([...prev, currentStep]),
                        );
                      }}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                    >
                      <Sparkles className="h-4 w-4" />
                      {t("learn.complete")}
                    </button>
                  )}
                </div>

                {/* Mobile step indicator */}
                <div className="flex md:hidden items-center justify-center gap-1.5 mt-6">
                  {pathData.steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleStepClick(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === currentStep
                          ? "w-6 bg-primary"
                          : completedSteps.has(i)
                            ? "w-2 bg-primary/40"
                            : "w-2 bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
