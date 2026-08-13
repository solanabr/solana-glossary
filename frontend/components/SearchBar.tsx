"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UIStrings } from "@/lib/i18n";

interface Props {
  ui: UIStrings;
  initialQuery?: string;
}

export function SearchBar({ ui, initialQuery = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with URL on back/forward
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(q), 250);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setValue("");
      push("");
    }
  }

  return (
    <div className="relative w-full">
      {/* Search icon */}
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </span>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={ui.searchPlaceholder}
        className="w-full pl-11 pr-10 py-3 rounded-xl bg-card border border-base text-base placeholder:text-muted focus:outline-none focus:ring-2 ring-accent transition-all text-sm"
        autoFocus
        autoComplete="off"
        spellCheck={false}
      />

      {value && (
        <button
          onClick={() => { setValue(""); push(""); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-base transition-colors"
          aria-label="Clear"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  );
}
