"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { UI_LABELS, type GlossaryTerm, type Locale } from "@/lib/glossary";
import TermShareX from "@/components/TermShareX";
import { twitterIntentTweetUrl } from "@/lib/twitter-intent";
import { termPath } from "@/lib/url-lang";

type Props = {
  open: boolean;
  term: GlossaryTerm | null;
  locale: Locale;
  onClose: () => void;
  isRead: boolean;
  onToggleRead: () => void;
  onOpenRelated: (id: string) => void;
  resolveTerm: (id: string) => GlossaryTerm | undefined;
};

export default function LearnTermDetailModal({
  open,
  term,
  locale,
  onClose,
  isRead,
  onToggleRead,
  onOpenRelated,
  resolveTerm,
}: Props) {
  const t = UI_LABELS[locale];
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !mounted) return;
    const tmr = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => window.clearTimeout(tmr);
  }, [open, mounted, term?.id]);

  if (!mounted || !open || !term) return null;

  const path = termPath(locale, term.id);
  const pageUrl = origin ? `${origin}${path}` : "";
  const shareIntentUrl =
    pageUrl && origin
      ? twitterIntentTweetUrl(`${term.term} — ${t.brand}`, pageUrl)
      : "";

  const content = (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[4px]"
        aria-label={t.learn_back_path}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="
          relative z-[1] flex max-h-[min(90dvh,720px)] w-full max-w-[min(100%,36rem)] flex-col
          rounded-t-2xl border border-sol-line-strong bg-sol-darker shadow-2xl
          sm:max-h-[min(85vh,680px)] sm:rounded-2xl
        "
      >
        <header className="shrink-0 border-b border-sol-line px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sol-subtle">
                  {term.categoryLabel}
                </p>
                {isRead && (
                  <span className="rounded-md border border-sol-accent/35 bg-sol-accent-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sol-accent">
                    {t.learn_read_badge}
                  </span>
                )}
              </div>
              <h2
                id={titleId}
                className="mt-1 font-display text-xl font-semibold leading-tight text-sol-text sm:text-2xl"
              >
                {term.term}
              </h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="
                flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sol-line
                text-sol-subtle hover:border-sol-line-strong hover:text-sol-text
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
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-sol-subtle sm:text-[15px]">
            {term.definition}
          </p>

          {(() => {
            const onPath = (term.related ?? []).filter((rid) =>
              Boolean(resolveTerm(rid)),
            );
            if (onPath.length === 0) return null;
            return (
              <div className="mt-6 border-t border-sol-line pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-sol-muted">
                  {t.see_also}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {onPath.map((rid) => {
                    const rt = resolveTerm(rid)!;
                    return (
                      <li key={rid}>
                        <button
                          type="button"
                          onClick={() => onOpenRelated(rid)}
                          className="rounded-md border border-sol-line bg-sol-surface px-2.5 py-1 text-[12px] font-medium text-sol-accent transition-colors hover:border-sol-accent/40"
                        >
                          {rt.term}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}
        </div>

        <footer className="shrink-0 space-y-3 border-t border-sol-line bg-sol-darker/95 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onToggleRead}
              className={`
                inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors
                ${
                  isRead
                    ? "border-sol-line text-sol-subtle hover:border-sol-line-strong hover:text-sol-text"
                    : "border-sol-accent/50 bg-sol-accent-muted text-sol-accent hover:border-sol-accent"
                }
              `}
            >
              {isRead ? t.learn_mark_unread : t.learn_mark_read}
            </button>
            <Link
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-sol-line px-4 py-2.5 text-[13px] font-medium text-sol-text hover:border-sol-line-strong"
            >
              {t.learn_term_full_page}
            </Link>
          </div>
          {shareIntentUrl ? (
            <TermShareX
              intentUrl={shareIntentUrl}
              label={t.term_share}
              wrapperClassName="flex w-full justify-end"
            />
          ) : null}
        </footer>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
