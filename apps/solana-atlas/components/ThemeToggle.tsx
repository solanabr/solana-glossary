"use client";

import { useAtlasStore } from "@/lib/store";

export default function ThemeToggle() {
  const { theme, setTheme } = useAtlasStore();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="flex cursor-pointer h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-black/5 text-[#0a0a1a]/50 transition-colors hover:text-[#0a0a1a]/80 dark:border-white/10 dark:bg-white/5 dark:text-white/40 dark:hover:text-white/70"
    >
      {theme === "dark" ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.22 3.22l1.06 1.06M11.72 11.72l1.06 1.06M12.78 3.22l-1.06 1.06M4.28 11.72l-1.06 1.06"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
