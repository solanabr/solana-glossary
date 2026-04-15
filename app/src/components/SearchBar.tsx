import { useState, useRef, useEffect, useMemo } from "react";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useGlossary } from "@/hooks/useGlossary";
import { getCategoryBadgeClass } from "@/lib/category-colors";
import { dropdownReveal } from "@/lib/animations";

interface SearchBarProps {
  onSelect: (term: GlossaryTerm) => void;
  placeholder?: string;
}

export function SearchBar({ onSelect, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();
  const glossary = useGlossary();

  const resolvedPlaceholder = placeholder || t("search.placeholder");

  // Debounced search for performance with large term sets
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 100);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return glossary.searchTerms(debouncedQuery).slice(0, 20);
  }, [debouncedQuery, glossary]);

  useEffect(() => {
    setIsOpen(results.length > 0 && query.length > 0);
    setSelectedIndex(-1);
  }, [results, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      onSelect(results[selectedIndex]);
      setQuery("");
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={resolvedPlaceholder}
          className="w-full h-12 pl-11 pr-10 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            variants={dropdownReveal}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute z-50 top-full mt-2 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-80 overflow-y-auto scrollbar-thin"
          >
            {results.map((term, i) => (
              <button
                key={term.id}
                onClick={() => {
                  onSelect(term);
                  setQuery("");
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-start gap-3 transition-colors ${
                  i === selectedIndex
                    ? "bg-surface-hover"
                    : "hover:bg-surface-elevated"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground truncate">
                      {term.term}
                    </span>
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getCategoryBadgeClass(term.category)}`}
                    >
                      {term.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {term.definition.slice(0, 100)}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
