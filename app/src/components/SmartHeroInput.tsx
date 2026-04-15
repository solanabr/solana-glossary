import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, Code2, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { useI18n } from "@/lib/i18n";
import { useGlossary } from "@/hooks/useGlossary";
import { dropdownScaleReveal } from "@/lib/animations";

interface SmartHeroInputProps {
  onSelectTerm: (term: GlossaryTerm) => void;
  onCodeDetected?: (code: string) => void;
}

const PLACEHOLDER_TERMS = [
  "PDA",
  "Turbine",
  "Proof of History",
  "Validator",
  "SPL Token",
  "Anchor",
];

function looksLikeCode(text: string): boolean {
  const codePatterns = [
    /^(use |pub |fn |let |const |import |export |async |await )/m,
    /[{};]\s*$/m,
    /#\[.*\]/,
    /=>/,
    /\(\s*ctx\s*:/,
    /declare_id!/,
    /msg!/,
    /anchor_lang/,
    /solana_program/,
    /pub struct /,
    /impl /,
  ];
  if (text.split("\n").length > 3) return true;
  return codePatterns.some((p) => p.test(text));
}

export function SmartHeroInput({
  onSelectTerm,
  onCodeDetected,
}: SmartHeroInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isCodeDetected, setIsCodeDetected] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useI18n();
  const glossary = useGlossary();

  // Animated placeholder
  useEffect(() => {
    let termIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const currentTerm = PLACEHOLDER_TERMS[termIdx];
      if (!isDeleting) {
        charIdx++;
        setPlaceholderText(currentTerm.slice(0, charIdx));
        if (charIdx === currentTerm.length) {
          timeout = setTimeout(() => {
            isDeleting = true;
            tick();
          }, 1800);
          return;
        }
        timeout = setTimeout(tick, 80);
      } else {
        charIdx--;
        setPlaceholderText(currentTerm.slice(0, charIdx));
        if (charIdx === 0) {
          isDeleting = false;
          termIdx = (termIdx + 1) % PLACEHOLDER_TERMS.length;
          timeout = setTimeout(tick, 400);
          return;
        }
        timeout = setTimeout(tick, 40);
      }
    };

    timeout = setTimeout(tick, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Code detection
  useEffect(() => {
    setIsCodeDetected(looksLikeCode(query));
  }, [query]);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 120);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    if (isCodeDetected || !debouncedQuery.trim()) return [];
    return glossary.searchTerms(debouncedQuery).slice(0, 8);
  }, [debouncedQuery, glossary, isCodeDetected]);

  useEffect(() => {
    setIsOpen(results.length > 0 && query.length > 0 && !isCodeDetected);
    setSelectedIndex(-1);
  }, [results, query, isCodeDetected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isCodeDetected) {
        handleExplainCode();
      } else if (selectedIndex >= 0) {
        onSelectTerm(results[selectedIndex]);
        setQuery("");
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleExplainCode = useCallback(() => {
    onCodeDetected?.(query);
  }, [query, onCodeDetected]);

  const dynamicPlaceholder = query
    ? ""
    : `${t("hero.input_placeholder")} "${placeholderText}|"`;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Glow effect behind input */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 blur-xl opacity-60 animate-pulse-glow" />

      <div className="relative">
        <div className="relative group">
          <div className="absolute left-4 top-4 text-muted-foreground">
            {isCodeDetected ? (
              <Code2 className="h-5 w-5 text-accent" />
            ) : (
              <Search className="h-5 w-5 group-focus-within:text-primary transition-colors" />
            )}
          </div>
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder={dynamicPlaceholder}
            rows={
              query.split("\n").length > 1
                ? Math.min(query.split("\n").length, 6)
                : 1
            }
            className="w-full min-h-[56px] max-h-[200px] pl-12 pr-4 py-4 bg-card/80 backdrop-blur-sm border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all text-sm resize-none font-sans focus:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)]"
            style={{
              fontFamily: isCodeDetected
                ? "'JetBrains Mono', monospace"
                : undefined,
            }}
          />
        </div>

        {/* Code detected banner */}
        <AnimatePresence>
          {isCodeDetected && query.length > 10 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2"
            >
              <button
                onClick={handleExplainCode}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-all group"
              >
                <Sparkles className="h-4 w-4" />
                {t("hero.code_detected")}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search results dropdown */}
        <AnimatePresence>
          {isOpen && results.length > 0 && (
            <motion.div
              variants={dropdownScaleReveal}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute z-50 top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto scrollbar-thin"
            >
              {results.map((term, i) => (
                <button
                  key={term.id}
                  onClick={() => {
                    onSelectTerm(term);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-all ${
                    i === selectedIndex
                      ? "bg-primary/10"
                      : "hover:bg-surface-elevated"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {term.term}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {term.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {term.definition.slice(0, 120)}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper text */}
      <p className="text-center text-xs text-muted-foreground/60 mt-3">
        {t("hero.helper_text")}
      </p>
    </div>
  );
}
