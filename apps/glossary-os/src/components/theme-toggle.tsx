"use client";

import { useEffect, useState } from "react";

import { getCopy } from "@/lib/copy";
import type { Locale } from "@/lib/locales";

type Theme = "light" | "dark";

const STORAGE_KEY = "glossary-os-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const rootTheme = document.documentElement.dataset.theme;
    if (rootTheme === "light" || rootTheme === "dark") {
      setTheme(rootTheme);
      return;
    }

    const nextTheme = getSystemTheme();
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
  }, []);

  function updateTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  return (
    <div className="theme-toggle" aria-label={copy.nav.themeLabel} role="group">
      <button
        className={theme === "light" ? "theme-pill theme-pill-active" : "theme-pill"}
        onClick={() => updateTheme("light")}
        type="button"
      >
        {copy.nav.themeLight}
      </button>
      <button
        className={theme === "dark" ? "theme-pill theme-pill-active" : "theme-pill"}
        onClick={() => updateTheme("dark")}
        type="button"
      >
        {copy.nav.themeDark}
      </button>
    </div>
  );
}
