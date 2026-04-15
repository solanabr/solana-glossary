"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCategoryMetaForLocale } from "@/lib/categories";
import {
  defaultLocale,
  getUiCopy,
  isLocaleCode,
  loadLocaleTranslations,
  type TranslationMap,
} from "@/lib/i18n";
import type { Category, GlossaryTerm, LocaleCode } from "@/lib/types";

const LOCALE_STORAGE_KEY = "solana-glossary-locale";

interface LocaleContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  copy: ReturnType<typeof getUiCopy>;
  localizeTerm: (term: GlossaryTerm) => GlossaryTerm;
  getCategoryMeta: (
    category: Category,
  ) => ReturnType<typeof getCategoryMetaForLocale>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(defaultLocale);
  const [translations, setTranslations] = useState<
    Partial<Record<LocaleCode, TranslationMap>>
  >({
    en: {},
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!stored || !isLocaleCode(stored)) return;
    setLocaleState(stored);
  }, []);

  useEffect(() => {
    if (locale === "en" || translations[locale]) return;

    let cancelled = false;

    loadLocaleTranslations(locale).then((loaded) => {
      if (cancelled) return;
      setTranslations((current) => ({
        ...current,
        [locale]: loaded,
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [locale, translations]);

  const setLocale = useCallback((nextLocale: LocaleCode) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  }, []);

  const localizeTerm = useCallback(
    (term: GlossaryTerm) => {
      if (locale === "en") return term;

      const override = translations[locale]?.[term.id];
      if (!override) return term;

      return {
        ...term,
        term: override.term,
        definition: override.definition,
      };
    },
    [locale, translations],
  );

  const getCategoryMeta = useCallback(
    (category: Category) => getCategoryMetaForLocale(category, locale),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      copy: getUiCopy(locale),
      localizeTerm,
      getCategoryMeta,
    }),
    [getCategoryMeta, locale, localizeTerm, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }

  return context;
}
