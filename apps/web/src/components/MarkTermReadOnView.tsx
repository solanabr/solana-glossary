"use client";

import { useEffect } from "react";

import { useLearnPathRead } from "@/hooks/useLearnPathRead";

/** Marks the term as read in localStorage once hydration matches the learn-path read set. */
export function MarkTermReadOnView({ termId }: { termId: string }) {
  const { setRead, hydrated } = useLearnPathRead();

  useEffect(() => {
    if (!hydrated) return;
    setRead(termId, true);
  }, [hydrated, termId, setRead]);

  return null;
}
