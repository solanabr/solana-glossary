import type { QuizResult } from "../quiz";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "../glossary";

interface Props {
  results: QuizResult[];
  onBack: () => void;
}

export function Review({ results, onBack }: Props) {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: "rgb(var(--muted))" }}
        >
          ← Back to results
        </button>
        <h1 className="text-xl font-bold mb-6" style={{ color: "rgb(var(--fg))" }}>
          Answer Review
        </h1>

        <div className="flex flex-col gap-4">
          {results.map(({ question, selectedIndex, correct }, i) => (
            <div
              key={question.term.id}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: correct ? "rgb(34 197 94)" : "rgb(239 68 68)" }}
            >
              {/* Header */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  background: correct
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(239,68,68,0.1)",
                }}
              >
                <span className="text-xs font-mono" style={{ color: "rgb(var(--muted))" }}>
                  Q{i + 1}
                </span>
                <span className="text-sm font-medium" style={{ color: "rgb(var(--fg))" }}>
                  {question.term.term}
                </span>
                <span>
                  {correct ? (
                    <span className="text-green-400 font-bold">✓</span>
                  ) : (
                    <span className="text-red-400 font-bold">✗</span>
                  )}
                </span>
              </div>

              {/* Body */}
              <div
                className="px-5 py-4"
                style={{ background: "rgb(var(--card))" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{
                      color: "rgb(var(--muted))",
                      borderColor: "rgb(var(--border))",
                    }}
                  >
                    {CATEGORY_EMOJI[question.term.category]}{" "}
                    {CATEGORY_LABELS[question.term.category]}
                  </span>
                </div>

                {question.options.map((opt, j) => {
                  const isCorrect = j === question.correctIndex;
                  const isSelected = j === selectedIndex;
                  let bg = "transparent";
                  let color = "rgb(var(--muted))";
                  let border = "rgb(var(--border))";
                  let prefix = "";

                  if (isCorrect) {
                    bg = "rgba(34,197,94,0.1)";
                    color = "rgb(var(--fg))";
                    border = "rgb(34 197 94)";
                    prefix = "✓ ";
                  } else if (isSelected) {
                    bg = "rgba(239,68,68,0.1)";
                    color = "rgb(var(--fg))";
                    border = "rgb(239 68 68)";
                    prefix = "✗ ";
                  }

                  return (
                    <div
                      key={j}
                      className="mb-2 p-3 rounded-xl border text-xs leading-relaxed"
                      style={{ background: bg, color, borderColor: border }}
                    >
                      {prefix}{opt}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="mt-8 w-full py-3 rounded-xl text-white font-medium"
          style={{ background: "rgb(var(--accent))" }}
        >
          Back to Results
        </button>
      </div>
    </div>
  );
}
