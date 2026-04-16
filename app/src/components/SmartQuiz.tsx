import { useState, useCallback } from "react";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { useGlossary } from "@/hooks/useGlossary";
import { useI18n } from "@/lib/i18n";
import { isAIAvailable } from "@/lib/ai-config";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TermHighlightedMarkdown } from "@/components/TermHighlightedMarkdown";
import { ApplyCode } from "@/components/ApplyCode";

const QUIZ_URL = "/api/quiz";

type Difficulty = "beginner" | "intermediate" | "advanced";
type Mode = "concept" | "connections" | "real-world";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  relatedTerms: string[];
}

interface SmartQuizProps {
  term: GlossaryTerm;
  onNavigate: (term: GlossaryTerm) => void;
  onOpenGraph?: () => void;
  onExplainCode?: (code: string) => void;
}

export function SmartQuiz({
  term,
  onNavigate,
  onOpenGraph,
  onExplainCode,
}: SmartQuizProps) {
  const { t, locale } = useI18n();
  const glossary = useGlossary();
  const related = glossary.getRelatedTerms(term.id);

  const [phase, setPhase] = useState<"config" | "loading" | "quiz" | "results">(
    "config",
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [mode, setMode] = useState<Mode>("concept");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongTerms, setWrongTerms] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);

  const generateQuiz = useCallback(async () => {
    setPhase("loading");
    try {
      const resp = await fetch(QUIZ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          term: term.term,
          category: term.category,
          definition: term.definition,
          relatedTerms: related.map((r) => r.term).slice(0, 6),
          difficulty,
          mode,
          locale,
        }),
      });

      if (!resp.ok) throw new Error("Failed to generate quiz");
      const data = await resp.json();
      setQuestions(data.questions || []);
      setCurrentQ(0);
      setScore(0);
      setWrongTerms([]);
      setSelectedOption(null);
      setAnswered(false);
      setPhase("quiz");
    } catch {
      setPhase("config");
    }
  }, [term, related, difficulty, mode, locale]);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (answered) return;
      setSelectedOption(idx);
      setAnswered(true);
      const q = questions[currentQ];
      if (idx === q.correct) {
        setScore((s) => s + 1);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setWrongTerms((prev) => [...new Set([...prev, ...q.relatedTerms])]);
      }
    },
    [answered, questions, currentQ],
  );

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setPhase("results");
    }
  }, [currentQ, questions.length]);

  const handleRestart = useCallback(() => {
    setPhase("config");
    setQuestions([]);
    setCurrentQ(0);
    setScore(0);
    setWrongTerms([]);
  }, []);

  const difficultyOptions: {
    value: Difficulty;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "beginner",
      label: t("quiz.beginner" as any),
      icon: <BookOpen className="h-3 w-3" />,
    },
    {
      value: "intermediate",
      label: t("quiz.intermediate" as any),
      icon: <Brain className="h-3 w-3" />,
    },
    {
      value: "advanced",
      label: t("quiz.advanced" as any),
      icon: <Zap className="h-3 w-3" />,
    },
  ];

  const modeOptions: { value: Mode; label: string; icon: React.ReactNode }[] = [
    {
      value: "concept",
      label: t("quiz.mode_concept" as any),
      icon: <BookOpen className="h-3 w-3" />,
    },
    {
      value: "connections",
      label: t("quiz.mode_connections" as any),
      icon: <Globe className="h-3 w-3" />,
    },
    {
      value: "real-world",
      label: t("quiz.mode_realworld" as any),
      icon: <Zap className="h-3 w-3" />,
    },
  ];

  // CONFIG PHASE
  if (phase === "config") {
    if (!isAIAvailable()) {
      return (
        <div className="bg-gradient-to-br from-violet-500/5 to-primary/5 border border-violet-500/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold text-foreground">
              {t("quiz.title" as any)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("ai.unavailable" as any)} {t("ai.glossary_works" as any)}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-violet-500/5 to-primary/5 border border-violet-500/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold text-foreground">
            {t("quiz.title" as any)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("quiz.description" as any)}
        </p>

        {/* Difficulty */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            {t("quiz.difficulty" as any)}
          </p>
          <div className="flex gap-1.5">
            {difficultyOptions.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                  difficulty === d.value
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-[0_0_8px_rgba(139,92,246,0.15)]"
                    : "bg-secondary/50 text-muted-foreground border border-transparent hover:bg-surface-hover hover:shadow-[0_0_6px_rgba(139,92,246,0.1)]"
                }`}
              >
                {d.icon} {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            {t("quiz.mode_label" as any)}
          </p>
          <div className="flex gap-1.5">
            {modeOptions.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                  mode === m.value
                    ? "bg-primary/20 text-primary border border-primary/40 shadow-[0_0_8px_rgba(var(--primary),0.15)]"
                    : "bg-secondary/50 text-muted-foreground border border-transparent hover:bg-surface-hover hover:shadow-[0_0_6px_rgba(var(--primary),0.1)]"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={generateQuiz}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-primary/20 border border-violet-500/30 text-xs font-semibold text-foreground hover:from-violet-500/30 hover:to-primary/30 hover:shadow-[0_0_16px_rgba(139,92,246,0.2)] transition-all group"
        >
          <Brain className="h-4 w-4 text-violet-400" />
          {t("quiz.start" as any)}
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    );
  }

  // LOADING PHASE
  if (phase === "loading") {
    return (
      <div className="bg-gradient-to-br from-violet-500/5 to-primary/5 border border-violet-500/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400 animate-pulse" />
          <span className="text-xs font-bold text-foreground">
            {t("quiz.generating" as any)}
          </span>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // RESULTS PHASE
  if (phase === "results") {
    const percentage = Math.round((score / questions.length) * 100);
    const reviewTerms = wrongTerms
      .map((name) =>
        glossary.allTerms.find(
          (gt) => gt.term.toLowerCase() === name.toLowerCase(),
        ),
      )
      .filter(Boolean) as GlossaryTerm[];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-violet-500/5 to-primary/5 border border-violet-500/20 rounded-lg p-4 space-y-4"
      >
        <div className="text-center space-y-2">
          <Trophy
            className={`h-8 w-8 mx-auto ${percentage >= 70 ? "text-yellow-400" : "text-muted-foreground"}`}
          />
          <h3 className="text-sm font-bold text-foreground">
            {t("quiz.complete" as any)}
          </h3>
          <p className="text-2xl font-bold text-primary">
            {score}/{questions.length}
          </p>
          <Progress value={percentage} className="h-2" />
        </div>

        {/* Insights */}
        <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-[11px] font-semibold text-foreground">
              {t("quiz.insights" as any)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {percentage >= 70
              ? t("quiz.insight_good" as any)
              : t("quiz.insight_review" as any)}
          </p>
        </div>

        {/* Review terms */}
        {reviewTerms.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("quiz.review_terms" as any)}
            </p>
            <div className="space-y-1">
              {reviewTerms.slice(0, 4).map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => onNavigate(rt)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-surface-hover text-left transition-all group border border-transparent hover:border-primary/10"
                >
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
                  <span className="text-[11px] font-medium text-foreground truncate">
                    {rt.term}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Apply What You Learned */}
        <ApplyCode
          term={term}
          wrongTerms={wrongTerms}
          difficulty={difficulty}
          mode={mode}
          onNavigate={onNavigate}
          onOpenGraph={onOpenGraph}
          onExplainCode={onExplainCode}
        />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleRestart}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border text-[11px] font-medium text-foreground hover:bg-surface-hover transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            {t("quiz.new_session" as any)}
          </button>
          {onOpenGraph && (
            <button
              onClick={onOpenGraph}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-medium text-foreground hover:bg-primary/20 transition-all"
            >
              <Globe className="h-3 w-3 text-primary" />
              {t("quiz.explore_graph" as any)}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // QUIZ PHASE
  const q = questions[currentQ];
  if (!q) return null;

  return (
    <div className="bg-gradient-to-br from-violet-500/5 to-primary/5 border border-violet-500/20 rounded-lg p-4 space-y-3">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground">
          {currentQ + 1}/{questions.length}
        </span>
        <Progress
          value={((currentQ + (answered ? 1 : 0)) / questions.length) * 100}
          className="h-1.5 flex-1 mx-3"
        />
        <span className="text-[10px] font-medium text-primary">
          {score} {t("quiz.score_correct" as any)}
        </span>
      </div>

      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
          >
            <span className="text-4xl">*</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question */}
      <motion.div
        key={currentQ}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={shake ? "animate-[shake_0.3s_ease-in-out]" : ""}
      >
        <p className="text-xs font-semibold text-foreground leading-relaxed mb-3">
          {q.question}
        </p>

        {/* Options */}
        <div className="space-y-1.5">
          {q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            let optionClass =
              "bg-secondary/50 border-transparent hover:bg-surface-hover hover:border-primary/10";
            if (answered) {
              if (idx === q.correct) {
                optionClass =
                  "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
              } else if (idx === selectedOption && idx !== q.correct) {
                optionClass = "bg-red-500/10 border-red-500/30 text-red-300";
              } else {
                optionClass = "bg-secondary/30 border-transparent opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                className={`w-full flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all text-[11px] ${optionClass}`}
              >
                <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {letter}
                </span>
                <span className="flex-1 text-foreground">{opt}</span>
                {answered && idx === q.correct && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                )}
                {answered && idx === selectedOption && idx !== q.correct && (
                  <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Feedback */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div
              className={`rounded-lg p-3 ${selectedOption === q.correct ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {selectedOption === q.correct ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                )}
                <span className="text-[11px] font-semibold text-foreground">
                  {selectedOption === q.correct
                    ? t("quiz.correct" as any)
                    : t("quiz.incorrect" as any)}
                </span>
              </div>
              <p className="text-[11px] text-foreground/80 leading-relaxed">
                {q.explanation}
              </p>
            </div>

            {/* Related from question */}
            {q.relatedTerms &&
              q.relatedTerms.length > 0 &&
              selectedOption !== q.correct && (
                <div className="flex flex-wrap gap-1">
                  {q.relatedTerms.map((rt) => {
                    const found = glossary.allTerms.find(
                      (gt) => gt.term.toLowerCase() === rt.toLowerCase(),
                    );
                    if (!found) return null;
                    return (
                      <button
                        key={rt}
                        onClick={() => onNavigate(found)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {rt}
                      </button>
                    );
                  })}
                </div>
              )}

            {/* Next / Finish */}
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-medium text-foreground hover:bg-primary/20 transition-all group"
            >
              {currentQ < questions.length - 1 ? (
                <>
                  {t("quiz.next" as any)}
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </>
              ) : (
                <>
                  <Trophy className="h-3 w-3 text-yellow-400" />
                  {t("quiz.finish" as any)}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
