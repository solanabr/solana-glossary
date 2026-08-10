import { GlossaryTerm } from "@stbr/solana-glossary";

/**
 * Dwell-driven feed picker for the Swipe view.
 *
 * Signal model: time spent on a card is interest in that card; half of it
 * propagates to the card's unseen related terms. The next card is the
 * highest-scored unseen candidate ~70% of the time (exploitation), otherwise a
 * uniform random unseen term (exploration) so the feed never tunnels.
 */
export class SwipeFeed {
  private readonly pool: Map<string, GlossaryTerm>;
  private readonly order: string[];
  private readonly scores = new Map<string, number>();
  private readonly seen = new Set<string>();

  constructor(
    terms: GlossaryTerm[],
    private readonly rand: () => number = Math.random,
  ) {
    this.pool = new Map(terms.map((t) => [t.id, t]));
    this.order = terms.map((t) => t.id);
  }

  /** Record time spent on a card; propagates interest to its related terms. */
  recordDwell(id: string, ms: number): void {
    if (ms <= 0 || !this.pool.has(id)) return;
    this.scores.set(id, (this.scores.get(id) ?? 0) + ms);
    for (const rel of this.pool.get(id)?.related ?? []) {
      if (!this.seen.has(rel) && this.pool.has(rel)) {
        this.scores.set(rel, (this.scores.get(rel) ?? 0) + ms * 0.5);
      }
    }
  }

  /** Force a specific term to be served next (e.g. a tapped related chip). */
  enqueue(id: string): boolean {
    if (this.seen.has(id) || !this.pool.has(id)) return false;
    this.seen.add(id);
    return true;
  }

  /** Pick the next card and mark it seen. Null once every term was served. */
  next(): GlossaryTerm | null {
    const unseen = this.order.filter((id) => !this.seen.has(id));
    if (unseen.length === 0) return null;

    const ranked = unseen
      .filter((id) => (this.scores.get(id) ?? 0) > 0)
      .sort((a, b) => (this.scores.get(b) ?? 0) - (this.scores.get(a) ?? 0));

    const id =
      ranked.length > 0 && this.rand() < 0.7
        ? ranked[0]
        : unseen[Math.floor(this.rand() * unseen.length)];
    this.seen.add(id);
    return this.pool.get(id) ?? null;
  }

  get seenCount(): number {
    return this.seen.size;
  }
}
