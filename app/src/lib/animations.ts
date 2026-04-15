import type { Variants } from "framer-motion";

/** Fade up from below -- used for cards, list items, staggered grids. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, delay },
  }),
};

/** Scale in from slightly smaller -- used for category buttons, modal overlays. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay },
  }),
  exit: { opacity: 0, scale: 0.95 },
};

/** Slide in from the right -- used for detail panels. */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/** Dropdown reveal -- used for search results and menus. */
export const dropdownReveal: Variants = {
  hidden: { opacity: 0, y: -4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15 },
  },
  exit: { opacity: 0, y: -4 },
};

/** Dropdown with slight scale -- used for hero search results. */
export const dropdownScaleReveal: Variants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: { opacity: 0, y: -4, scale: 0.98 },
};

/**
 * Stagger delay calculator for list items.
 * Caps delay so large lists don't take forever to appear.
 */
export function staggerDelay(index: number, perItem = 0.01, max = 0.3): number {
  return Math.min(index * perItem, max);
}
