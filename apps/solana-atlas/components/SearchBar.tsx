"use client";

import { useCallback, useRef, useEffect } from "react";
import { searchTerms } from "@/lib/glossary";
import { useAtlasStore } from "@/lib/store";

export default function SearchBar() {
  const { searchQuery, setSearchQuery, setSelectedTerm } = useAtlasStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSearchQuery]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  const resultCount = searchQuery.trim()
    ? searchTerms(searchQuery).length
    : null;

  return (
    <div className="relative flex w-full items-center gap-2">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a0a1a]/30 dark:text-white/30"
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search terms…"
          value={searchQuery}
          onChange={handleChange}
          className="
            h-9 w-full rounded-lg border border-black/10 bg-black/5
            pl-9 pr-8 text-sm text-[#0a0a1a] placeholder-[#0a0a1a]/30
            outline-none focus:border-[#9945FF] focus:ring-1 focus:ring-[#9945FF]/40
            transition-all
            dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/30
          "
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden text-[10px] text-[#0a0a1a]/20 select-none sm:block dark:text-white/20">
          ⌘K
        </span>
      </div>
      {resultCount !== null && (
        <span className="hidden text-xs text-[#0a0a1a]/40 sm:block dark:text-white/40">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
