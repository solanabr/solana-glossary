"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import SearchBar from "./SearchBar";
import CategoryGrid from "./CategoryGrid";
import { useLocale } from "@/contexts/LocaleContext";
import type { GlossaryTerm } from "@/lib/types";

interface HomeProps {
  terms: GlossaryTerm[];
  categories: {
    slug: GlossaryTerm["category"];
    label: string;
    color: string;
    count: number;
    description: string;
    previewTerms: GlossaryTerm[];
  }[];
}

function GraphPreview() {
  return (
    <svg viewBox="0 0 220 140" className="h-36 w-full">
      <motion.line
        x1="36"
        y1="40"
        x2="110"
        y2="72"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1 }}
      />
      <motion.line
        x1="110"
        y1="72"
        x2="180"
        y2="34"
        stroke="rgba(20,241,149,0.34)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.15 }}
      />
      <motion.line
        x1="110"
        y1="72"
        x2="176"
        y2="112"
        stroke="rgba(153,69,255,0.34)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.3 }}
      />
      {[
        { cx: 36, cy: 40, fill: "#14F195", delay: 0 },
        { cx: 110, cy: 72, fill: "#FFFFFF", delay: 0.15 },
        { cx: 180, cy: 34, fill: "#9945FF", delay: 0.3 },
        { cx: 176, cy: 112, fill: "#14F195", delay: 0.45 },
      ].map((node) => (
        <motion.circle
          key={`${node.cx}-${node.cy}`}
          cx={node.cx}
          cy={node.cy}
          r="7"
          fill={node.fill}
          initial={{ scale: 0.7, opacity: 0.65 }}
          animate={{ scale: [0.9, 1.15, 0.95], opacity: [0.75, 1, 0.85] }}
          transition={{
            duration: 2.6,
            repeat: Number.POSITIVE_INFINITY,
            delay: node.delay,
          }}
        />
      ))}
    </svg>
  );
}

export default function HomeClient({ terms, categories }: HomeProps) {
  const { copy } = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-mono text-4xl font-bold tracking-tight sm:text-6xl"
          >
            <span className="gradient-text">solexicon</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted sm:text-xl"
          >
            {copy.home.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mx-auto mt-10 max-w-3xl"
          >
            <SearchBar terms={terms} large autoFocus />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mt-10"
        >
          <Link
            href="/explore"
            className="group relative block overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(153,69,255,0.16),rgba(20,241,149,0.12),rgba(255,255,255,0.04))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-1 hover:border-white/20 md:p-8"
          >
            <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-solana-purple/20 blur-3xl" />
            <div className="absolute right-0 top-8 h-40 w-40 rounded-full bg-solana-green/20 blur-3xl" />

            <div className="relative grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-center">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/55">
                  {copy.home.graphMode}
                </p>
                <h2 className="mt-3 font-mono text-2xl font-semibold text-white sm:text-3xl">
                  {copy.home.graphTitle}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-white/75">
                  {copy.home.graphSubtitle}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white transition-colors group-hover:border-solana-green/30 group-hover:bg-white/12">
                  {copy.home.graphCta}
                  <span className="text-solana-green">→</span>
                </span>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-black/20 p-4">
                <GraphPreview />
              </div>
            </div>
          </Link>
        </motion.div>
      </section>

      {/* Learn CTA */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.32 }}
        className="pb-12"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/learn/flashcards"
            className="glass-card group rounded-2xl p-6 transition-all hover:-translate-y-1"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-solana-green/15 text-solana-green">
              <svg
                className="h-5 w-5"
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
            <h3 className="font-mono text-sm font-semibold text-white">
              Flashcards
            </h3>
            <p className="mt-1 text-xs text-muted">SM-2 spaced repetition</p>
          </Link>
          <Link
            href="/learn"
            className="glass-card group rounded-2xl p-6 transition-all hover:-translate-y-1"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-solana-purple/15 text-solana-purple">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="font-mono text-sm font-semibold text-white">
              Learning Paths
            </h3>
            <p className="mt-1 text-xs text-muted">Guided Solana journeys</p>
          </Link>
          <Link
            href="/chat"
            className="glass-card group rounded-2xl p-6 transition-all hover:-translate-y-1"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
            </div>
            <h3 className="font-mono text-sm font-semibold text-white">
              AI Tutor
            </h3>
            <p className="mt-1 text-xs text-muted">Ask anything about Solana</p>
          </Link>
        </div>
      </motion.section>

      <section className="pb-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-mono text-xl font-semibold">
              {copy.home.categories}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {terms.length} {copy.home.totalTerms}
            </p>
          </div>
        </div>

        <CategoryGrid categories={categories} />
      </section>
    </div>
  );
}
