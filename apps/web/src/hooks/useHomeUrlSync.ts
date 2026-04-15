import { useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Args = {
  locale: string;
  loading: boolean;
  termsLength: number;
  query: string;
  setQuery: (q: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  validCategorySlugs: string[];
};

/**
 * One-way-from-URL on first ready pass, then keeps ?q= and ?cats= in sync (debounced q).
 */
export function useHomeUrlSync({
  locale,
  loading,
  termsLength,
  query,
  setQuery,
  selectedCategories,
  setSelectedCategories,
  validCategorySlugs,
}: Args): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydratedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const localeKeyRef = useRef(locale);

  useEffect(() => {
    if (localeKeyRef.current !== locale) {
      localeKeyRef.current = locale;
      hydratedRef.current = false;
    }
  }, [locale]);

  const slugKey = validCategorySlugs.join(",");

  useEffect(() => {
    if (loading || termsLength === 0 || hydratedRef.current) return;
    const qRaw = searchParams.get("q") ?? "";
    const catsParam = searchParams.get("cats");
    const catsRaw = catsParam
      ? catsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const valid = catsRaw.filter((c) => validCategorySlugs.includes(c));
    setQuery(qRaw);
    setSelectedCategories(valid);
    hydratedRef.current = true;
  }, [
    loading,
    termsLength,
    slugKey,
    searchParams,
    setQuery,
    setSelectedCategories,
    validCategorySlugs,
  ]);

  const writeUrl = useCallback(
    (q: string, cats: string[]) => {
      if (typeof window === "undefined") return;
      const sp = new URLSearchParams(window.location.search);
      sp.delete("q");
      sp.delete("cats");
      const qt = q.trim();
      if (qt.length > 0) sp.set("q", qt);
      if (cats.length > 0) sp.set("cats", cats.join(","));
      const next = sp.toString();
      router.replace(next ? `/?${next}` : "/", { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    if (!hydratedRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeUrl(query, selectedCategories);
    }, 380);
    return () => clearTimeout(debounceRef.current);
  }, [query, selectedCategories, writeUrl]);
}
