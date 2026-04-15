"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLearning } from "@/contexts/LearningContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getTerm } from "@/lib/glossary";
import type { ReviewQuality } from "@/lib/srs";

export default function FlashcardSession() {
  const { getStudySession, review, getCardInfo, stats, refreshStats } =
    useLearning();
  const { locale, copy, localizeTerm } = useLocale();
  const lc = copy.learn;

  const [batch, setBatch] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [direction, setDirection] = useState(1);

  // Initialize batch on mount
  useEffect(() => {
    const session = getStudySession(20);
    setBatch(session);
  }, [getStudySession]);

  const currentTermId = batch[currentIndex];
  const rawTerm = currentTermId ? getTerm(currentTermId) : null;
  const term = rawTerm ? localizeTerm(rawTerm) : null;
  const cardInfo = currentTermId ? getCardInfo(currentTermId) : null;

  const handleReview = useCallback(
    (quality: ReviewQuality) => {
      if (!currentTermId) return;

      review(currentTermId, quality);
      setReviewed((prev) => prev + 1);
      setShowAnswer(false);
      setDirection(1);

      if (currentIndex < batch.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionDone(true);
      }
    },
    [currentTermId, currentIndex, batch.length, review],
  );

  const handleNewSession = useCallback(() => {
    refreshStats();
    const session = getStudySession(20);
    setBatch(session);
    setCurrentIndex(0);
    setShowAnswer(false);
    setReviewed(0);
    setSessionDone(false);
  }, [getStudySession, refreshStats]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (sessionDone) return;

      if (!showAnswer && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setShowAnswer(true);
      } else if (showAnswer) {
        switch (e.key) {
          case "1":
            handleReview(1);
            break;
          case "2":
            handleReview(2);
            break;
          case "3":
            handleReview(3);
            break;
          case "4":
            handleReview(5);
            break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnswer, sessionDone, handleReview]);

  if (batch.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 text-6xl">{"\u{1F389}"}</div>
        <h2 className="mb-2 font-mono text-2xl font-bold text-white">
          All caught up!
        </h2>
        <p className="mb-6 text-muted">
          No cards due for review. Come back later or start a new session with
          fresh terms.
        </p>
        <Link
          href="/learn"
          className="rounded-xl bg-solana-purple px-6 py-3 font-medium text-white transition-colors hover:bg-solana-purple/80"
        >
          Back to Learn
        </Link>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full"
        >
          <div className="mb-4 text-6xl">{"\u{2728}"}</div>
          <h2 className="mb-2 font-mono text-3xl font-bold text-white">
            {lc.sessionComplete}
          </h2>
          <p className="mb-8 text-lg text-muted">
            {reviewed} {lc.reviewedCards}
          </p>

          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="font-mono text-2xl font-bold text-solana-green">
                {stats.streak}
              </div>
              <div className="text-xs text-muted">{lc.streak}</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="font-mono text-2xl font-bold text-solana-purple">
                {stats.masteredCards}
              </div>
              <div className="text-xs text-muted">{lc.mastered}</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="font-mono text-2xl font-bold text-cyan-400">
                {stats.dueToday}
              </div>
              <div className="text-xs text-muted">{lc.dueToday}</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleNewSession}
              className="rounded-xl bg-solana-green px-6 py-3 font-medium text-black transition-colors hover:bg-solana-green/80"
            >
              {lc.continueStudying}
            </button>
            <Link
              href="/learn"
              className="rounded-xl border border-white/10 px-6 py-3 font-medium text-white transition-colors hover:bg-white/5"
            >
              {lc.progress}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">
            {currentIndex + 1} / {batch.length}
          </span>
          <Link
            href="/learn"
            className="text-muted transition-colors hover:text-white"
          >
            &times; End session
          </Link>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green"
            animate={{
              width: `${((currentIndex + 1) / batch.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait" initial={false}>
        {term && (
          <motion.div
            key={currentTermId}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            {/* Category badge */}
            <div className="border-b border-white/5 px-6 py-3">
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-muted">
                {term.category}
              </span>
              {term.aliases && term.aliases.length > 0 && (
                <span className="ml-2 text-xs text-muted">
                  ({term.aliases.join(", ")})
                </span>
              )}
            </div>

            {/* Question */}
            <div className="p-8 text-center">
              <h2 className="font-mono text-3xl font-bold text-white sm:text-4xl">
                {term.term}
              </h2>

              {!showAnswer && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 text-muted"
                >
                  Can you define this term?
                </motion.p>
              )}
            </div>

            {/* Answer */}
            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/5"
                >
                  <div className="p-8">
                    <p className="text-center text-lg leading-relaxed text-white/90">
                      {term.definition}
                    </p>

                    {term.related && term.related.length > 0 && (
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs text-muted">Related:</span>
                        {term.related.slice(0, 5).map((id) => (
                          <span
                            key={id}
                            className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted"
                          >
                            {id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="border-t border-white/5 p-4">
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full rounded-xl bg-white/5 py-3 font-medium text-white transition-colors hover:bg-white/10"
                >
                  {lc.showAnswer}{" "}
                  <kbd className="ml-2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-muted">
                    Space
                  </kbd>
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  <ReviewButton
                    quality={1}
                    label={lc.again}
                    shortcut="1"
                    color="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    onClick={() => handleReview(1)}
                  />
                  <ReviewButton
                    quality={2}
                    label={lc.hard}
                    shortcut="2"
                    color="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                    onClick={() => handleReview(2)}
                  />
                  <ReviewButton
                    quality={3}
                    label={lc.good}
                    shortcut="3"
                    color="bg-solana-green/20 text-solana-green hover:bg-solana-green/30"
                    onClick={() => handleReview(3)}
                  />
                  <ReviewButton
                    quality={5}
                    label={lc.easy}
                    shortcut="4"
                    color="bg-solana-purple/20 text-solana-purple hover:bg-solana-purple/30"
                    onClick={() => handleReview(5)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard hint */}
      <p className="mt-4 text-center text-xs text-muted/50">
        Keyboard: Space to reveal, 1-4 to rate
      </p>
    </div>
  );
}

function ReviewButton({
  label,
  shortcut,
  color,
  onClick,
}: {
  quality: number;
  label: string;
  shortcut: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-3 text-sm font-medium transition-colors ${color}`}
    >
      {label}
      <kbd className="ml-1 text-[10px] opacity-50">{shortcut}</kbd>
    </button>
  );
}
