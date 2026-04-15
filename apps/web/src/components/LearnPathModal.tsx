"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import LearnTermDetailModal from "@/components/LearnTermDetailModal";
import { UI_LABELS, type GlossaryTerm, type Locale } from "@/lib/glossary";
import { useLearnPathRead } from "@/hooks/useLearnPathRead";
import { LEARN_PATH_STAGES, type LearnPathStageKey } from "@/lib/learn-path";
import {
  LEARN_FIRST_TERM_ID,
  LEARN_PATH_MODULE_COUNT,
  learnPathStatsLine,
  learnPathTruncatePreview,
  LEARN_STEP_BY_TERM_ID,
  stageCopy,
} from "@/lib/learn-path-ui";
import { graphPath } from "@/lib/url-lang";

type Props = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  pathTerms: GlossaryTerm[];
  termsLoading?: boolean;
};

export default function LearnPathModal({
  open,
  onClose,
  locale,
  pathTerms,
  termsLoading = false,
}: Props) {
  const t = UI_LABELS[locale];
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [openModule, setOpenModule] = useState<LearnPathStageKey>(
    LEARN_PATH_STAGES[0]!.key,
  );
  const [termDetailId, setTermDetailId] = useState<string | null>(null);

  const { isRead, toggleRead, hydrated } = useLearnPathRead();

  const termById = useMemo(() => {
    const m = new Map<string, GlossaryTerm>();
    for (const term of pathTerms) m.set(term.id, term);
    return m;
  }, [pathTerms]);

  const statsLine = useMemo(() => learnPathStatsLine(locale), [locale]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setOpenModule(LEARN_PATH_STAGES[0]!.key);
  }, [open, locale]);

  useEffect(() => {
    if (!open) setTermDetailId(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || termDetailId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, termDetailId]);

  useEffect(() => {
    if (!open || !mounted) return;
    const tmr = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(tmr);
  }, [open, mounted]);

  const toggleModule = useCallback((key: LearnPathStageKey) => {
    setOpenModule((cur) => (cur === key ? cur : key));
  }, []);

  if (!mounted || !open) return null;

  const ready = !termsLoading && pathTerms.length > 0;
  const detailTerm = termDetailId ? termById.get(termDetailId) : undefined;

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[6px]"
        aria-label={t.learn_close}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="
          relative z-[1] flex max-h-[min(92dvh,880px)] w-full max-w-[min(100%,42rem)] flex-col
          rounded-t-2xl border border-sol-line-strong bg-sol-darker shadow-[0_-8px_48px_rgba(0,0,0,0.5)]
          sm:max-h-[min(88vh,820px)] sm:rounded-2xl sm:border sm:shadow-2xl
        "
      >
        <header className="shrink-0 border-b border-sol-line px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sol-accent">
                {t.nav_learn}
              </p>
              <h2
                id={titleId}
                className="font-display text-xl font-semibold tracking-tight text-sol-text sm:text-2xl"
              >
                {t.learn_title}
              </h2>
              <p className="mt-1 text-[12px] font-medium tabular-nums text-sol-subtle">
                {statsLine}
              </p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="
                flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sol-line
                text-sol-subtle transition-colors hover:border-sol-line-strong hover:text-sol-text
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sol-accent
              "
              aria-label={t.learn_close}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {termsLoading && (
            <div className="flex items-center justify-center gap-3 py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-sol-accent border-t-transparent" />
              <span className="text-[13px] text-sol-subtle">
                {t.learn_path_loading}
              </span>
            </div>
          )}

          {!termsLoading && !ready && (
            <p className="py-8 text-center text-[13px] text-sol-muted">
              {t.load_error}
            </p>
          )}

          {ready && (
            <>
              <div className="mb-5 rounded-xl border border-sol-line bg-sol-surface-elevated/60 p-4">
                <p className="text-[13px] leading-relaxed text-sol-text">
                  {t.learn_outcome}
                </p>
                <p className="mt-3 text-[12px] leading-relaxed text-sol-subtle">
                  {t.learn_how_body}
                </p>
              </div>

              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-sol-muted">
                {t.learn_how_title}
              </p>

              <div className="space-y-2">
                {LEARN_PATH_STAGES.map((stage, stageIndex) => {
                  const { title: stageTitle, desc: stageDesc } = stageCopy(
                    t,
                    stage.key,
                  );
                  const expanded = openModule === stage.key;
                  const panelId = `learn-module-${stage.key}`;
                  return (
                    <div
                      key={stage.key}
                      className="overflow-hidden rounded-xl border border-sol-line bg-sol-surface/40"
                    >
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        id={`${panelId}-btn`}
                        onClick={() => toggleModule(stage.key)}
                        className="
                          flex w-full items-center gap-3 px-3 py-3 text-left transition-colors
                          hover:bg-sol-surface-elevated/50 sm:px-4
                        "
                      >
                        <span
                          className="
                            flex h-8 min-w-[2.25rem] shrink-0 items-center justify-center rounded-lg
                            border border-sol-accent/35 bg-sol-accent-muted text-[11px] font-bold tabular-nums text-sol-accent
                          "
                        >
                          {stageIndex + 1}/{LEARN_PATH_MODULE_COUNT}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block font-display text-[15px] font-semibold text-sol-text">
                            {stageTitle}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-[11px] text-sol-subtle">
                            {stageDesc}
                          </span>
                        </div>
                        <svg
                          className={`h-5 w-5 shrink-0 text-sol-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                        </svg>
                      </button>
                      {expanded && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={`${panelId}-btn`}
                          className="border-t border-sol-line px-3 pb-3 pt-1 sm:px-4"
                        >
                          <ul className="mt-2 space-y-2">
                            {stage.termIds.map((id) => {
                              const term = termById.get(id);
                              if (!term) return null;
                              const step = LEARN_STEP_BY_TERM_ID.get(id) ?? 0;
                              const preview = learnPathTruncatePreview(
                                term.definition,
                                120,
                              );
                              const read = hydrated && isRead(id);
                              return (
                                <li key={id}>
                                  <div
                                    className="
                                      flex overflow-hidden rounded-lg border border-sol-line/80 bg-sol-darker/40
                                      transition-colors hover:border-sol-accent/40 hover:bg-sol-surface-elevated/30
                                    "
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setTermDetailId(id)}
                                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                                    >
                                      <div className="flex items-start gap-2">
                                        <span
                                          className={`
                                            mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums
                                            ${
                                              read
                                                ? "border-sol-accent/50 bg-sol-accent-muted text-sol-accent"
                                                : "border-sol-line bg-sol-surface text-sol-accent"
                                            }
                                          `}
                                        >
                                          {step}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <span className="flex flex-wrap items-center gap-2">
                                            <span className="block text-[14px] font-semibold text-sol-text">
                                              {term.term}
                                            </span>
                                            {read && (
                                              <span className="rounded border border-sol-accent/30 bg-sol-accent-muted px-1 py-px text-[9px] font-bold uppercase tracking-wide text-sol-accent">
                                                {t.learn_read_badge}
                                              </span>
                                            )}
                                          </span>
                                          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wider text-sol-muted">
                                            {term.categoryLabel}
                                          </span>
                                          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-sol-subtle">
                                            {preview}
                                          </p>
                                        </div>
                                      </div>
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={t.learn_toggle_read_aria}
                                      aria-pressed={read}
                                      title={
                                        read
                                          ? t.learn_mark_unread
                                          : t.learn_mark_read
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRead(id);
                                      }}
                                      className="
                                        flex w-11 shrink-0 items-center justify-center border-l border-sol-line/80
                                        text-sol-muted transition-colors hover:bg-sol-surface-elevated/40 hover:text-sol-accent
                                      "
                                    >
                                      {read ? (
                                        <svg
                                          className="h-5 w-5 text-sol-accent"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                          aria-hidden
                                        >
                                          <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                      ) : (
                                        <svg
                                          className="h-5 w-5 opacity-50"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          aria-hidden
                                        >
                                          <circle cx="12" cy="12" r="9" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {ready && (
          <footer className="shrink-0 border-t border-sol-line bg-sol-darker/95 px-4 py-3 sm:px-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sol-muted">
              {t.learn_next_steps}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setTermDetailId(LEARN_FIRST_TERM_ID)}
                className="inline-flex items-center justify-center rounded-lg bg-sol-accent px-4 py-2.5 text-[13px] font-semibold text-sol-darker hover:opacity-90"
              >
                {t.learn_cta_start}
              </button>
              <Link
                href="/flashcards"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-sol-line px-4 py-2.5 text-[13px] font-medium text-sol-text hover:border-sol-line-strong"
              >
                {t.learn_cta_flashcards}
              </Link>
              <Link
                href={graphPath(locale, LEARN_FIRST_TERM_ID)}
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-sol-line px-4 py-2.5 text-[13px] font-medium text-sol-text hover:border-sol-line-strong"
              >
                {t.learn_cta_graph}
              </Link>
            </div>
          </footer>
        )}
      </div>
    </div>
  );

  return (
    <>
      {createPortal(content, document.body)}
      <LearnTermDetailModal
        open={detailTerm != null}
        term={detailTerm ?? null}
        locale={locale}
        onClose={() => setTermDetailId(null)}
        isRead={termDetailId != null && isRead(termDetailId)}
        onToggleRead={() => {
          if (termDetailId) toggleRead(termDetailId);
        }}
        onOpenRelated={(rid) => {
          if (termById.has(rid)) setTermDetailId(rid);
        }}
        resolveTerm={(tid) => termById.get(tid)}
      />
    </>
  );
}
