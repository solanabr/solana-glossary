import confetti from "canvas-confetti";

const COLORS = ["#14f195", "#9945ff", "#b8ffe8", "#dcc4ff", "#f5fffa"];

/** 0–1 coordinates for `canvas-confetti` `origin` (viewport-relative). */
export type ConfettiViewportOrigin = { x: number; y: number };

/** Center of an element → normalized viewport origin for confetti. */
export function viewportOriginFromElement(
  el: HTMLElement,
): ConfettiViewportOrigin {
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width / 2) / window.innerWidth;
  const y = (r.top + r.height / 2) / window.innerHeight;
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

/** Single celebratory burst from the tap target (e.g. “I know”). */
export function celebrateFlashcardKnown(origin: ConfettiViewportOrigin): void {
  confetti({
    particleCount: 110,
    spread: 78,
    startVelocity: 36,
    origin,
    colors: COLORS,
    disableForReducedMotion: true,
    ticks: 220,
  });
}

/** Confetti between match-game levels; `durationMs` should match level gap. */
export function celebrateMatchBetweenLevels(durationMs = 2000): () => void {
  if (typeof window === "undefined") return () => {};
  const bursts = window.setInterval(() => {
    confetti({
      particleCount: 22,
      spread: 88,
      startVelocity: 28,
      origin: { x: 0.5, y: 0.55 },
      colors: COLORS,
      disableForReducedMotion: true,
      ticks: 180,
    });
  }, 320);
  const stop = window.setTimeout(() => {
    window.clearInterval(bursts);
  }, durationMs);
  return () => {
    window.clearInterval(bursts);
    window.clearTimeout(stop);
  };
}
