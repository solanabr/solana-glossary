"use client";

import { useState, useEffect } from "react";

export type Locale = "pt" | "es" | "en";

const VALID_LOCALES: Locale[] = ["pt", "es", "en"];
const STORAGE_KEY = "glossary-locale";

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && VALID_LOCALES.includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  function setLocale(newLocale: Locale) {
    localStorage.setItem(STORAGE_KEY, newLocale);
    setLocaleState(newLocale);
  }

  return { locale, setLocale };
}
