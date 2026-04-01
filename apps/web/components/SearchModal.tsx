"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { searchTerms, getAllTerms } from "@/lib/glossary";
import { useLocale } from "@/lib/i18n";
import type { GlossaryTerm } from "@/lib/glossary";
import Fuse from "fuse.js";

export function useSearchModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlossaryTerm[]>([]);

  const search = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      let res = searchTerms(q, locale);
      if (res.length === 0) {
        const fuse = new Fuse(getAllTerms(locale), {
          keys: ["term", "aliases", "id"],
          threshold: 0.4,
        });
        res = fuse.search(q).map((r) => r.item);
      }
      setResults(res.slice(0, 15));
    },
    [locale]
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-24"
      onClick={onClose}
    >
      <div
        className="bg-bg border border-border-strong rounded w-full max-w-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <span className="text-text-muted text-sm">⌕</span>
          <input
            autoFocus
            type="text"
            placeholder="Buscar termos, conceitos, protocolos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-text text-sm outline-none placeholder:text-text-dim"
          />
          <kbd className="text-[10px] text-text-dim border border-border px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        </div>

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto scrollbar-hide">
            {results.map((term) => (
              <li key={term.id}>
                <Link
                  href={`/term/${term.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-card transition-colors"
                >
                  <span className="text-[9px] text-green font-bold uppercase w-20 shrink-0 truncate">
                    {term.category.replace(/-/g, " ")}
                  </span>
                  <span className="text-sm text-text font-medium">{term.term}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {query && results.length === 0 && (
          <p className="px-4 py-3 text-sm text-text-dim">
            Nenhum resultado para &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
