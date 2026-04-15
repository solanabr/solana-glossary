"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLearning } from "@/contexts/LearningContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getPathTitle, getPathDescription } from "@/lib/learning-paths";
import { allTerms } from "@/lib/glossary";

const pathIcons: Record<string, string> = {
  rocket: "\u{1F680}",
  chart: "\u{1F4C8}",
  shield: "\u{1F6E1}\u{FE0F}",
  gem: "\u{1F48E}",
  brain: "\u{1F9E0}",
};

const difficultyColors: Record<string, string> = {
  beginner: "text-green-400 border-green-400/20 bg-green-400/10",
  intermediate: "text-yellow-400 border-yellow-400/20 bg-yellow-400/10",
  advanced: "text-red-400 border-red-400/20 bg-red-400/10",
};

export default function LearnHub() {
  const { stats, accuracy, paths, getCompletionPercent } = useLearning();
  const { locale, copy } = useLocale();
  const lc = copy.learn;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="font-mono text-4xl font-bold sm:text-5xl">
          <span className="gradient-text">{lc.title}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          {lc.subtitle}
        </p>
      </motion.div>

      {/* Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <StatCard
          value={stats.streak}
          label={lc.streak}
          color="text-solana-green"
          icon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" />
            </svg>
          }
        />
        <StatCard
          value={stats.dueToday}
          label={lc.dueToday}
          color="text-solana-purple"
          icon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <StatCard
          value={stats.masteredCards}
          label={lc.mastered}
          color="text-yellow-400"
          icon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          }
        />
        <StatCard
          value={`${accuracy}%`}
          label={lc.accuracy}
          color="text-cyan-400"
          icon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      </motion.div>

      {/* Main Actions */}
      <div className="mb-12 grid gap-6 md:grid-cols-2">
        {/* Flashcards CTA */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/learn/flashcards"
            className="group block h-full overflow-hidden rounded-2xl border border-solana-green/20 bg-gradient-to-br from-solana-green/10 to-transparent p-8 transition-all hover:-translate-y-1 hover:border-solana-green/40 hover:shadow-[0_20px_60px_rgba(20,241,149,0.15)]"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-solana-green/20 text-2xl">
              <svg
                className="h-7 w-7 text-solana-green"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="mb-2 font-mono text-2xl font-bold text-white">
              {lc.flashcards}
            </h2>
            <p className="mb-4 text-muted">{lc.flashcardsDesc}</p>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-solana-green/20 px-3 py-1 text-sm font-medium text-solana-green">
                {stats.dueToday > 0
                  ? `${stats.dueToday} ${lc.dueToday}`
                  : lc.startStudying}
              </span>
              <span className="text-solana-green transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Daily Challenge */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <DailyChallenge />
        </motion.div>
      </div>

      {/* Learning Paths */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-2 font-mono text-2xl font-bold">
          {lc.learningPaths}
        </h2>
        <p className="mb-6 text-muted">{lc.pathsDesc}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path, i) => {
            const pct = getCompletionPercent(path);
            const title = getPathTitle(path, locale);
            const desc = getPathDescription(path, locale);
            const diffLabel =
              lc[path.difficulty as keyof typeof lc] ?? path.difficulty;

            return (
              <motion.div
                key={path.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
              >
                <Link
                  href={`/learn/path/${path.slug}`}
                  className="group block h-full rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-3xl">
                      {pathIcons[path.icon] ?? "\u{1F4DA}"}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${difficultyColors[path.difficulty]}`}
                    >
                      {diffLabel as string}
                    </span>
                  </div>

                  <h3 className="mb-1 font-mono text-lg font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm text-muted">{desc}</p>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted">{lc.progress}</span>
                      <span className="font-mono text-white">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: path.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>
                      {path.termIds.length} terms &middot; ~
                      {path.estimatedHours}h
                    </span>
                    <span className="text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {pct > 0 ? lc.continuePath : lc.beginPath} &rarr;
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({
  value,
  label,
  color,
  icon,
}: {
  value: number | string;
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function DailyChallenge() {
  const { copy } = useLocale();
  const lc = copy.learn;

  // Deterministic daily term based on date
  const dayIndex = Math.floor(Date.now() / 86400000) % 1001;
  const term = allTerms[dayIndex];

  if (!term) return null;

  return (
    <Link
      href={`/term/${term.id}`}
      className="group block h-full overflow-hidden rounded-2xl border border-solana-purple/20 bg-gradient-to-br from-solana-purple/10 to-transparent p-8 transition-all hover:-translate-y-1 hover:border-solana-purple/40 hover:shadow-[0_20px_60px_rgba(153,69,255,0.15)]"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-solana-purple/20 text-2xl">
        <svg
          className="h-7 w-7 text-solana-purple"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-solana-purple">
        {lc.dailyChallenge}
      </p>
      <h2 className="mb-2 font-mono text-2xl font-bold text-white">
        {term.term}
      </h2>
      <p className="line-clamp-3 text-sm text-muted">{term.definition}</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-solana-purple/20 px-3 py-1 text-sm font-medium text-solana-purple">
          {term.category}
        </span>
        <span className="text-solana-purple transition-transform group-hover:translate-x-1">
          &rarr;
        </span>
      </div>
    </Link>
  );
}
