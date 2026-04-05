"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

import {
  getTerms,
  shuffle,
  UI_LABELS,
  formatUi,
  type GlossaryTerm,
  type Locale,
} from "@/lib/glossary";
import LanguageSelector from "@/components/LanguageSelector";
import { celebrateMatchBetweenLevels } from "@/lib/flashcard-confetti";
import { twitterIntentTweetUrl } from "@/lib/twitter-intent";

const MATCH_TIME_LIMIT_SEC = 120;
const MAX_LEVEL = 15;
const LEVEL_GAP_MS = 2000;
/** Min time pointer must stay over a slot before a correct match counts (ms). */
const DROP_DWELL_MS = 240;
const MIN_DEFINITION_LEN = 48;
const DEF_EXCERPT_LEN = 190;

function excerpt(text: string, max = DEF_EXCERPT_LEN): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function computeScore(
  matches: number,
  errors: number,
  secondsUsed: number,
): number {
  return Math.max(0, Math.round(matches * 100 - errors * 40 - secondsUsed));
}

function pickTermsForRound(
  pool: GlossaryTerm[],
  count: number,
): GlossaryTerm[] {
  const usable = pool.filter(
    (t) => t.definition.trim().length >= MIN_DEFINITION_LEN,
  );
  if (usable.length < count) return shuffle([...usable]).slice(0, count);
  return shuffle([...usable]).slice(0, count);
}

/** Hit-test drop zone (only unmatched slots exist in the DOM). */
function findDropSlotAt(clientX: number, clientY: number): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const node of stack) {
    if (!(node instanceof HTMLElement)) continue;
    const slot = node.closest("[data-drop-term-id]") as HTMLElement | null;
    if (!slot) continue;
    const id = slot.dataset.dropTermId;
    if (id) return slot;
  }
  return null;
}

/**
 * When elementsFromPoint misses (finger on edge, scroll, stacking), pick the drop
 * slot whose (padded) rect is closest to the release point.
 */
function nearestDropTermId(
  x: number,
  y: number,
  alsoX: number,
  alsoY: number,
  inflatePx: number,
): string | null {
  if (typeof document === "undefined") return null;
  const nodes = document.querySelectorAll<HTMLElement>("[data-drop-term-id]");
  let bestId: string | null = null;
  let bestDist = Infinity;
  const points: [number, number][] = [
    [x, y],
    [alsoX, alsoY],
  ];
  for (const [px, py] of points) {
    if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
    for (const el of nodes) {
      const id = el.dataset.dropTermId;
      if (!id) continue;
      const r = el.getBoundingClientRect();
      const L = r.left - inflatePx;
      const R = r.right + inflatePx;
      const T = r.top - inflatePx;
      const B = r.bottom + inflatePx;
      if (px < L || px > R || py < T || py > B) continue;
      const cx = Math.min(Math.max(px, r.left), r.right);
      const cy = Math.min(Math.max(py, r.top), r.bottom);
      const dist = (px - cx) ** 2 + (py - cy) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestId = id;
      }
    }
  }
  return bestId;
}

/**
 * Pointerup/touch often reports coordinates slightly off the slot under the finger.
 * Try nearby points, padded-rect nearest, then fall back to the last slot we were hovering (sync ref).
 */
function resolveDropTermId(
  clientX: number,
  clientY: number,
  last: { x: number; y: number },
  lastHoverId: string | null,
): string | null {
  const d = 32;
  const pts: [number, number][] = [
    [clientX, clientY],
    [last.x, last.y],
    [clientX - d, clientY],
    [clientX + d, clientY],
    [clientX, clientY - d],
    [clientX, clientY + d],
    [last.x - d, last.y],
    [last.x + d, last.y],
    [last.x, last.y - d],
    [last.x, last.y + d],
    [clientX - d, clientY - d],
    [clientX + d, clientY - d],
    [clientX - d, clientY + d],
    [clientX + d, clientY + d],
    [clientX - 14, clientY - 14],
    [clientX + 14, clientY + 14],
    [last.x - 14, last.y - 14],
    [last.x + 14, last.y + 14],
  ];
  for (const [x, y] of pts) {
    const slot = findDropSlotAt(x, y);
    const id = slot?.dataset.dropTermId ?? null;
    if (id) return id;
  }
  const near = nearestDropTermId(clientX, clientY, last.x, last.y, 16);
  if (near) return near;
  return lastHoverId;
}

