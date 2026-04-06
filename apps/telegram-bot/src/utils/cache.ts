export interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

export function isFresh<T>(
  entry: CacheEntry<T> | null,
): entry is CacheEntry<T> {
  return entry !== null && entry.expiresAt > Date.now();
}
