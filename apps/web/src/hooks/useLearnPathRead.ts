"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sol-glossary-learn-read-v1";

function loadSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persist(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* quota / private mode */
  }
}

export function useLearnPathRead() {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReadIds(loadSet());
    setHydrated(true);
  }, []);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const toggleRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next);
      return next;
    });
  }, []);

  const setRead = useCallback((id: string, read: boolean) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (read) next.add(id);
      else next.delete(id);
      persist(next);
      return next;
    });
  }, []);

  return { readIds, isRead, toggleRead, setRead, hydrated };
}
