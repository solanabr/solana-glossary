const STORAGE_KEY = "sol-glossary-recent-terms";
const MAX = 12;

export function getRecentTermIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is string => typeof x === "string" && x.length > 0,
    );
  } catch {
    return [];
  }
}

export function pushRecentTermId(termId: string): void {
  if (typeof window === "undefined" || !termId) return;
  try {
    const prev = getRecentTermIds();
    const next = [termId, ...prev.filter((id) => id !== termId)].slice(0, MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}
