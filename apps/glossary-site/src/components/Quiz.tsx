"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { getAllTermsLocalized } from "@/lib/i18n";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/categories";
import type { GlossaryTerm } from "@stbr/solana-glossary";

type QuizMode = "multiple-choice" | "flashcard";
type Phase = "setup" | "playing" | "results";

interface MCQuestion {
  term: GlossaryTerm;
  options: GlossaryTerm[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMCQuestions(
  pool: GlossaryTerm[],
  all: GlossaryTerm[],
  count: number,
): MCQuestion[] {
  return shuffle(pool)
    .slice(0, count)
    .map((term) => {
      const distractors = shuffle(all.filter((t) => t.id !== term.id)).slice(
        0,
        3,
      );
      const options = shuffle([term, ...distractors]);
      return {
        term,
        options,
        correctIndex: options.findIndex((o) => o.id === term.id),
      };
    });
}

// ── Confetti ───────────────────────────────────────────────────────────────
function launchConfetti() {
  const colors = ["#9945FF", "#14F195", "#00C2FF", "#FFB347", "#FF6B9D"];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement("div");
    el.className = "confetti-particle";
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.8}s;
    `;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

// ── Setup ──────────────────────────────────────────────────────────────────
function Setup({
  onStart,
}: {
  onStart: (mode: QuizMode, cats: string[], n: number) => void;
}) {
  const [mode, setMode] = useState<QuizMode>("multiple-choice");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [count, setCount] = useState(10);
  const { locale } = useLocale();
  const terms = useMemo(() => getAllTermsLocalized(locale), [locale]);

  const pool =
    cats.size > 0 ? terms.filter((t) => cats.has(t.category)) : terms;
  const max = Math.min(pool.length, 50);
  const safeCount = Math.min(count, max);

  function toggle(cat: string) {
    setCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Quiz Solana</h1>
        <p className="text-[#A0A0B0]">
          Teste seus conhecimentos do ecossistema
        </p>
      </div>

      {/* Mode */}
      <div className="space-y-3">
        <p className="text-white font-medium text-sm">Modo</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                id: "multiple-choice",
                icon: "🎯",
                title: "Múltipla Escolha",
                desc: "Veja a definição e escolha o termo certo",
              },
              {
                id: "flashcard",
                icon: "🃏",
                title: "Flashcard",
                desc: "Veja o termo e vire o card para a definição",
              },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`text-left rounded-xl p-4 border transition-all ${
                mode === m.id
                  ? "border-[#9945FF] bg-[#9945FF]/10"
                  : "border-white/8 bg-[#1A1A24] hover:border-white/20"
              }`}
            >
              <div className="text-2xl mb-2">{m.icon}</div>
              <p
                className={`font-semibold text-sm ${mode === m.id ? "text-white" : "text-[#A0A0B0]"}`}
              >
                {m.title}
              </p>
              <p className="text-xs text-[#A0A0B0] mt-1 leading-relaxed">
                {m.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <p className="text-white font-medium text-sm">
          Categorias{" "}
          <span className="text-[#A0A0B0] font-normal">(vazio = todas)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                cats.has(key)
                  ? "text-black"
                  : "bg-[#1A1A24] text-[#A0A0B0] border border-white/8 hover:text-white"
              }`}
              style={cats.has(key) ? { background: CATEGORY_COLORS[key] } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="space-y-3">
        <p className="text-white font-medium text-sm">Número de questões</p>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 50]
            .filter((n) => n <= max)
            .map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  safeCount === n
                    ? "gradient-solana text-black"
                    : "bg-[#1A1A24] text-[#A0A0B0] border border-white/8 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
          {max > 50 || ![10, 20, 50].includes(max) ? null : null}
          <button
            onClick={() => setCount(max)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              safeCount === max && ![10, 20, 50].includes(max)
                ? "gradient-solana text-black"
                : "bg-[#1A1A24] text-[#A0A0B0] border border-white/8 hover:text-white"
            }`}
          >
            Todos ({max})
          </button>
        </div>
        <p className="text-xs text-[#A0A0B0]">
          {pool.length} termos disponíveis
        </p>
      </div>

      <button
        onClick={() => onStart(mode, [...cats], safeCount)}
        className="w-full gradient-solana text-black font-bold rounded-xl py-4 text-base hover:opacity-90 transition-opacity"
      >
        Começar →
      </button>
    </div>
  );
}

// ── Multiple Choice ────────────────────────────────────────────────────────
function MultipleChoice({
  questions,
  onDone,
}: {
  questions: MCQuestion[];
  onDone: (score: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const q = questions[idx];
  const answered = selected !== null;

  function pick(i: number) {
    if (answered) return;
    setSelected(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= questions.length) {
      onDone(score + (selected === q.correctIndex ? 1 : 0));
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  }

  const progress = ((idx + (answered ? 1 : 0)) / questions.length) * 100;
  const catColor = CATEGORY_COLORS[q.term.category] ?? "#9945FF";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[#A0A0B0]">
          <span>
            Questão {idx + 1} / {questions.length}
          </span>
          <span className="text-white font-medium">{score} corretas</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #9945FF, #14F195)",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="rounded-2xl bg-[#1A1A24] border border-white/8 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium rounded-full px-2.5 py-1"
            style={{ background: `${catColor}22`, color: catColor }}
          >
            {CATEGORY_LABELS[q.term.category] ?? q.term.category}
          </span>
          <span className="text-xs text-[#A0A0B0]">
            Qual termo descreve esta definição?
          </span>
        </div>
        <p className="text-[#E0E0E8] text-base leading-7">
          {q.term.definition}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isSelected = selected === i;
          let border = "border-white/8 hover:border-white/20";
          let bg = "bg-[#1A1A24]";
          let textColor = "text-white";
          if (answered) {
            if (isCorrect) {
              border = "border-[#14F195]";
              bg = "bg-[#14F195]/10";
              textColor = "text-[#14F195]";
            } else if (isSelected) {
              border = "border-[#FF4757]";
              bg = "bg-[#FF4757]/10";
              textColor = "text-[#FF4757]";
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => pick(i)}
              className={`text-left rounded-xl border px-5 py-4 transition-all ${border} ${bg} ${textColor} ${!answered ? "cursor-pointer" : "cursor-default"}`}
            >
              <span className="font-medium">{opt.term}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <button
          onClick={next}
          className="w-full gradient-solana text-black font-bold rounded-xl py-3 hover:opacity-90 transition-opacity"
        >
          {idx + 1 >= questions.length ? "Ver Resultado" : "Próxima →"}
        </button>
      )}
    </div>
  );
}

// ── Flashcard ──────────────────────────────────────────────────────────────
function Flashcard({
  terms,
  onDone,
}: {
  terms: GlossaryTerm[];
  onDone: (known: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);

  const term = terms[idx];
  const catColor = CATEGORY_COLORS[term.category] ?? "#9945FF";
  const progress = (idx / terms.length) * 100;

  function respond(didKnow: boolean) {
    const newKnown = known + (didKnow ? 1 : 0);
    if (idx + 1 >= terms.length) {
      onDone(newKnown);
    } else {
      setKnown(newKnown);
      setIdx((i) => i + 1);
      setFlipped(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[#A0A0B0]">
          <span>
            Card {idx + 1} / {terms.length}
          </span>
          <span className="text-white font-medium">{known} sabia</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #9945FF, #14F195)",
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="flashcard-scene cursor-pointer select-none"
        style={{ height: "280px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className={`flashcard-inner w-full h-full ${flipped ? "flipped" : ""}`}
        >
          {/* Front */}
          <div className="flashcard-face rounded-2xl bg-[#1A1A24] border border-white/8 flex flex-col items-center justify-center p-8 gap-4">
            <span
              className="text-xs font-medium rounded-full px-2.5 py-1"
              style={{ background: `${catColor}22`, color: catColor }}
            >
              {CATEGORY_LABELS[term.category] ?? term.category}
            </span>
            <p className="text-white text-2xl font-bold text-center">
              {term.term}
            </p>
            {term.aliases && term.aliases.length > 0 && (
              <p className="text-[#A0A0B0] text-xs text-center">
                também: {term.aliases.slice(0, 3).join(", ")}
              </p>
            )}
            <p className="text-[#A0A0B0] text-xs mt-2">
              Toque para ver a definição
            </p>
          </div>

          {/* Back */}
          <div
            className="flashcard-face flashcard-back rounded-2xl border flex flex-col justify-center p-8 gap-4 overflow-auto"
            style={{
              background: `linear-gradient(135deg, ${catColor}18, #1A1A24)`,
              borderColor: `${catColor}44`,
            }}
          >
            <span
              className="text-xs font-medium rounded-full px-2.5 py-1 self-start"
              style={{ background: `${catColor}22`, color: catColor }}
            >
              Definição
            </span>
            <p className="text-[#E0E0E8] text-sm leading-7">
              {term.definition}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => respond(false)}
            className="rounded-xl border border-[#FF4757]/40 bg-[#FF4757]/10 text-[#FF4757] font-semibold py-3 hover:bg-[#FF4757]/20 transition-colors"
          >
            😅 Não sabia
          </button>
          <button
            onClick={() => respond(true)}
            className="rounded-xl border border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195] font-semibold py-3 hover:bg-[#14F195]/20 transition-colors"
          >
            ✅ Sabia!
          </button>
        </div>
      )}

      {!flipped && (
        <p className="text-center text-xs text-[#A0A0B0]">
          Clique no card para revelar a definição
        </p>
      )}
    </div>
  );
}

