import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  lazy,
  Suspense,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CategoryGrid } from "@/components/CategoryGrid";
import { TermCard } from "@/components/TermCard";
import { SmartHeroInput } from "@/components/SmartHeroInput";
import {
  GlossaryTerm,
  Category,
  getCategories,
  type Depth,
} from "@stbr/solana-glossary";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, Search, ArrowUpDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useGlossary } from "@/hooks/useGlossary";

// Split out of the home chunk — pulls in react-markdown + quiz/apply and only
// renders once a term is opened via /t/:id.
const TermPageModal = lazy(() =>
  import("@/components/TermPageModal").then((m) => ({
    default: m.TermPageModal,
  })),
);

const ITEMS_PER_PAGE = 60;
const CATEGORY_SET = new Set<string>(getCategories());
const DEPTHS: Depth[] = [1, 2, 3, 4, 5];

type SortMode = "random" | "az" | "za" | "category";

/** Fisher–Yates over term ids — one stable shuffle per visit. */
function shuffledRank(ids: string[]): Map<string, number> {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return new Map(a.map((id, idx) => [id, idx]));
}

const Index = () => {
  const { id, category: categoryParam } = useParams<{
    id?: string;
    category?: string;
  }>();
  const navigate = useNavigate();
  const glossarySectionRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const { t } = useI18n();
  const glossary = useGlossary();

  // Route-driven state: /t/:id opens the term modal, /c/:category filters. The
  // URL is the single source of truth so canonical links, the back button, and
  // crawler meta all stay in sync.
  const selectedTerm = useMemo<GlossaryTerm | null>(
    () => (id ? (glossary.getTerm(id) ?? null) : null),
    [id, glossary],
  );
  const activeCategory = useMemo<Category | null>(
    () =>
      categoryParam && CATEGORY_SET.has(categoryParam)
        ? (categoryParam as Category)
        : null,
    [categoryParam],
  );

  const [depthFilter, setDepthFilter] = useState<Depth | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("random");
  // Stable per-visit shuffle so the default view surfaces different terms each
  // time without reordering under the user's cursor.
  const [shuffleRank] = useState(() =>
    shuffledRank(glossary.allTerms.map((term) => term.id)),
  );

  const terms = useMemo(() => {
    const base = activeCategory
      ? glossary.getTermsByCategory(activeCategory)
      : glossary.getAllTerms();
    const filtered = depthFilter
      ? base.filter((t) => t.depth === depthFilter)
      : base;
    const sorted = [...filtered];
    if (sortMode === "az") {
      sorted.sort((a, b) => a.term.localeCompare(b.term));
    } else if (sortMode === "za") {
      sorted.sort((a, b) => b.term.localeCompare(a.term));
    } else if (sortMode === "category") {
      sorted.sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.term.localeCompare(b.term),
      );
    } else {
      sorted.sort(
        (a, b) => (shuffleRank.get(a.id) ?? 0) - (shuffleRank.get(b.id) ?? 0),
      );
    }
    return sorted;
  }, [activeCategory, depthFilter, sortMode, shuffleRank, glossary]);

  // Reset paging when the filters change.
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [categoryParam, depthFilter, sortMode]);

  // Auto-load the next page when the sentinel under the grid scrolls near the
  // viewport (800px lookahead keeps scrolling seamless).
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + ITEMS_PER_PAGE, terms.length));
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [terms.length, visibleCount]);

  // Scroll the glossary into view when a term is opened via the route — but
  // only when the section is still below the viewport (e.g. arriving from the
  // hero or a fresh deep-link). If the user is already browsing the grid, the
  // sticky panel is visible and jumping the page is just disorienting.
  useEffect(() => {
    const section = glossarySectionRef.current;
    if (id && section && section.getBoundingClientRect().top > 80) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [id]);

  const openTerm = useCallback(
    (term: GlossaryTerm) => navigate(`/t/${term.id}`),
    [navigate],
  );
  const closeTerm = useCallback(() => navigate("/"), [navigate]);

  // Esc closes the term panel (drawer on desktop, overlay on mobile).
  useEffect(() => {
    if (!selectedTerm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTerm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTerm, closeTerm]);
  const handleCategoryChange = useCallback(
    (cat: Category | null) => navigate(cat ? `/c/${cat}` : "/"),
    [navigate],
  );

  const visibleTerms = useMemo(
    () => terms.slice(0, visibleCount),
    [terms, visibleCount],
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      {/* No overflow-hidden here — it would clip the search results dropdown;
          the decorative inset-0 gradients never overflow anyway. */}
      <section className="relative z-20">
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

          <SmartHeroInput onSelectTerm={openTerm} />
        </div>
      </section>

      {/* Content */}
      <section
        id="glossary"
        ref={glossarySectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 scroll-mt-14"
      >
        {id && !selectedTerm && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-foreground"
          >
            <span>
              {t("term.not_found")}{" "}
              <code className="text-xs text-muted-foreground">{id}</code>
            </span>
            <button
              onClick={closeTerm}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              {t("category.all_terms")}
            </button>
          </div>
        )}

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
            {/* Depth filter — SDK knowledge-depth rating, 1 (surface) → 5 (deep) —
                plus term count and list ordering */}
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div
                className="flex items-center gap-1.5 flex-wrap"
                role="group"
                aria-label={t("depth.label")}
              >
                <span
                  className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
                  title={t("depth.hint")}
                >
                  {t("depth.label")}
                </span>
                <button
                  onClick={() => setDepthFilter(null)}
                  aria-pressed={depthFilter === null}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                    depthFilter === null
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {t("depth.all")}
                </button>
                {DEPTHS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepthFilter(depthFilter === d ? null : d)}
                    aria-pressed={depthFilter === d}
                    title={`${t("depth.label")} ${d}`}
                    className={`w-7 py-1 rounded-md text-[11px] font-medium border transition-all ${
                      depthFilter === d
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground">
                  {terms.length} {t("category.terms_count")}
                </span>
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    aria-label={t("sort.label")}
                    className="bg-secondary border border-border rounded-md px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  >
                    <option value="random">{t("sort.random")}</option>
                    <option value="az">{t("sort.az")}</option>
                    <option value="za">{t("sort.za")}</option>
                    <option value="category">{t("sort.category")}</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {visibleTerms.map((term) => (
                <TermCard key={term.id} term={term} onClick={openTerm} />
              ))}
            </div>
            {visibleCount < terms.length && (
              <div
                ref={loadMoreRef}
                className="flex justify-center mt-6 py-3 text-xs text-muted-foreground"
              >
                {t("category.load_more")}… ({terms.length - visibleCount}{" "}
                {t("category.remaining")})
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Detail panel — desktop "side peek": a fixed drawer over the right
          edge (Linear/Notion pattern). The grid never reflows on open/close,
          the panel is always in the same place, and Esc dismisses it. */}
      <AnimatePresence>
        {selectedTerm && (
          <motion.aside
            key="term-drawer"
            initial={{ x: 64, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 64, opacity: 0 }}
            transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
            className="hidden lg:block fixed right-0 top-14 bottom-0 w-[26rem] z-40 border-l border-border bg-card shadow-2xl"
          >
            <Suspense fallback={null}>
              <TermPageModal
                term={selectedTerm}
                onClose={closeTerm}
                onNavigate={openTerm}
              />
            </Suspense>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Detail panel — full-screen overlay below lg (the sidebar is hidden
          there, so without this a tapped term or shared /t/:id link would
          show nothing on phones/tablets). */}
      {selectedTerm && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-3 overscroll-contain">
          <div className="h-full max-w-lg mx-auto">
            <Suspense fallback={null}>
              <TermPageModal
                term={selectedTerm}
                onClose={closeTerm}
                onNavigate={openTerm}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