function applyDragGhostTransform(el: HTMLElement, x: number, y: number): void {
  el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
}

type Phase = "menu" | "play" | "betweenLevels" | "wonGame" | "lost";

export default function MatchGame() {
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [allTerms, setAllTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [level, setLevel] = useState(0);
  const [phase, setPhase] = useState<Phase>("menu");
  const [timeLeft, setTimeLeft] = useState(MATCH_TIME_LIMIT_SEC);
  const [errors, setErrors] = useState(0);
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [roundTerms, setRoundTerms] = useState<GlossaryTerm[]>([]);
  const [termOrder, setTermOrder] = useState<string[]>([]);
  const [defOrder, setDefOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [ghostLabel, setGhostLabel] = useState<string | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const [shakeDropId, setShakeDropId] = useState<string | null>(null);
  const [secondsUsed, setSecondsUsed] = useState(0);
  const [totalPairsMatched, setTotalPairsMatched] = useState(0);
  const [gapCountdown, setGapCountdown] = useState(2);
  const [dragHoverDropId, setDragHoverDropId] = useState<string | null>(null);
  const [dwellHintDropId, setDwellHintDropId] = useState<string | null>(null);
  const [a11yMsg, setA11yMsg] = useState("");

  const dragRef = useRef<{
    termId: string;
    pointerId: number;
    captureEl: HTMLElement;
  } | null>(null);
  const ghostRaf = useRef(0);
  const pendingGhostPos = useRef({ x: 0, y: 0 });
  const windowMoveRef = useRef<((e: PointerEvent) => void) | null>(null);
  const windowUpRef = useRef<((e: PointerEvent) => void) | null>(null);
  const dropDwellRef = useRef<{ slotId: string | null; since: number }>({
    slotId: null,
    since: 0,
  });
  /** Last slot under pointer (sync); used when elementsFromPoint misses on pointerup. */
  const pendingHoverDropIdRef = useRef<string | null>(null);
  const lastHandledRoundKey = useRef<string | null>(null);
  /** Sync snapshot of the last round setup; avoids completing a stale round when `level` updates before `roundTerms`/`matched` on the same commit. */
  const activeRoundRef = useRef<{ level: number; termKey: string }>({
    level: -1,
    termKey: "",
  });
  const t = UI_LABELS[locale];

  useEffect(() => {
    if (!a11yMsg) return;
    const id = window.setTimeout(() => setA11yMsg(""), 4500);
    return () => window.clearTimeout(id);
  }, [a11yMsg]);

  useEffect(() => {
    if (phase === "betweenLevels") {
      setA11yMsg(formatUi(t.match_aria_level, { n: String(level) }));
    } else if (phase === "wonGame") {
      setA11yMsg(t.match_aria_won);
    } else if (phase === "lost") {
      setA11yMsg(t.match_aria_lost);
    }
  }, [phase, level, t]);

  const clearWindowDragListeners = useCallback(() => {
    if (windowMoveRef.current) {
      window.removeEventListener("pointermove", windowMoveRef.current, {
        capture: true,
      });
      windowMoveRef.current = null;
    }
    if (windowUpRef.current) {
      window.removeEventListener("pointerup", windowUpRef.current, {
        capture: true,
      });
      window.removeEventListener("pointercancel", windowUpRef.current, {
        capture: true,
      });
      windowUpRef.current = null;
    }
    if (ghostRaf.current) {
      cancelAnimationFrame(ghostRaf.current);
      ghostRaf.current = 0;
    }
  }, []);

  useEffect(() => {
    if (phase === "play") return;
    clearWindowDragListeners();
    dragRef.current = null;
    setDraggingId(null);
    setGhostLabel(null);
    setDragHoverDropId(null);
    setDwellHintDropId(null);
    dropDwellRef.current = { slotId: null, since: 0 };
    pendingHoverDropIdRef.current = null;
  }, [phase, clearWindowDragListeners]);

  useLayoutEffect(() => {
    if (ghostLabel === null || !ghostRef.current) return;
    const { x, y } = pendingGhostPos.current;
    applyDragGhostTransform(ghostRef.current, x, y);
  }, [ghostLabel]);

  useEffect(() => () => clearWindowDragListeners(), [clearWindowDragListeners]);

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
      /* ignore */
    }
  }, []);

  const usableCount = useMemo(
    () =>
      allTerms.filter((x) => x.definition.trim().length >= MIN_DEFINITION_LEN)
        .length,
    [allTerms],
  );

  const startNewGame = useCallback(() => {
    lastHandledRoundKey.current = null;
    setErrors(0);
    setTotalPairsMatched(0);
    setSecondsUsed(0);
    setTimeLeft(MATCH_TIME_LIMIT_SEC);
    setLevel(0);
    setPhase("play");
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      setSecondsUsed((s) => {
        if (s >= MATCH_TIME_LIMIT_SEC) return s;
        const next = s + 1;
        setTimeLeft(Math.max(0, MATCH_TIME_LIMIT_SEC - next));
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "play" && timeLeft === 0) {
      setPhase("lost");
    }
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase !== "play") return;
    const picked = pickTermsForRound(allTerms, level + 1);
    if (picked.length === 0) {
      setPhase("lost");
      return;
    }
    const ids = picked.map((x) => x.id);
    const termKey = [...ids].sort().join(",");
    activeRoundRef.current = { level, termKey };
    setRoundTerms(picked);
    setTermOrder(shuffle([...ids]));
    setDefOrder(shuffle([...ids]));
    setMatched(new Set());
    setDraggingId(null);
    setGhostLabel(null);
    dragRef.current = null;
    lastHandledRoundKey.current = null;
    pendingHoverDropIdRef.current = null;
  }, [phase, level, allTerms]);

  useEffect(() => {
    if (phase !== "play" || roundTerms.length === 0) return;
    const termKey = [...roundTerms.map((x) => x.id)].sort().join(",");
    if (
      activeRoundRef.current.level !== level ||
      activeRoundRef.current.termKey !== termKey
    ) {
      return;
    }
    if (matched.size !== roundTerms.length) return;
    const roundKey = `${level}:${termKey}`;
    if (lastHandledRoundKey.current === roundKey) return;
    lastHandledRoundKey.current = roundKey;

    setTotalPairsMatched((prev) => prev + roundTerms.length);

    if (level >= MAX_LEVEL) {
      setPhase("wonGame");
      return;
    }
    setPhase("betweenLevels");
  }, [phase, matched, roundTerms, level]);

  useEffect(() => {
    if (phase !== "betweenLevels") return;
    setGapCountdown(2);
    const stopConfetti = celebrateMatchBetweenLevels(LEVEL_GAP_MS);
    const tid = window.setTimeout(() => {
      setLevel((l) => l + 1);
      setPhase("play");
    }, LEVEL_GAP_MS);
    const countId = window.setInterval(() => {
      setGapCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => {
      window.clearTimeout(tid);
      window.clearInterval(countId);
      stopConfetti();
    };
  }, [phase]);

  const termById = useMemo(() => {
    const m = new Map<string, GlossaryTerm>();
    for (const x of roundTerms) m.set(x.id, x);
    return m;
  }, [roundTerms]);

  const pairProgressPct = useMemo(() => {
    if (phase !== "play" || roundTerms.length === 0) return 0;
    return Math.round((100 * matched.size) / roundTerms.length);
  }, [phase, matched.size, roundTerms.length]);

  const timerIsUrgent = phase === "play" && timeLeft > 0 && timeLeft <= 30;

  const endDrag = useCallback(
    (ev: PointerEvent | null) => {
      const active = dragRef.current;
      if (!active) return;
      if (ev && ev.pointerId !== active.pointerId) return;

      const { termId: tid, captureEl, pointerId } = active;
      const last = pendingGhostPos.current;

      dragRef.current = null;

      clearWindowDragListeners();

      try {
        captureEl.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }

      let cx = ev ? ev.clientX : last.x;
      let cy = ev ? ev.clientY : last.y;
      if (
        ev &&
        (ev.type === "pointercancel" ||
          !Number.isFinite(cx) ||
          !Number.isFinite(cy) ||
          (Math.abs(cx) < 0.5 && Math.abs(cy) < 0.5))
      ) {
        cx = last.x;
        cy = last.y;
      }

      const dwellSnap = dropDwellRef.current;
      const hoverFallback = pendingHoverDropIdRef.current;

      setDraggingId(null);
      setGhostLabel(null);
      setDragHoverDropId(null);
      dropDwellRef.current = { slotId: null, since: 0 };
      pendingHoverDropIdRef.current = null;

      const dropId = resolveDropTermId(cx, cy, last, hoverFallback);

      if (!dropId) return;

      if (dropId === tid) {
        const heldLongEnough =
          dwellSnap.slotId === dropId &&
          Date.now() - dwellSnap.since >= DROP_DWELL_MS;
        if (!heldLongEnough) {
          setDwellHintDropId(dropId);
          window.setTimeout(() => setDwellHintDropId(null), 700);
          return;
        }
        const termLabel = termById.get(tid)?.term ?? tid;
        setA11yMsg(formatUi(t.match_aria_matched, { term: termLabel }));
        setMatched((prev) => {
          const next = new Set(prev);
          next.add(tid);
          return next;
        });
      } else {
        setA11yMsg(t.match_aria_wrong);
        setErrors((n) => n + 1);
        setShakeDropId(dropId);
        window.setTimeout(() => setShakeDropId(null), 400);
      }
    },
    [clearWindowDragListeners, termById, t],
  );

  const onPointerDownTerm = useCallback(
    (e: React.PointerEvent, termId: string) => {
      if (phase !== "play" || matched.has(termId)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const el = e.currentTarget as HTMLElement;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* some browsers / embedded views */
      }

      clearWindowDragListeners();

      dragRef.current = {
        termId,
        pointerId: e.pointerId,
        captureEl: el,
      };
      setDraggingId(termId);
      setDragHoverDropId(null);
      setDwellHintDropId(null);
      dropDwellRef.current = { slotId: null, since: Date.now() };
      pendingHoverDropIdRef.current = null;
      const term = termById.get(termId);
      pendingGhostPos.current = { x: e.clientX, y: e.clientY };
      setGhostLabel(term?.term ?? termId);

      const syncHoverAt = (x: number, y: number) => {
        const hid = findDropSlotAt(x, y)?.dataset.dropTermId ?? null;
        const effective = hid ?? nearestDropTermId(x, y, x, y, 20);
        if (effective !== dropDwellRef.current.slotId) {
          dropDwellRef.current = { slotId: effective, since: Date.now() };
        }
        pendingHoverDropIdRef.current = effective;
        setDragHoverDropId((prev) => (prev === effective ? prev : effective));
      };

      syncHoverAt(e.clientX, e.clientY);

      const flushDragVisuals = () => {
        ghostRaf.current = 0;
        const { x, y } = pendingGhostPos.current;
        const gel = ghostRef.current;
        if (gel) applyDragGhostTransform(gel, x, y);
        syncHoverAt(x, y);
      };

      const requestDragFrame = () => {
        if (ghostRaf.current) return;
        ghostRaf.current = requestAnimationFrame(flushDragVisuals);
      };

      const onWinMove = (ev: PointerEvent) => {
        if (ev.pointerId !== dragRef.current?.pointerId) return;
        if (ev.pointerType === "touch") ev.preventDefault();
        const coalesced =
          typeof ev.getCoalescedEvents === "function"
            ? ev.getCoalescedEvents()
            : [];
        const points = coalesced.length > 0 ? coalesced : [ev];
        const lastPt = points[points.length - 1]!;
        pendingGhostPos.current = {
          x: lastPt.clientX,
          y: lastPt.clientY,
        };
        requestDragFrame();
      };

      const onWinUp = (ev: PointerEvent) => {
        endDrag(ev);
      };

      windowMoveRef.current = onWinMove;
      windowUpRef.current = onWinUp;
      window.addEventListener("pointermove", onWinMove, {
        capture: true,
        passive: false,
      });
      window.addEventListener("pointerup", onWinUp, { capture: true });
      window.addEventListener("pointercancel", onWinUp, { capture: true });
    },
    [phase, matched, termById, clearWindowDragListeners, endDrag],
  );

  const onLostPointerCaptureTerm = useCallback(
    (e: React.PointerEvent) => {
      if (dragRef.current?.pointerId !== e.pointerId) return;
      endDrag(null);
    },
    [endDrag],
  );

  const resultTotalMatches =
    phase === "wonGame" ? totalPairsMatched : totalPairsMatched + matched.size;

  const [sharePageUrl, setSharePageUrl] = useState("");
  useEffect(() => {
    setSharePageUrl(`${window.location.origin}/match`);
  }, []);

  const resultScore = useMemo(() => {
    if (phase !== "wonGame" && phase !== "lost") return 0;
    return computeScore(resultTotalMatches, errors, secondsUsed);
  }, [phase, resultTotalMatches, errors, secondsUsed]);

  const twitterUrl =
    phase === "wonGame" || phase === "lost"
      ? twitterIntentTweetUrl(
          formatUi(
            phase === "wonGame" ? t.match_share_all_levels : t.match_share_text,
            {
              level: formatUi(t.match_level_n, { n: String(level) }),
              max: String(MAX_LEVEL),
              time: formatClock(secondsUsed),
              matches: String(resultTotalMatches),
              errors: String(errors),
              score: String(resultScore),
            },
          ),
          sharePageUrl || "https://github.com/solanabr/solana-glossary",
        )
      : "";

  const lockViewport =
    !loadError &&
    (loading ||
      phase === "menu" ||
      phase === "play" ||
      phase === "betweenLevels");

  return (
    <div
      className={`match-game-page app-surface flex flex-col ${lockViewport ? "h-[100dvh] max-h-[100dvh] overflow-hidden" : "min-h-[100dvh]"}`}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {a11yMsg}
      </div>
      <header className="z-40 shrink-0 border-b border-sol-line bg-sol-darker/90 backdrop-blur-md">
        <div className="mx-auto flex h-[3.5rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-sol-subtle hover:text-sol-text"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="truncate">{t.glossary}</span>
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 font-display text-xs font-bold tracking-wide text-sol-text shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:text-sm">
            <span
              className="h-2 w-2 shrink-0 rounded-sm bg-gradient-to-br from-sol-purple via-sol-green to-sol-blue shadow-[0_0_10px_rgba(0,194,255,0.45)]"
              aria-hidden
            />
            {t.match_title}
          </span>
          <LanguageSelector
            locale={locale}
            onChange={setLocale}
            activeLabel={t.lang_active}
          />
        </div>
      </header>

      <main
        className={`mx-auto flex w-full max-w-6xl flex-col ${lockViewport ? "min-h-0 flex-1 overflow-hidden px-3 py-2 sm:px-4 sm:py-2" : "flex-1 px-4 py-8 sm:px-6 sm:py-10"}`}
      >
        {loading && (
          <p className="flex flex-1 items-center justify-center text-center text-sm text-sol-muted">
            {t.loading}
          </p>
        )}
        {!loading && loadError && (
          <div className="mx-auto max-w-md rounded-xl border border-sol-line bg-sol-surface px-4 py-8 text-center">
            <p className="mb-4 text-sm text-sol-subtle">{t.load_error}</p>
            <Link
              href="/"
              className="text-[13px] font-medium text-sol-blue hover:underline"
            >
              {t.match_back}
            </Link>
          </div>
        )}

        {!loading && !loadError && phase === "menu" && (
          <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center px-2 py-4">
            <div className="match-board-frame w-full max-w-sm">
              <div className="match-board-inner">
                <div className="match-board-content px-5 py-8 text-center sm:px-7 sm:py-9">
                  <p className="text-pretty text-[14px] leading-relaxed text-sol-subtle sm:text-[15px]">
                    {t.match_menu_intro}
                  </p>
                  <button
                    type="button"
                    onClick={startNewGame}
                    disabled={usableCount < 1}
                    className="mt-6 w-full rounded-xl bg-sol-blue px-6 py-3 text-[15px] font-semibold text-sol-darker shadow-[0_0_20px_-10px_rgba(0,194,255,0.5)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:mt-7 sm:py-3.5"
                  >
                    {t.match_start}
                  </button>
                  {usableCount < 1 && (
                    <p className="mt-4 text-xs text-red-300/90">
                      {t.no_results_hint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !loadError && phase === "play" && (
          <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
            <div className="mb-2 flex min-w-0 shrink-0 flex-col gap-2 sm:mb-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="match-stat-pill text-violet-200/95">
                  <svg
                    className="h-3.5 w-3.5 text-violet-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M4 6h16M4 12h10M4 18h14" />
                  </svg>
                  {formatUi(t.match_level_hud, {
                    n: String(level),
                    max: String(MAX_LEVEL),
                  })}
                </span>
                <span
                  className={`match-stat-pill font-mono tabular-nums normal-case tracking-normal text-cyan-200/90 ${timerIsUrgent ? "match-timer--warn border-red-400/30" : ""}`}
                  title={`${t.match_timer}: ${formatClock(timeLeft)}`}
                >
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-cyan-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v6l3 2" />
                  </svg>
                  {formatClock(timeLeft)}
                </span>
                <span
                  className="match-stat-pill font-mono tabular-nums normal-case tracking-normal text-red-200/90"
                  title={`${t.match_errors}: ${errors}`}
                >
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-red-400/90"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                  </svg>
                  {errors}
                </span>
                <span className="match-stat-pill font-mono tabular-nums normal-case tracking-normal text-sol-text">
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-sol-blue"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  {matched.size}/{roundTerms.length}
                </span>
              </div>
              <div className="match-progress-rail w-full max-w-md">
                <div
                  className="match-progress-fill"
                  style={{ width: `${pairProgressPct}%` }}
                />
              </div>
            </div>

            <div className="match-board-frame flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <div className="match-board-inner flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <div className="match-board-content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
                  <div className="match-hint-strip mb-2 flex shrink-0 items-start gap-1.5 sm:mb-2.5 sm:gap-2">
                    <svg
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80 sm:h-4 sm:w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>{t.match_drag_hint}</span>
                  </div>

                  <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-4">
                    <section className="match-lane-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                      <div className="match-lane-head--pick flex shrink-0 items-center gap-2">
                        <svg
                          className="h-4 w-4 text-violet-300"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M4 4h4v16H4V4zm6 2h4v12h-4V6zm6-2h4v16h-4V4z" />
                        </svg>
                        {t.match_terms}
                      </div>
                      <div className="match-lane-stack flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain sm:gap-2.5">
                        {termOrder.map((id) => {
                          if (matched.has(id)) return null;
                          const term = termById.get(id);
                          if (!term) return null;
                          const isDragging = draggingId === id;
                          return (
                            <div
                              key={id}
                              role="button"
                              tabIndex={0}
                              onPointerDown={(e) => onPointerDownTerm(e, id)}
                              onLostPointerCapture={onLostPointerCaptureTerm}
                              className={`
                                match-card-face touch-none select-none px-3 py-2.5 text-left font-display text-[14px] font-semibold leading-snug text-sol-text sm:px-4 sm:py-3 sm:text-[15px]
                                ${isDragging ? "match-card-face--dragging" : ""}
                              `}
                            >
                              {term.term}
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="match-lane-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                      <div className="match-lane-head--drop flex shrink-0 items-center gap-2">
                        <svg
                          className="h-4 w-4 text-cyan-300"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 8v8m0 0l-3-3m3 3l3-3" />
                        </svg>
                        {t.match_definitions}
                      </div>
                      <div className="match-lane-stack flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain sm:gap-2.5">
                        {defOrder.map((id) => {
                          if (matched.has(id)) return null;
                          const term = termById.get(id);
                          if (!term) return null;
                          const shake = shakeDropId === id;
                          const isOver =
                            draggingId !== null && dragHoverDropId === id;
                          const dwellHint = dwellHintDropId === id;
                          return (
                            <div
                              key={id}
                              data-drop-term-id={id}
                              className={`
                                match-drop-pad relative z-[1] min-h-[4.25rem] touch-none px-3 py-2.5 text-left sm:min-h-[5rem] sm:px-4 sm:py-3
                                ${dwellHint ? "match-drop-pad--dwell-hint" : ""}
                                ${shake ? "match-drop-pad--bad animate-match-shake" : ""}
                                ${!shake && isOver ? "match-drop-pad--over" : ""}
                                ${!shake && !isOver ? "cursor-grab active:cursor-grabbing" : ""}
                              `}
                            >
                              <p className="text-[12px] leading-relaxed text-sol-subtle sm:text-[13px]">
                                {excerpt(term.definition)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !loadError && phase === "betweenLevels" && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-5 backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <div className="match-board-frame max-w-md animate-fade-in">
              <div className="match-board-inner">
                <div className="match-board-content px-8 py-10 text-center sm:px-12 sm:py-12">
                  <p className="text-lg text-sol-blue/80" aria-hidden>
                    ✦
                  </p>
                  <p className="mt-3 font-display text-2xl font-bold text-sol-text sm:text-3xl">
                    {formatUi(t.match_level_complete, { n: String(level) })}
                  </p>
                  <p className="mt-6 font-mono text-3xl font-bold tabular-nums text-sol-blue sm:text-4xl">
                    {formatUi(t.match_next_level_s, {
                      s: String(Math.max(0, gapCountdown)),
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading &&
          !loadError &&
          (phase === "wonGame" || phase === "lost") && (
            <div className="mx-auto w-full max-w-2xl px-4 text-center sm:px-6">
              <h2 className="font-display text-2xl font-bold text-sol-text sm:text-3xl">
                <span
                  className={
                    phase === "wonGame"
                      ? "text-sol-brand-word"
                      : "text-red-200/95"
                  }
                >
                  {phase === "wonGame" ? t.match_won_all : t.match_lost}
                </span>
              </h2>
              {phase === "lost" && (
                <p className="mt-2 text-sm text-sol-subtle">
                  {t.match_time_up}
                </p>
              )}
              <div className="match-board-frame mt-8">
                <div className="match-board-inner">
                  <div className="match-board-content space-y-2 px-5 py-5 text-left text-[13px] text-sol-subtle">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-sol-muted">
                      {t.match_result}
                    </p>
                    {phase === "wonGame" ? (
                      <p>
                        {formatUi(t.match_levels_summary, {
                          max: String(MAX_LEVEL),
                        })}
                      </p>
                    ) : (
                      <p>{formatUi(t.match_level_n, { n: String(level) })}</p>
                    )}
                    <p>
                      {t.match_timer}: {formatClock(secondsUsed)}
                    </p>
                    <p>
                      {t.match_matches}: {resultTotalMatches}
                    </p>
                    <p>
                      {t.match_errors}: {errors}
                    </p>
                    <p className="border-t border-white/10 pt-2 font-semibold text-sol-blue">
                      {t.match_score}: {resultScore}
                    </p>
                    <p className="text-[11px] text-sol-muted">
                      {t.match_score_hint}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-center sm:gap-4">
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-sol-line px-6 py-3 text-[13px] font-medium text-sol-text hover:border-sol-blue/40 hover:text-sol-blue sm:min-w-[12rem] sm:max-w-[16rem] sm:flex-none"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  {t.match_share_x}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    lastHandledRoundKey.current = null;
                    setLevel(0);
                    setPhase("menu");
                  }}
                  className="min-h-[2.75rem] min-w-0 flex-1 rounded-xl bg-sol-blue px-6 py-3 text-[13px] font-semibold text-sol-darker hover:opacity-90 sm:min-w-[12rem] sm:max-w-[16rem] sm:flex-none"
                >
                  {t.match_play_again}
                </button>
                <Link
                  href="/"
                  className="inline-flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-center rounded-xl border border-sol-line px-6 py-3 text-[13px] font-medium text-sol-subtle hover:text-sol-text sm:min-w-[12rem] sm:max-w-[16rem] sm:flex-none"
                >
                  {t.match_back}
                </Link>
              </div>
            </div>
          )}
      </main>

      {ghostLabel !== null && (
        <div
          ref={ghostRef}
          className="match-ghost-card pointer-events-none fixed left-0 top-0 z-[200] max-w-[min(100vw-2rem,280px)] px-4 py-3 font-display text-[14px] font-semibold leading-snug text-sol-text will-change-transform"
        >
          {ghostLabel}
        </div>
      )}
    </div>
  );
}
