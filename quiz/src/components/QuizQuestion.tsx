import { useEffect, useRef, useState } from "react";
import type { Question } from "../quiz";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "../glossary";

interface Props {
  question: Question;
  index: number;
  total: number;
  onAnswer: (selectedIndex: number, timeMs: number) => void;
}

export function QuizQuestion({ question, index, total, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const startRef = useRef(Date.now());

  // Reset on question change
  useEffect(() => {
    setSelected(null);
    setRevealed(false);
    startRef.current = Date.now();
  }, [question]);

  function choose(i: number) {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    const timeMs = Date.now() - startRef.current;
    // Small delay so user sees the feedback before next question
    setTimeout(() => onAnswer(i, timeMs), 900);
  }

  const { term, options, correctIndex } = question;
  const progress = ((index + 1) / total) * 100;

  function optionStyle(i: number): React.CSSProperties {
    if (!revealed) {
      return {
        background: "rgb(var(--card))",
        borderColor: "rgb(var(--border))",
        color: "rgb(var(--fg))",
      };
    }
    if (i === correctIndex) {
      return {
        background: "rgba(34,197,94,0.15)",
        borderColor: "rgb(34 197 94)",
        color: "rgb(var(--fg))",
      };
    }
    if (i === selected && i !== correctIndex) {
      return {
        background: "rgba(239,68,68,0.15)",
        borderColor: "rgb(239 68 68)",
        color: "rgb(var(--fg))",
      };
    }
    return {
      background: "rgb(var(--card))",
      borderColor: "rgb(var(--border))",
      color: "rgb(var(--muted))",
      opacity: 0.5,
    };
  }

  function optionIcon(i: number) {
    if (!revealed) return null;
    if (i === correctIndex) return <span className="text-green-400">✓</span>;
    if (i === selected) return <span className="text-red-400">✗</span>;
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex-1 rounded-full h-2 overflow-hidden"
            style={{ background: "rgb(var(--border))" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "rgb(var(--accent))" }}
            />
          </div>
          <span className="text-xs shrink-0" style={{ color: "rgb(var(--muted))" }}>
            {index + 1} / {total}
          </span>
        </div>

        {/* Question card */}
        <div
          className="rounded-2xl p-6 mb-6 border"
          style={{ background: "rgb(var(--card))", borderColor: "rgb(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{ color: "rgb(var(--muted))", borderColor: "rgb(var(--border))" }}
            >
              {CATEGORY_EMOJI[term.category]} {CATEGORY_LABELS[term.category]}
            </span>
          </div>
          <p className="text-xs mb-2" style={{ color: "rgb(var(--muted))" }}>
            What is the definition of…
          </p>
          <h2 className="text-xl font-bold" style={{ color: "rgb(var(--fg))" }}>
            {term.term}
          </h2>
          {term.aliases && term.aliases.length > 0 && (
            <p className="text-xs mt-1" style={{ color: "rgb(var(--accent))" }}>
              also: {term.aliases.join(", ")}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              className="text-left p-4 rounded-xl border text-sm leading-relaxed transition-all"
              style={optionStyle(i)}
              disabled={revealed}
            >
              <span className="flex gap-3 items-start">
                <span
                  className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{
                    borderColor: "rgb(var(--border))",
                    color: "rgb(var(--muted))",
                  }}
                >
                  {revealed ? optionIcon(i) : String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
