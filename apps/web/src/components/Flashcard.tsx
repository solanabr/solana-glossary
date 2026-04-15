"use client";

import { useState, useEffect } from "react";
import { type GlossaryTerm } from "@/lib/glossary";
import {
  type ConfettiViewportOrigin,
  viewportOriginFromElement,
} from "@/lib/flashcard-confetti";

interface FlashcardProps {
  term: GlossaryTerm;
  onKnown?: (origin: ConfettiViewportOrigin) => void;
  onSkip?: () => void;
  current: number;
  total: number;
  label?: {
    flip: string;
    flipBack?: string;
    term?: string;
    definition?: string;
    stillLearning?: string;
    iKnow?: string;
  };
  /** When the back face is up and know/skip actions are shown (hide deck nav in parent). */
  onStudyActionsVisibleChange?: (visible: boolean) => void;
}

export default function Flashcard({
  term,
  onKnown,
  onSkip,
  current,
  total,
  label,
  onStudyActionsVisibleChange,
}: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const pct = Math.round((current / total) * 100);

  const studyActionsVisible = flipped && (!!onKnown || !!onSkip);

  useEffect(() => {
    onStudyActionsVisibleChange?.(studyActionsVisible);
  }, [studyActionsVisible, onStudyActionsVisibleChange]);

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[11px] font-medium tabular-nums text-sol-subtle">
            {current} / {total}
          </span>
          <span className="text-[11px] tabular-nums text-sol-accent font-medium">
            {pct}%
          </span>
        </div>
        <div className="h-1 bg-sol-line rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out bg-sol-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div
        className="flashcard-scene perspective-1000 w-full max-w-lg select-none"
        style={{ height: "min(380px, 52vh)" }}
      >
        <div
          className={`flashcard-inner relative h-full min-h-0 w-full ${flipped ? "flipped" : ""}`}
        >
          <div
            className="flashcard-face flashcard-face-front bg-sol-surface-elevated border border-sol-line relative cursor-pointer overflow-hidden"
            role="button"
            tabIndex={0}
            aria-label={label?.flip ?? "Show definition"}
            onClick={() => setFlipped(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFlipped(true);
              }
            }}
          >
            <div className="flashcard-shimmer" aria-hidden />
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start gap-3 z-[1]">
              <span className="tag tag-green">{term.categoryLabel}</span>
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-sol-muted">
                {label?.term ?? "Term"}
              </span>
            </div>

            <div className="text-center px-5 z-[1] max-w-[95%]">
              <h2 className="text-2xl sm:text-3xl md:text-[2rem] font-display font-semibold text-sol-text leading-tight tracking-tight">
                {term.term}
              </h2>
            </div>

            <div className="absolute bottom-5 left-0 right-0 flex justify-center z-[1]">
              <span className="text-[11px] text-sol-subtle flex items-center gap-2 animate-pulse">
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {label?.flip ?? "Tap to flip"}
              </span>
            </div>
          </div>

          <div className="flashcard-back flashcard-face flashcard-face-back bg-sol-darker border border-sol-line relative">
            <div className="flashcard-shimmer opacity-60" aria-hidden />
            <button
              type="button"
              className="absolute top-5 left-5 right-5 z-[2] flex cursor-pointer justify-between items-start gap-3 rounded-lg border-0 bg-transparent p-0 text-left"
              aria-label={label?.flipBack ?? "Show term"}
              onClick={() => setFlipped(false)}
            >
              <span className="tag tag-purple">{term.categoryLabel}</span>
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-sol-muted">
                {label?.definition ?? "Definition"}
              </span>
            </button>

            <div
              className="flashcard-definition-scroll absolute left-0 right-0 top-[4.25rem] bottom-[3.25rem] z-[1] overflow-y-auto px-5 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-left text-sm text-sol-text leading-relaxed sm:text-[15px]">
                {term.definition}
              </p>

              {term.related && term.related.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-start gap-1.5">
                  {term.related.map((rel) => (
                    <span key={rel} className="tag tag-blue text-[9px]">
                      {rel}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="absolute bottom-5 left-0 right-0 z-[2] flex cursor-pointer justify-center border-0 bg-transparent p-0"
              aria-label={label?.flipBack ?? "Show term"}
              onClick={() => setFlipped(false)}
            >
              <span className="text-[11px] text-sol-subtle flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {label?.flipBack ?? "Tap to see term"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {flipped && (onKnown || onSkip) && (
        <div className="flex flex-wrap justify-center gap-3 animate-slide-up">
          {onSkip && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSkip();
              }}
              className="
                flex items-center gap-2 px-5 py-2.5 rounded-lg
                border border-sol-line text-sol-subtle text-[13px] font-medium
                hover:border-red-500/35 hover:text-red-300 hover:bg-red-500/5
                transition-colors
              "
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              {label?.stillLearning ?? "Still learning"}
            </button>
          )}
          {onKnown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onKnown(viewportOriginFromElement(e.currentTarget));
              }}
              className="
                flex items-center gap-2 px-5 py-2.5 rounded-lg
                bg-sol-accent text-sol-darker text-[13px] font-semibold
                hover:opacity-90 transition-opacity shadow-[0_0_24px_-4px_rgba(20,241,149,0.45)]
              "
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {label?.iKnow ?? "I know this"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
