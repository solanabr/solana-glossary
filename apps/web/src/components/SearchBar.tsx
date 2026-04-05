"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
  label?: string;
  fuzzyHint?: string;
  clearAriaLabel?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Buscar termos...",
  resultCount,
  totalCount,
  label,
  fuzzyHint,
  clearAriaLabel = "Clear",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, 100);
    },
    [onChange],
  );

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      const tag = document.activeElement?.tagName ?? "";
      if (
        e.key === "/" &&
        tag !== "INPUT" &&
        tag !== "TEXTAREA" &&
        tag !== "SELECT"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const hasValue = localValue.length > 0;
  const showCount = resultCount !== undefined && totalCount !== undefined;

  return (
    <div className="w-full search-bar-scope">
      {label && (
        <span className="block text-[11px] font-medium tracking-wide text-sol-subtle uppercase mb-2">
          {label}
        </span>
      )}

      <div
        className={`
          relative flex items-center
          rounded-xl border transition-colors duration-200
          ${
            isFocused
              ? "border-sol-line-strong bg-sol-surface-elevated"
              : "border-sol-line bg-sol-surface hover:border-sol-muted"
          }
        `}
      >
        <div className="pl-3.5 pr-2 flex-shrink-0">
          <svg
            className={`w-4 h-4 text-sol-subtle transition-colors ${isFocused ? "text-sol-text" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="
            flex-1 bg-transparent py-3 pr-2
            text-sol-text placeholder:text-sol-muted/70
            text-[15px] leading-snug
            outline-none focus-visible:outline-none
          "
          aria-label={label ?? placeholder}
          autoComplete="off"
          spellCheck="false"
        />

        {showCount && (
          <div className="pr-3 flex-shrink-0 tabular-nums">
            <span className="text-[11px] text-sol-subtle whitespace-nowrap">
              {hasValue ? (
                <span>
                  <span
                    className={
                      resultCount === 0 ? "text-red-400/90" : "text-sol-text"
                    }
                  >
                    {resultCount}
                  </span>
                  <span className="text-sol-muted">/{totalCount}</span>
                </span>
              ) : (
                <span className="text-sol-muted">{totalCount}</span>
              )}
            </span>
          </div>
        )}

        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="
              mr-2 p-1.5 rounded-lg flex-shrink-0
              text-sol-subtle hover:text-sol-text hover:bg-sol-surface
              transition-colors
            "
            aria-label={clearAriaLabel}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}

        {!isFocused && !hasValue && (
          <div className="mr-2 flex-shrink-0 hidden sm:flex items-center">
            <kbd className="px-1.5 py-0.5 text-[10px] tabular-nums bg-sol-surface text-sol-muted rounded border border-sol-line">
              /
            </kbd>
          </div>
        )}
      </div>

      {isFocused && localValue.length > 0 && fuzzyHint && (
        <p className="mt-2 ml-0.5 text-[12px] text-sol-subtle leading-relaxed">
          {fuzzyHint}
        </p>
      )}
    </div>
  );
}
