"use client";

import dynamic from "next/dynamic";
import SearchBar from "@/components/SearchBar";
import TermPanel from "@/components/TermPanel";
import Legend from "@/components/Legend";
import ThemeToggle from "@/components/ThemeToggle";

const GraphCanvas = dynamic(() => import("@/components/GraphCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#f0f0f8] dark:bg-[#050510]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9945FF] border-t-transparent" />
        <span className="text-sm text-[#0a0a1a]/40 dark:text-white/40">Building graph…</span>
      </div>
    </div>
  ),
});

export default function AtlasPage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#f0f0f8] dark:bg-[#050510]">
      <header className="absolute top-0 left-0 right-0 z-10 flex h-14 items-center gap-2 px-3 border-b border-black/5 bg-white/80 backdrop-blur-md sm:h-16 sm:gap-4 sm:px-5 dark:border-white/5 dark:bg-[#050510]/80">
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="sm:w-7 sm:h-7">
            <circle cx="14" cy="14" r="13" stroke="#9945FF" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="3" fill="#14F195" />
            <circle cx="7" cy="9" r="2" fill="#9945FF" />
            <circle cx="21" cy="9" r="2" fill="#F5A623" />
            <circle cx="7" cy="19" r="2" fill="#00C2FF" />
            <circle cx="21" cy="19" r="2" fill="#FF6B6B" />
            <line x1="14" y1="14" x2="7" y2="9" stroke="black" strokeWidth="0.5" strokeOpacity="0.15" className="dark:[stroke:white]" />
            <line x1="14" y1="14" x2="21" y2="9" stroke="black" strokeWidth="0.5" strokeOpacity="0.15" className="dark:[stroke:white]" />
            <line x1="14" y1="14" x2="7" y2="19" stroke="black" strokeWidth="0.5" strokeOpacity="0.15" className="dark:[stroke:white]" />
            <line x1="14" y1="14" x2="21" y2="19" stroke="black" strokeWidth="0.5" strokeOpacity="0.15" className="dark:[stroke:white]" />
          </svg>
          <div>
            <h1 className="text-sm font-semibold leading-none text-[#0a0a1a] dark:text-white">Solana Atlas</h1>
            <p className="hidden text-[10px] text-[#0a0a1a]/40 mt-0.5 sm:block dark:text-white/30">1001 terms · 14 categories</p>
          </div>
        </div>

        <div className="flex-1 flex justify-center min-w-0 px-2 sm:px-4">
          <div className="w-full max-w-sm sm:max-w-md">
            <SearchBar />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-8">
          <a
            href="https://github.com/solanabr/solana-glossary"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-xs text-[#0a0a1a]/30 transition-colors hover:text-[#0a0a1a]/70 sm:flex dark:text-white/30 dark:hover:text-white/60"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </header>

      <div className="h-full w-full">
        <GraphCanvas />
      </div>

      <Legend />

      <TermPanel />
    </div>
  );
}

