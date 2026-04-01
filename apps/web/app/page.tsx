"use client";
import { useState } from "react";
import { getTermsByCategory, getFeaturedTerm, getAllCategories } from "@/lib/glossary";
import { useLocale } from "@/lib/i18n";
import type { Category } from "@/lib/glossary";
import Sidebar from "@/components/Sidebar";
import FeaturedCard from "@/components/FeaturedCard";
import MiniCard from "@/components/MiniCard";
import SearchModal, { useSearchModal } from "@/components/SearchModal";

export default function HomePage() {
  const { locale } = useLocale();
  const [activeCategory, setActiveCategory] = useState<Category>("defi");
  const { open, setOpen } = useSearchModal();

  const featured = getFeaturedTerm(activeCategory, locale);
  const others = getTermsByCategory(activeCategory, locale)
    .filter((t) => t.id !== featured.id)
    .slice(0, 6);

  return (
    <>
      <SearchModal open={open} onClose={() => setOpen(false)} />

      {/* Hero */}
      <section className="px-6 py-8 border-b border-border">
        <h1 className="font-heading font-black text-3xl tracking-tight text-text mb-1">
          O Glossário da Solana
        </h1>
        <p className="text-[13px] text-text-muted mb-5">
          1001 termos · 14 categorias · 3 idiomas
        </p>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-between w-full max-w-md bg-bg-card border border-border rounded-full px-4 py-2 text-left hover:border-accent/30 transition-colors"
        >
          <span className="text-[12px] text-text-dim">
            ⌕ buscar termos, conceitos, protocolos...
          </span>
          <kbd className="text-[10px] text-text-dim border border-border px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>
      </section>

      {/* Body: sidebar + content */}
      <div className="flex min-h-[calc(100vh-180px)]">
        <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

        <div className="flex-1 p-4 overflow-y-auto">
          <FeaturedCard term={featured} locale={locale} />

          <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">
            Mais em {activeCategory.replace(/-/g, " ")} →
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {others.map((term) => (
              <MiniCard key={term.id} term={term} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats footer */}
      <footer className="grid grid-cols-3 border-t border-border">
        {(
          [
            ["1001", "Termos"],
            ["14", "Categorias"],
            ["3", "Idiomas"],
          ] as const
        ).map(([n, l]) => (
          <div key={l} className="text-center py-4 border-r border-border last:border-r-0">
            <span className="block font-heading font-black text-2xl text-accent">{n}</span>
            <span className="text-[10px] text-text-dim uppercase tracking-widest">{l}</span>
          </div>
        ))}
      </footer>
    </>
  );
}
