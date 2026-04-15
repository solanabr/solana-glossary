"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/contexts/LocaleContext";
import { getCodeExamples, type CodeExample } from "@/lib/code-examples";

const langColors: Record<string, { bg: string; text: string; label: string }> =
  {
    rust: { bg: "bg-orange-500/10", text: "text-orange-400", label: "Rust" },
    typescript: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      label: "TypeScript",
    },
    bash: { bg: "bg-green-500/10", text: "text-green-400", label: "Bash" },
  };

export default function CodeLab({ termId }: { termId: string }) {
  const { copy } = useLocale();
  const lc = copy.learn;
  const examples = getCodeExamples(termId);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  if (examples.length === 0) {
    return null;
  }

  const current = examples[activeTab];
  const langMeta = langColors[current.language] ?? langColors.bash;

  async function copyCode() {
    await navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-solana-green"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <span className="font-mono text-sm font-semibold text-white">
            {lc.codeExamples}
          </span>
        </div>

        {current.playgroundUrl && (
          <a
            href={current.playgroundUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full bg-solana-purple/10 px-3 py-1 text-xs text-solana-purple transition-colors hover:bg-solana-purple/20"
          >
            {lc.openPlayground}
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Tabs */}
      {examples.length > 1 && (
        <div className="flex gap-1 border-b border-white/5 px-4 py-2">
          {examples.map((ex, i) => {
            const meta = langColors[ex.language] ?? langColors.bash;
            return (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  i === activeTab
                    ? `${meta.bg} ${meta.text}`
                    : "text-muted hover:text-white"
                }`}
              >
                {ex.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Code block */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="relative"
        >
          {/* Language badge + copy button */}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${langMeta.bg} ${langMeta.text}`}
            >
              {langMeta.label}
            </span>
            <button
              onClick={copyCode}
              className="rounded-md bg-white/5 px-2 py-1 text-xs text-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <pre className="overflow-x-auto p-4 pt-10">
            <code className="font-mono text-sm leading-relaxed text-white/80">
              {current.code}
            </code>
          </pre>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