// ── Results ────────────────────────────────────────────────────────────────
function Results({
  score,
  total,
  mode,
  onRestart,
}: {
  score: number;
  total: number;
  mode: QuizMode;
  onRestart: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const launched = useRef(false);

  useEffect(() => {
    if (!launched.current && pct >= 70) {
      launched.current = true;
      launchConfetti();
    }
  }, [pct]);

  const grade =
    pct === 100
      ? { emoji: "🏆", label: "Perfeito!" }
      : pct >= 80
        ? { emoji: "🎉", label: "Excelente!" }
        : pct >= 60
          ? { emoji: "👍", label: "Bom trabalho!" }
          : pct >= 40
            ? { emoji: "🤔", label: "Está no caminho!" }
            : { emoji: "😅", label: "Precisa praticar mais!" };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-8">
      <div className="space-y-2">
        <p className="text-5xl">{grade.emoji}</p>
        <h2 className="text-2xl font-bold text-white">{grade.label}</h2>
      </div>

      <div className="rounded-2xl bg-[#1A1A24] border border-white/8 p-8 space-y-6">
        {/* Ring progress */}
        <div className="relative w-28 h-28 mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              strokeWidth="10"
              stroke="url(#grad)"
              strokeLinecap="round"
              strokeDasharray={`${pct * 2.513} 251.3`}
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9945FF" />
                <stop offset="100%" stopColor="#14F195" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{pct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#14F195]/10 border border-[#14F195]/20 p-4">
            <p className="text-[#14F195] text-2xl font-bold">{score}</p>
            <p className="text-[#A0A0B0] text-xs mt-1">
              {mode === "flashcard" ? "Sabia" : "Corretas"}
            </p>
          </div>
          <div className="rounded-xl bg-[#FF4757]/10 border border-[#FF4757]/20 p-4">
            <p className="text-[#FF4757] text-2xl font-bold">{total - score}</p>
            <p className="text-[#A0A0B0] text-xs mt-1">
              {mode === "flashcard" ? "Não sabia" : "Erradas"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onRestart}
          className="w-full gradient-solana text-black font-bold rounded-xl py-3 hover:opacity-90 transition-opacity"
        >
          Jogar novamente
        </button>
        <Link
          href="/"
          className="w-full rounded-xl border border-white/8 py-3 text-[#A0A0B0] hover:text-white transition-colors text-sm"
        >
          Voltar ao glossário
        </Link>
      </div>
    </div>
  );
}

// ── Root orchestrator ──────────────────────────────────────────────────────
export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<QuizMode>("multiple-choice");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const { locale } = useLocale();

  const allLocalized = useMemo(() => getAllTermsLocalized(locale), [locale]);

  // Questions built once per quiz start
  const [questions, setQuestions] = useState<MCQuestion[]>([]);
  const [flashcardTerms, setFlashcardTerms] = useState<GlossaryTerm[]>([]);

  const start = useCallback(
    (m: QuizMode, cats: string[], n: number) => {
      const pool =
        cats.length > 0
          ? allLocalized.filter((t) => cats.includes(t.category))
          : allLocalized;
      setMode(m);
      if (m === "multiple-choice") {
        const qs = buildMCQuestions(pool, allLocalized, n);
        setQuestions(qs);
        setTotal(qs.length);
      } else {
        const terms = shuffle(pool).slice(0, n);
        setFlashcardTerms(terms);
        setTotal(terms.length);
      }
      setScore(0);
      setPhase("playing");
    },
    [allLocalized],
  );

  function handleDone(s: number) {
    setScore(s);
    setPhase("results");
  }

  if (phase === "setup") return <Setup onStart={start} />;

  if (phase === "results") {
    return (
      <Results
        score={score}
        total={total}
        mode={mode}
        onRestart={() => setPhase("setup")}
      />
    );
  }

  if (mode === "flashcard") {
    return <Flashcard terms={flashcardTerms} onDone={handleDone} />;
  }

  return <MultipleChoice questions={questions} onDone={handleDone} />;
}
