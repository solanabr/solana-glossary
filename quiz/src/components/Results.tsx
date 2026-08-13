import type { QuizResult } from "../quiz";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "../glossary";

interface Props {
  results: QuizResult[];
  onRestart: () => void;
  onReview: () => void;
}

function formatTime(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function Results({ results, onRestart, onReview }: Props) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = Math.round((correct / total) * 100);
  const avgTime = Math.round(results.reduce((s, r) => s + r.timeMs, 0) / total);

  const wrong = results.filter((r) => !r.correct);

  const emoji =
    pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "📚" : "💪";

  const message =
    pct >= 90
      ? "Outstanding! You know Solana well."
      : pct >= 70
      ? "Great job! Keep exploring."
      : pct >= 50
      ? "Good start — review the missed terms."
      : "Keep studying — you'll get there!";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Score card */}
        <div
          className="rounded-2xl p-8 mb-6 border text-center"
          style={{ background: "rgb(var(--card))", borderColor: "rgb(var(--border))" }}
        >
          <div className="text-5xl mb-3">{emoji}</div>
          <div
            className="text-6xl font-bold mb-1"
            style={{ color: pct >= 70 ? "rgb(34 197 94)" : "rgb(var(--accent))" }}
          >
            {pct}%
          </div>
          <p className="text-sm mb-4" style={{ color: "rgb(var(--muted))" }}>
            {correct} / {total} correct · avg {formatTime(avgTime)} per question
          </p>
          <p style={{ color: "rgb(var(--fg))" }} className="font-medium">
            {message}
          </p>
        </div>

        {/* Missed terms */}
        {wrong.length > 0 && (
          <div
            className="rounded-2xl p-6 mb-6 border"
            style={{ background: "rgb(var(--card))", borderColor: "rgb(var(--border))" }}
          >
            <h2 className="font-semibold mb-4 text-sm" style={{ color: "rgb(var(--fg))" }}>
              📋 Terms to review ({wrong.length})
            </h2>
            <div className="flex flex-col gap-3">
              {wrong.map(({ question }) => (
                <div
                  key={question.term.id}
                  className="p-3 rounded-xl border"
                  style={{
                    borderColor: "rgb(var(--border))",
                    background: "rgb(var(--bg))",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-sm" style={{ color: "rgb(var(--fg))" }}>
                      {question.term.term}
                    </span>
                    <span
                      className="text-xs shrink-0"
                      style={{ color: "rgb(var(--muted))" }}
                    >
                      {CATEGORY_EMOJI[question.term.category]}{" "}
                      {CATEGORY_LABELS[question.term.category]}
                    </span>
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "rgb(var(--muted))" }}
                  >
                    {question.term.definition.slice(0, 150)}
                    {question.term.definition.length > 150 ? "…" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onReview}
            className="flex-1 py-3 rounded-xl border text-sm font-medium transition-colors"
            style={{
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--fg))",
              background: "transparent",
            }}
          >
            Review Answers
          </button>
          <button
            onClick={onRestart}
            className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "rgb(var(--accent))" }}
          >
            Play Again →
          </button>
        </div>
      </div>
    </div>
  );
}
