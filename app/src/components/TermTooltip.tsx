import { useState, useRef, useEffect } from "react";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { motion, AnimatePresence } from "framer-motion";
import { useGlossary } from "@/hooks/useGlossary";

interface TermTooltipProps {
  termId: string;
  children: React.ReactNode;
  onNavigate?: (term: GlossaryTerm) => void;
}

export function TermTooltip({
  termId,
  children,
  onNavigate,
}: TermTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const glossary = useGlossary();
  const term = glossary.getTerm(termId);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), 200);
  };

  const handleLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!term) return <>{children}</>;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span
        className="text-primary underline decoration-primary/30 underline-offset-2 cursor-pointer hover:decoration-primary transition-colors"
        onClick={() => onNavigate?.(term)}
      >
        {children}
      </span>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-card border border-border rounded-lg shadow-xl"
          >
            <p className="text-xs font-semibold text-foreground mb-1">
              {term.term}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {term.definition.slice(0, 150)}
              {term.definition.length > 150 ? "\u2026" : ""}
            </p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-card border-r border-b border-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
