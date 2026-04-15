"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  useId,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  clearCache,
  getTerms,
  getCategories,
  filterByCategories,
  shuffle,
  UI_LABELS,
  formatUi,
  type GlossaryTerm,
  type Locale,
} from "@/lib/glossary";

import Flashcard from "@/components/Flashcard";
import CategoryFilter from "@/components/CategoryFilter";
import LanguageSelector from "@/components/LanguageSelector";
import {
  celebrateFlashcardKnown,
  type ConfettiViewportOrigin,
} from "@/lib/flashcard-confetti";

function FlashcardsContent() {
  const searchParams = useSearchParams();

  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [allTerms, setAllTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<GlossaryTerm[]>([]);
  const [current, setCurrent] = useState(0);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [knownHistory, setKnownHistory] = useState<GlossaryTerm[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [studyActionsVisible, setStudyActionsVisible] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [confettiEnabled, setConfettiEnabled] = useState(true);
  const confettiToggleLabelId = useId();

  const t = UI_LABELS[locale];

  useEffect(() => {
    const langMap: Record<Locale, string> = {
      "pt-BR": "pt-BR",
      en: "en",
      es: "es",
    };
    document.documentElement.lang = langMap[locale];
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    getTerms(locale)
      .then((data) => {
        if (!cancelled) {
          setAllTerms(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllTerms([]);
          setLoading(false);
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "sol-glossary-locale",
      ) as Locale | null;
      if (saved && ["pt-BR", "en", "es"].includes(saved)) setLocale(saved);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem("sol-glossary-flash-confetti");
      if (v === "0") setConfettiEnabled(false);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  useEffect(() => {
    const cats = searchParams.get("cats");
    if (cats) setSelectedCategories(cats.split(","));
  }, [searchParams]);

  useEffect(() => {
    if (allTerms.length === 0) return;
    const filtered = filterByCategories(allTerms, selectedCategories);
    setDeck(shuffle(filtered));
    setCurrent(0);
    setKnownIds(new Set());
    setKnownHistory([]);
    setSessionComplete(false);
  }, [allTerms, selectedCategories]);

  const categories = useMemo(() => getCategories(allTerms), [allTerms]);

  const goNext = useCallback(() => {
    if (current < deck.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setSessionComplete(true);
    }
  }, [current, deck.length]);

  const goPrev = useCallback(() => {
    if (current > 0) setCurrent((c) => c - 1);
  }, [current]);

  const handleKnown = useCallback(
    (origin: ConfettiViewportOrigin) => {
      if (confettiEnabled) celebrateFlashcardKnown(origin);
      const term = deck[current];
      if (term?.id) {
        setKnownIds((prev) => {
          const next = new Set(prev);
          next.add(term.id);
          return next;
        });
        setKnownHistory((prev) =>
          prev.some((x) => x.id === term.id) ? prev : [...prev, term],
        );
      }
      goNext();
    },
    [deck, current, goNext, confettiEnabled],
  );

  const toggleConfetti = useCallback(() => {
    setConfettiEnabled((on) => {
      const next = !on;
      try {
        localStorage.setItem("sol-glossary-flash-confetti", next ? "1" : "0");
      } catch {
        /* localStorage unavailable */
      }
      return next;
    });
  }, []);

  const handleSkip = useCallback(() => {
    goNext();
  }, [goNext]);

  const restartSession = useCallback(() => {
    setDeck(shuffle(filterByCategories(allTerms, selectedCategories)));
    setCurrent(0);
    setKnownIds(new Set());
    setKnownHistory([]);
    setSessionComplete(false);
  }, [allTerms, selectedCategories]);

  const restartUnknown = useCallback(() => {
    const unknown = deck.filter((x) => !knownIds.has(x.id));
    setDeck(shuffle(unknown));
    setCurrent(0);
    setKnownIds(new Set());
    setKnownHistory([]);
    setSessionComplete(false);
  }, [deck, knownIds]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (studyActionsVisible) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, studyActionsVisible]);

  const currentTerm = deck[current];
  const knownCount = knownIds.size;
  const deckLength = deck.length;
  const reviewCount = deckLength - knownCount;
  const clearLabel = t.category_clear;

  const twitterShareUrl = useMemo(() => {
    if (knownCount <= 0) return "";
    const base = (process.env.BASE_URL ?? "").replace(/\/$/, "");
    if (!base) return "";
    const path =
      selectedCategories.length > 0
        ? `/flashcards?cats=${selectedCategories.join(",")}`
        : "/flashcards";
    const sharePageUrl = `${base}${path}`;
    const text = formatUi(UI_LABELS[locale].flash_share_text, {
      n: knownCount,
    });
    const q = new URLSearchParams({ text, url: sharePageUrl });
    return `https://twitter.com/intent/tweet?${q.toString()}`;
  }, [knownCount, selectedCategories, locale]);

  return (
    <div className="min-h-screen flex flex-col app-surface">
      <header className="sticky top-0 z-40 border-b border-sol-line bg-sol-darker/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-[3.5rem] flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sol-subtle hover:text-sol-text text-[13px] font-medium shrink-0"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="truncate">{t.glossary}</span>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline text-[10px] font-medium tracking-[0.2em] uppercase text-sol-accent truncate">
              {t.flash_study_zone}
            </span>
            <span className="font-display text-[0.95rem] sm:text-base font-semibold text-sol-text truncate">
              {t.flashcard_mode}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`
                p-2 rounded-lg border text-[13px] transition-colors
                ${
                  showConfig
                    ? "border-sol-accent/40 bg-sol-accent-muted text-sol-accent"
                    : "border-sol-line text-sol-subtle hover:text-sol-text hover:border-sol-line-strong"
                }
              `}
              aria-label={t.flash_config_title}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
            </button>
            <button
              type="button"
              aria-pressed={confettiEnabled}
              aria-label={t.flash_confetti_aria}
              title={t.flash_confetti}
              onClick={toggleConfetti}
              className={`
                p-2 rounded-lg border text-[13px] transition-colors
                ${
                  confettiEnabled
                    ? "border-sol-accent/45 bg-sol-accent-muted text-sol-accent"
                    : "border-sol-line text-sol-subtle hover:text-sol-text hover:border-sol-line-strong"
                }
              `}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 4 5 20h14L12 4z" />
                <path d="M8.5 15h7" />
                <circle
                  cx="18"
                  cy="8"
                  r="1.25"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="20"
                  cy="12"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="5"
                  cy="10"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="7"
                  cy="6"
                  r="0.85"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </button>
            <LanguageSelector
              locale={locale}
              onChange={setLocale}
              activeLabel={t.lang_active}
            />
          </div>
        </div>
      </header>

      {showConfig && (
        <div className="border-b border-sol-line bg-sol-surface-elevated/90 animate-slide-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h3 className="text-sm font-display font-semibold text-sol-text">
                {t.flash_config_title}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setDeck(
                    shuffle(filterByCategories(allTerms, selectedCategories)),
                  );
                  setCurrent(0);
                  setKnownIds(new Set());
                  setKnownHistory([]);
                  setSessionComplete(false);
                  setShowConfig(false);
                }}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-sol-accent text-sol-darker hover:opacity-90 transition-opacity"
              >
                {t.flash_apply}
              </button>
            </div>
            <CategoryFilter
              categories={categories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              clearLabel={clearLabel}
              emptyLabel={t.no_categories}
            />
          </div>
        </div>
      )}

      {!loading && !loadError && deckLength > 0 && !sessionComplete && (
        <div className="border-b border-sol-line py-2.5 bg-sol-darker/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-sol-subtle">
              <span>
                {t.flash_deck}:{" "}
                <strong className="text-sol-text tabular-nums">
                  {deckLength}
                </strong>{" "}
                {t.flash_cards}
              </span>
              <span>
                {t.flash_known}:{" "}
                <strong className="text-sol-accent tabular-nums">
                  {knownCount}
                </strong>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={restartSession}
                className="text-[12px] font-medium text-sol-subtle hover:text-sol-text transition-colors"
              >
                {t.flash_restart}
              </button>
              <button
                type="button"
                onClick={() => setDeck(shuffle([...deck]))}
                className="text-[12px] font-medium text-sol-accent hover:opacity-80 transition-opacity"
              >
                {t.shuffle}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        {loading && (
          <div className="flex items-center justify-center h-56 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-sol-accent border-t-transparent animate-spin" />
            <span className="text-[13px] text-sol-subtle">{t.loading}</span>
          </div>
        )}

        {!loading && loadError && (
          <div
            className="rounded-xl border border-sol-line bg-sol-surface px-4 py-8 text-center max-w-md mx-auto"
            role="alert"
          >
            <p className="text-sm text-sol-subtle mb-4">{t.load_error}</p>
            <button
              type="button"
              onClick={() => {
                clearCache();
                setLoadError(false);
                setLoading(true);
                getTerms(locale)
                  .then((data) => {
                    setAllTerms(data);
                    setLoading(false);
                  })
                  .catch(() => {
                    setAllTerms([]);
                    setLoading(false);
                    setLoadError(true);
                  });
              }}
              className="text-[13px] font-medium px-4 py-2 rounded-lg border border-sol-line text-sol-text hover:border-sol-accent/40 hover:text-sol-accent transition-colors"
            >
              {t.retry}
            </button>
          </div>
        )}

        {!loading && !loadError && deckLength === 0 && (
          <div className="text-center py-16">
            <h3 className="text-lg font-display font-semibold text-sol-text mb-2">
              {t.flash_empty_title}
            </h3>
            <p className="text-sol-subtle text-sm mb-6 max-w-sm mx-auto">
              {t.flash_empty_hint}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategories([]);
                setShowConfig(false);
              }}
              className="text-[13px] font-medium px-4 py-2 rounded-lg border border-sol-line text-sol-text hover:border-sol-accent/40 transition-colors"
            >
              {t.flash_use_all}
            </button>
          </div>
        )}

        {!loading && !loadError && sessionComplete && (
          <div className="text-center py-14">
            <h3 className="text-2xl font-display font-semibold text-sol-text mb-3">
              {t.flash_session_done}
            </h3>
            <p className="text-sol-subtle mb-2">
              {formatUi(t.flash_session_studied, { n: deckLength })}
            </p>
            <p className="text-sol-subtle mb-6">
              {formatUi(t.flash_known_review, {
                k: knownCount,
                r: reviewCount,
              })}
            </p>

            {knownHistory.length > 0 && twitterShareUrl && (
              <div className="w-full max-w-lg mx-auto rounded-xl border border-sol-line bg-sol-surface-elevated/80 px-4 py-3 mb-8 text-left">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-sol-subtle mb-2">
                  {t.flash_known_history}
                </h3>
                <ul className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 mb-0">
                  {knownHistory.map((term) => (
                    <li
                      key={term.id}
                      className="text-[11px] px-2 py-1 rounded-md bg-sol-surface border border-sol-line text-sol-text max-w-full truncate"
                      title={term.term}
                    >
                      {term.term}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-sol-line flex justify-end">
                  <a
                    href={twitterShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[12px] font-medium text-sol-subtle hover:text-sol-text transition-colors text-right"
                  >
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    {t.flash_share_twitter}
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={restartSession}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-sol-line text-[13px] font-medium text-sol-subtle hover:text-sol-text transition-colors"
              >
                {t.flash_redo}
              </button>
              {reviewCount > 0 && (
                <button
                  type="button"
                  onClick={restartUnknown}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-sol-accent-muted border border-sol-accent/35 text-sol-accent text-[13px] font-semibold hover:bg-[rgba(20,241,149,0.16)] transition-colors"
                >
                  {formatUi(t.flash_review_unknown, { n: reviewCount })}
                </button>
              )}
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-sol-accent text-sol-darker text-[13px] font-semibold text-center hover:opacity-90 transition-opacity"
              >
                {t.flash_back}
              </Link>
            </div>
          </div>
        )}

        {!loading && !loadError && !sessionComplete && currentTerm && (
          <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex min-w-0 flex-col items-center gap-5">
              <Flashcard
                key={`${currentTerm.id}-${current}`}
                term={currentTerm}
                current={current + 1}
                total={deckLength}
                onKnown={handleKnown}
                onSkip={handleSkip}
                label={{
                  flip: t.flip_card,
                  flipBack: t.flip_back,
                  term: t.label_term,
                  definition: t.label_definition,
                  stillLearning: t.flash_still_learning,
                  iKnow: t.flash_i_know,
                }}
                onStudyActionsVisibleChange={setStudyActionsVisible}
              />

              <div className="w-full max-w-lg space-y-3">
                {!studyActionsVisible && (
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={current === 0}
                      className="
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      border border-sol-line text-sol-subtle text-[13px] font-medium
                      hover:border-sol-line-strong hover:text-sol-text
                      disabled:opacity-35 disabled:cursor-not-allowed transition-colors
                    "
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                      {t.previous}
                    </button>

                    <button
                      type="button"
                      onClick={goNext}
                      className="
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      border border-sol-accent/40 bg-sol-accent-muted text-sol-accent text-[13px] font-semibold
                      hover:border-sol-accent/60 transition-colors
                    "
                    >
                      {current === deckLength - 1 ? t.flash_finish : t.next}
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                )}

                {deckLength <= 12 && (
                  <div className="flex justify-center gap-1.5 px-1">
                    {deck.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrent(i)}
                        className={`
                          h-2 rounded-full transition-all duration-200
                          ${i === current ? "w-6 bg-sol-accent" : "w-2"}
                          ${i !== current && knownIds.has(deck[i]?.id ?? "") ? "bg-sol-accent/40" : ""}
                          ${i !== current && !knownIds.has(deck[i]?.id ?? "") ? "bg-sol-line hover:bg-sol-muted" : ""}
                        `}
                        aria-label={`${i + 1} / ${deckLength}`}
                      />
                    ))}
                  </div>
                )}

                {!studyActionsVisible && (
                  <p className="text-[11px] text-sol-muted text-center">
                    {t.flash_keys}
                  </p>
                )}
              </div>
            </section>

            <aside className="w-full rounded-xl border border-sol-line bg-sol-surface-elevated/80 px-4 py-3 lg:sticky lg:top-24">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-sol-subtle mb-2">
                {t.flash_known_history}
              </h3>
              {knownHistory.length === 0 ? (
                <p className="text-[12px] text-sol-muted leading-relaxed">
                  {t.flash_known_history_empty}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {knownHistory.map((term) => (
                    <li
                      key={term.id}
                      className="text-[11px] px-2 py-1 rounded-md bg-sol-surface border border-sol-line text-sol-text max-w-full truncate"
                      title={term.term}
                    >
                      {term.term}
                    </li>
                  ))}
                </ul>
              )}
              {knownCount > 0 && twitterShareUrl && (
                <div className="mt-3 pt-3 border-t border-sol-line flex justify-end">
                  <a
                    href={twitterShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[12px] font-medium text-sol-subtle hover:text-sol-text transition-colors text-right"
                  >
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    {t.flash_share_twitter}
                  </a>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen app-surface flex items-center justify-center gap-2 text-sol-subtle text-sm">
          <span className="w-5 h-5 rounded-full border-2 border-sol-accent border-t-transparent animate-spin inline-block" />
        </div>
      }
    >
      <FlashcardsContent />
    </Suspense>
  );
}
