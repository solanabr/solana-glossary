import { useState } from "react";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_EMOJI, type Category } from "../glossary";
import type { QuizConfig } from "../quiz";

interface Props {
  onStart: (config: QuizConfig) => void;
}

const COUNTS = [5, 10, 15, 20, 30];

export function Setup({ onStart }: Props) {
  const [selected, setSelected] = useState<Set<Category>>(new Set());
  const [count, setCount] = useState(10);

  function toggle(cat: Category) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function start() {
    onStart({ categories: [...selected], questionCount: count });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">◎</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "rgb(var(--fg))" }}>
            Solana Quiz
          </h1>
          <p style={{ color: "rgb(var(--muted))" }} className="text-sm">
            Test your knowledge of the Solana ecosystem — 1001 terms, 14 categories.
          </p>
        </div>

        {/* Category picker */}
        <div
          className="rounded-2xl p-6 mb-6 border"
          style={{ background: "rgb(var(--card))", borderColor: "rgb(var(--border))" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: "rgb(var(--fg))" }}>
              Categories{" "}
              <span style={{ color: "rgb(var(--muted))" }} className="font-normal">
                (all = any)
              </span>
            </h2>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs"
              style={{ color: "rgb(var(--accent))" }}
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = selected.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggle(cat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background: active ? "rgb(var(--accent))" : "transparent",
                    color: active ? "#fff" : "rgb(var(--muted))",
                    borderColor: active ? "transparent" : "rgb(var(--border))",
                  }}
                >
                  {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question count */}
        <div
          className="rounded-2xl p-6 mb-8 border"
          style={{ background: "rgb(var(--card))", borderColor: "rgb(var(--border))" }}
        >
          <h2 className="font-semibold text-sm mb-4" style={{ color: "rgb(var(--fg))" }}>
            Number of questions
          </h2>
          <div className="flex gap-2">
            {COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all border"
                style={{
                  background: n === count ? "rgb(var(--accent))" : "transparent",
                  color: n === count ? "#fff" : "rgb(var(--muted))",
                  borderColor: n === count ? "transparent" : "rgb(var(--border))",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Start */}
        <button
          onClick={start}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-opacity hover:opacity-90 active:scale-[0.99]"
          style={{ background: "rgb(var(--accent))" }}
        >
          Start Quiz →
        </button>
      </div>
    </div>
  );
}
