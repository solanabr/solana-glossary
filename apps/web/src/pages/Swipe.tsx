import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, Expand, Layers } from "lucide-react";
import { SwipeFeed } from "@/lib/swipe-feed";
import {
  categoryColors,
  categoryCardAccent,
  depthColors,
} from "@/lib/category-colors";
import { useGlossary } from "@/hooks/useGlossary";
import { useI18n } from "@/lib/i18n";

const RUNWAY = 2; // keep this many unseen cards rendered ahead of the user

const Swipe = () => {
  const glossary = useGlossary();
  const navigate = useNavigate();
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  // The feed engine tracks ids only; localized copies resolve at render time.
  const feedRef = useRef<SwipeFeed | null>(null);
  if (!feedRef.current) {
    feedRef.current = new SwipeFeed(glossary.allTerms);
  }

  // The swipe hint overlays the card footer on small screens — show it briefly.
  const [hintVisible, setHintVisible] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setHintVisible(false), 3500);
    return () => clearTimeout(id);
  }, []);

  const [cards, setCards] = useState<string[]>(() => {
    const feed = feedRef.current!;
    const first: string[] = [];
    for (let i = 0; i <= RUNWAY; i++) {
      const next = feed.next();
      if (next) first.push(next.id);
    }
    return first;
  });
  const [activeIdx, setActiveIdx] = useState(0);

  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const activeIdxRef = useRef(0);
  const activeSinceRef = useRef(performance.now());

  const commitDwell = useCallback(() => {
    const id = cardsRef.current[activeIdxRef.current];
    if (id) {
      feedRef.current!.recordDwell(
        id,
        performance.now() - activeSinceRef.current,
      );
    }
    activeSinceRef.current = performance.now();
  }, []);

  // Record the dwell on the card the user leaves the page on.
  useEffect(() => commitDwell, [commitDwell]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || el.clientHeight === 0) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    if (idx === activeIdxRef.current) return;
    commitDwell();
    activeIdxRef.current = idx;
    setActiveIdx(idx);
    if (idx >= cardsRef.current.length - RUNWAY) {
      const next = feedRef.current!.next();
      if (next) setCards((c) => [...c, next.id]);
    }
  }, [commitDwell]);

  // Arrow keys page through cards on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const el = containerRef.current;
      if (!el) return;
      e.preventDefault();
      el.scrollBy({
        top: e.key === "ArrowDown" ? el.clientHeight : -el.clientHeight,
        behavior: "smooth",
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A tapped related chip becomes the very next card.
  const queueRelated = useCallback((relId: string) => {
    const el = containerRef.current;
    if (!feedRef.current!.enqueue(relId)) return;
    const at = activeIdxRef.current + 1;
    setCards((c) => [...c.slice(0, at), relId, ...c.slice(at)]);
    requestAnimationFrame(() => {
      el?.scrollTo({ top: at * el.clientHeight, behavior: "smooth" });
    });
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100vh-3.5rem)] overflow-y-auto snap-y snap-mandatory overscroll-contain"
    >
      {cards.map((id) => {
        const term = glossary.getTerm(id);
        if (!term) return null;
        const related = (term.related ?? [])
          .map((rel) => glossary.getTerm(rel))
          .filter((rt): rt is NonNullable<typeof rt> => Boolean(rt))
          .slice(0, 6);
        return (
          <section
            key={id}
            className="h-full snap-start flex items-center justify-center px-4 py-4"
          >
            {/* Phones: the card hugs its content (capped at the viewport) so a
                short definition doesn't stretch into a screen-tall shell;
                sm+ keeps the uniform fixed-height card. */}
            <article
              className={`w-full max-w-lg max-h-full sm:h-full sm:max-h-[36rem] flex flex-col rounded-2xl border bg-card shadow-xl p-5 sm:p-6 ${categoryCardAccent[term.category] || "border-border"}`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${categoryColors[term.category] || "bg-muted text-muted-foreground"}`}
                >
                  {t(`cat.${term.category}`) || term.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${depthColors[term.depth] || "bg-secondary text-muted-foreground border-border"}`}
                  title={t("depth.hint")}
                >
                  <Layers className="h-2.5 w-2.5 inline mr-1" />
                  {t("depth.label")} {term.depth}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold gradient-text mt-3 mb-2 leading-tight">
                {term.term}
              </h2>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin text-sm text-muted-foreground leading-relaxed pr-1">
                {term.definition}
              </div>
              {related.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    {t("term.related")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {related.map((rt) => (
                      <button
                        key={rt.id}
                        onClick={() => queueRelated(rt.id)}
                        className="px-2 py-1 rounded-md bg-secondary border border-border text-[11px] text-foreground hover:text-primary hover:border-primary/30 transition-colors"
                      >
                        {rt.term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => navigate(`/t/${term.id}`)}
                className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Expand className="h-3.5 w-3.5" />
                {t("swipe.open")}
              </button>
            </article>
          </section>
        );
      })}

      {hintVisible && activeIdx === 0 && cards.length > 1 && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 border border-border text-[11px] text-muted-foreground backdrop-blur-sm animate-bounce">
          {t("swipe.hint")}
          <ArrowDown className="h-3 w-3" />
        </div>
      )}
    </div>
  );
};

export default Swipe;
