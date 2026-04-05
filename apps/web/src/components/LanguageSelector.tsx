"use client";

import { useState, useRef, useEffect } from "react";
import { type Locale } from "@/lib/glossary";

interface LanguageSelectorProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
  label?: string;
  activeLabel?: string;
}

const LANGUAGES: {
  code: Locale;
  /** Short code shown in the trigger and list (matches URL locale). */
  short: string;
  flag: string;
  native: string;
}[] = [
  { code: "pt-BR", short: "pt-BR", flag: "🇧🇷", native: "Português (BR)" },
  { code: "en", short: "en", flag: "🇺🇸", native: "English" },
  { code: "es", short: "es", flag: "🇪🇸", native: "Español" },
];

export default function LanguageSelector({
  locale,
  onChange,
  label,
  activeLabel = "Active",
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (code: Locale) => {
    onChange(code);
    setOpen(false);
    try {
      localStorage.setItem("sol-glossary-locale", code);
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      {label && (
        <span className="mb-1 block text-xs font-mono uppercase tracking-wider text-sol-subtle">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${current.native} (${current.short})`}
        className={`
          flex shrink-0 items-center gap-1 rounded-md border-0 bg-transparent
          px-1.5 py-1 text-sol-subtle outline-none transition-colors duration-200
          hover:bg-white/[0.06] hover:text-sol-text
          focus-visible:ring-2 focus-visible:ring-sol-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sol-darker
          sm:gap-1.5 sm:px-2 sm:py-1.5
          ${open ? "bg-white/[0.08] text-sol-text" : ""}
        `}
      >
        <span
          className="shrink-0 text-sm leading-none sm:text-base"
          aria-hidden
        >
          {current.flag}
        </span>
        <span className="shrink-0 text-[11px] font-semibold tabular-nums sm:text-xs">
          {current.short}
        </span>
        <svg
          className={`h-3 w-3 shrink-0 text-sol-muted transition-transform duration-200 sm:h-3.5 sm:w-3.5 ${open ? "rotate-180 text-sol-subtle" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label ?? "Language"}
          className="
            absolute right-0 z-50 mt-1.5 w-max min-w-[5.5rem]
            overflow-hidden rounded-lg border border-sol-line bg-sol-surface-elevated
            shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65)]
            animate-fade-in
          "
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={lang.code === locale}
              aria-label={lang.native}
              onClick={() => handleSelect(lang.code)}
              className={`
                flex w-full items-center gap-2 px-2.5 py-2 text-left text-[12px]
                transition-colors duration-150 sm:px-3 sm:py-2.5 sm:text-[13px]
                ${
                  lang.code === locale
                    ? "bg-sol-accent-muted text-sol-accent"
                    : "text-sol-text hover:bg-sol-surface"
                }
              `}
            >
              <span className="text-sm leading-none sm:text-base">
                {lang.flag}
              </span>
              <span className="font-semibold tabular-nums">{lang.short}</span>
              {lang.code === locale && (
                <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-sol-subtle sm:text-[11px]">
                  <span className="sr-only">{activeLabel}</span>
                  <span aria-hidden>✓</span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
