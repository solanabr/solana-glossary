import { useState, useMemo, useCallback, useRef } from "react";
import { CategoryGrid } from "@/components/CategoryGrid";
import { TermCard } from "@/components/TermCard";
import { TermDetail } from "@/components/TermDetail";
import { SmartHeroInput } from "@/components/SmartHeroInput";
import type { GlossaryTerm, Category } from "@stbr/solana-glossary";
import { AnimatePresence } from "framer-motion";
import { Zap, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useGlossary } from "@/hooks/useGlossary";

const ITEMS_PER_PAGE = 60;

const Index = () => {
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const glossarySectionRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const { t } = useI18n();
  const glossary = useGlossary();

  const terms = useMemo(() => {
    return activeCategory
      ? glossary.getTermsByCategory(activeCategory)
      : glossary.getAllTerms();
  }, [activeCategory, glossary]);

  const handleSelectTerm = useCallback((term: GlossaryTerm | null) => {
    setSelectedTerm(term);
    if (term && glossarySectionRef.current) {
      glossarySectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const visibleTerms = useMemo(
    () => terms.slice(0, visibleCount),
    [terms, visibleCount],
  );

  const handleCategoryChange = (cat: Category | null) => {
    setActiveCategory(cat);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const categoryTitle = activeCategory
    ? `${t(`cat.${activeCategory}` as any) || activeCategory} ${t("category.terms_suffix")}`
    : t("category.all_terms");

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(162_72%_46%_/_0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(262_60%_58%_/_0.05),_transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10 relative">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium mb-4 border border-primary/20">
              <Zap className="h-3 w-3" />
              {glossary.allTerms.length} {t("hero.badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3 tracking-tight leading-tight">
              {t("hero.title.before")}{" "}
              <span className="gradient-text">{t("hero.title.solana")}</span>{" "}
              {t("hero.title.after")}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
              {t("hero.subtitle")}
            </p>
          </div>

          <SmartHeroInput onSelectTerm={handleSelectTerm} />
        </div>
      </section>

      {/* Content */}
      <section
        id="glossary"
        ref={glossarySectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 scroll-mt-14"
      >
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-primary" />
            {t("category.categories")}
          </h2>
          <CategoryGrid
            onSelectCategory={handleCategoryChange}
            activeCategory={activeCategory}
          />
        </div>

        <div className="flex gap-6">
          {/* Terms grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                {categoryTitle}
              </h2>
              <span className="text-xs text-muted-foreground">
                {terms.length} {t("category.terms_count")}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {visibleTerms.map((term, i) => (
                <TermCard
                  key={term.id}
                  term={term}
                  onClick={handleSelectTerm}
                  index={i}
                />
              ))}
            </div>
            {visibleCount < terms.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  className="px-6 py-2 rounded-lg bg-secondary border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-all"
                >
                  {t("category.load_more")} ({terms.length - visibleCount}{" "}
                  {t("category.remaining")})
                </button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selectedTerm && (
              <div className="hidden lg:block w-96 shrink-0">
                <div className="sticky top-[4.5rem] h-[calc(100vh-5rem)]">
                  <TermDetail
                    term={selectedTerm}
                    onClose={() => setSelectedTerm(null)}
                    onNavigate={handleSelectTerm}
                  />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default Index;
