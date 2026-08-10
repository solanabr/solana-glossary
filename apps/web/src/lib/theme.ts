import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/**
 * The theme currently painted. The root class is the source of truth: the
 * pre-paint script in index.html resolves it (stored choice → OS → dark) and
 * setTheme() is the only thing that changes it afterwards.
 */
export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked — the choice just won't survive a reload.
  }
}

/**
 * Watches the root class rather than a React store, so anything flipping the
 * theme (the toggle, the boot script, devtools) reaches every subscriber.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
}
