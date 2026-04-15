"use client";

import { useEffect } from "react";

import { pushRecentTermId } from "@/lib/recent-terms";

/** Appends this term id to the recent-terms list in localStorage (deduped, capped). */
export function RecordRecentTerm({ termId }: { termId: string }) {
  useEffect(() => {
    pushRecentTermId(termId);
  }, [termId]);

  return null;
}
