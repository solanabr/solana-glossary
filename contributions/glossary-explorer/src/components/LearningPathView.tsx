"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLearning } from "@/contexts/LearningContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getTerm } from "@/lib/glossary";
import {
  getLearningPath,
  getPathTitle,
  getPathDescription,
} from "@/lib/learning-paths";

const difficultyColors: Record<string, string> = {
  beginner: "text-green-400 border-green-400/20 bg-green-400/10",
  intermediate: "text-yellow-400 border-yellow-400/20 bg-yellow-400/10",
  advanced: "text-red-400 border-red-400/20 bg-red-400/10",
};

export default function LearningPathView({ slug }: { slug: string }) {
  const path = useMemo(() => getLearningPath(slug), [slug]);
  const { getProgress, completeTermInPath, getCompletionPercent } =
    useLearning();
  const { locale, copy, localizeTerm } = useLocale();
  const lc = copy.learn;

  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  if (!path) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <h2 className="mb-2 font-mono text-2xl font-bold text-white">
          Path not found
        </h2>
        <Link
          href="/learn"
          className="text-solana-purple transition-colors hover:text-solana-green"
        >
          Back to Learn
        </Link>
      </div>
    );
  }

  const progress = getProgress(path.slug);
  const completedSet = new Set(progress?.completedTerms ?? []);
  const pct = getCompletionPercent(path);
  const title = getPathTitle(path, locale);
  const desc = getPathDescription(path, locale);
  const diffLabel = lc[path.difficulty as keyof typeof lc] ?? path.difficulty;

  // Group terms into blocks of 10
  const blocks: Array<{ title: string; termIds: string[] }> = [];
  const blockSize = 10;
  for (let i = 0; i < path.termIds.length; i += blockSize) {
    const blockIndex = Math.floor(i / blockSize) + 1;
    blocks.push({
      title: `Block ${blockIndex}`,
      termIds: path.termIds.slice(i, i + blockSize),
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/learn"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-white"
        >
          &larr; {lc.learningPaths}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-3xl font-bold text-white sm:text-4xl">
              {title}
            </h1>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${difficultyColors[path.difficulty]}`}
            >
              {diffLabel as string}
            </span>
          </div>
          <p className="max-w-2xl text-muted">{desc}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span>
              {path.termIds.length} terms &middot; ~{path.estimatedHours}{" "}
              {lc.hours}
            </span>
            <span>
              {completedSet.size} / {path.termIds.length} {lc.termsCompleted}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: path.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Term blocks */}
      <div className="space-y-8">
        {blocks.map((block, blockIdx) => {
          const blockCompleted = block.termIds.filter((id) =>
            completedSet.has(id),
          ).length;
          const blockPct = Math.round(
            (blockCompleted / block.termIds.length) * 100,
          );

          return (
            <motion.div
              key={block.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: blockIdx * 0.05 }}
            >
              <div className="mb-3 flex items-center gap-3">
                <h3 className="font-mono text-sm font-semibold text-muted">
                  {block.title}
                </h3>
                <div className="h-px flex-1 bg-white/5" />
                <span className="font-mono text-xs text-muted">
                  {blockPct}%
                </span>
              </div>

              <div className="space-y-2">
                {block.termIds.map((termId, termIdx) => {
                  const rawTerm = getTerm(termId);
                  if (!rawTerm) return null;
                  const term = localizeTerm(rawTerm);
                  const isCompleted = completedSet.has(termId);
                  const isExpanded = expandedTerm === termId;
                  const globalIdx = blockIdx * blockSize + termIdx;

                  return (
                    <div key={termId}>
                      <div
                        className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                          isCompleted
                            ? "border-white/5 bg-white/[0.02]"
                            : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                        }`}
                        onClick={() =>
                          setExpandedTerm(isExpanded ? null : termId)
                        }
                      >
                        {/* Number */}
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-xs text-muted">
                          {globalIdx + 1}
                        </span>

                        {/* Term info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-sm font-medium ${isCompleted ? "text-muted line-through" : "text-white"}`}
                            >
                              {term.term}
                            </span>
                            {term.aliases && term.aliases.length > 0 && (
                              <span className="text-xs text-muted">
                                ({term.aliases[0]})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCompleted) {
                              completeTermInPath(path.slug, termId);
                            }
                          }}
                          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
                            isCompleted
                              ? "border-solana-green/30 bg-solana-green/20"
                              : "border-white/20 hover:border-solana-green/30 hover:bg-solana-green/10"
                          }`}
                        >
                          {isCompleted && (
                            <svg
                              className="h-4 w-4 text-solana-green"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-11 mt-1 rounded-xl border border-white/5 bg-white/[0.02] p-4"
                        >
                          <p className="mb-3 text-sm leading-relaxed text-white/80">
                            {term.definition}
                          </p>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/term/${term.id}`}
                              className="text-xs text-solana-purple transition-colors hover:text-solana-green"
                            >
                              View full details &rarr;
                            </Link>
                            <Link
                              href={`/explore?highlight=${term.id}`}
                              className="text-xs text-muted transition-colors hover:text-white"
                            >
                              View in graph
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
