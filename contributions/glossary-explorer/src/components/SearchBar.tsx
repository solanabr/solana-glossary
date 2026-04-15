"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { useLocale } from "@/contexts/LocaleContext";
import type { GlossaryTerm } from "@/lib/types";

interface SearchBarProps {
  terms: GlossaryTerm[];
  placeholder?: string;
  autoFocus?: boolean;
  large?: boolean;
}

export default function SearchBar({
  terms,
  placeholder,
  autoFocus = false,
  large = false,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { copy, getCategoryMeta, localizeTerm } = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlossaryTerm[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const localizedTerms = useMemo(
    () => terms.map((term) => localizeTerm(term)),
    [localizeTerm, terms],
  );

  const fuse = useMemo(
    () =>
      new Fuse(localizedTerms, {
        keys: [
          { name: "term", weight: 2 },
          { name: "id", weight: 1.5 },
          { name: "aliases", weight: 1.5 },
          { name: "definition", weight: 0.5 },
        ],
        threshold: 0.3,
        includeScore: true,
      }),
    [localizedTerms],
  );

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, []);

  function navigateToTerm(id: string) {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/term/${id}`);
  }

  function handleSearch(value: string) {
    setQuery(value);
    setSelectedIndex(0);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    setResults(fuse.search(value, { limit: 8 }).map((match) => match.item));
  }

  return (
    <div className="relative w-full">
      <div
        className={`gradient-border flex items-center rounded-2xl bg-card ${
          large ? "px-5 py-4" : "px-4 py-3"
        } ${isOpen && results.length > 0 ? "rounded-b-none" : ""}`}
      >
        <svg
          className={`mr-3 shrink-0 text-muted ${large ? "h-5 w-5" : "h-4 w-4"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => handleSearch(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setSelectedIndex((current) =>
                Math.min(current + 1, results.length - 1),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setSelectedIndex((current) => Math.max(current - 1, 0));
            } else if (event.key === "Enter" && results[selectedIndex]) {
              navigateToTerm(results[selectedIndex].id);
            }
          }}
          placeholder={placeholder ?? copy.search.placeholder}
          autoFocus={autoFocus}
          className={`w-full bg-transparent font-mono outline-none placeholder:text-muted/50 ${
            large ? "text-lg" : "text-sm"
          }`}
        />

        <kbd className="hidden items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] text-muted sm:inline-flex">
          <span>⌘K</span>
        </kbd>
      </div>

      {isOpen && results.length > 0 ? (
        <div className="absolute left-0 right-0 z-50 overflow-hidden rounded-b-2xl border border-t-0 border-border bg-[#111111] shadow-2xl">
          {results.map((term, index) => {
            const category = getCategoryMeta(term.category);

            return (
              <button
                key={term.id}
                type="button"
                onMouseDown={() => navigateToTerm(term.id)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors ${
                  index === selectedIndex ? "bg-card-hover" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {term.term}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${category.color}22`,
                        color: category.color,
                      }}
                    >
                      {category.label}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {term.definition}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
