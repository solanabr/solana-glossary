import { describe, it, expect } from "vitest";
import { SwipeFeed } from "./swipe-feed";
import type { GlossaryTerm } from "@stbr/solana-glossary";

const term = (id: string, related: string[] = []): GlossaryTerm =>
  ({
    id,
    term: id.toUpperCase(),
    definition: `def of ${id}`,
    category: "core-protocol",
    depth: 1,
    related,
  }) as GlossaryTerm;

const TERMS = [
  term("a", ["b", "c"]),
  term("b", ["a"]),
  term("c"),
  term("d"),
  term("e"),
];

describe("SwipeFeed", () => {
  it("dwell on a card boosts its unseen related terms and exploits them next", () => {
    // rand always < 0.7 → always exploit the top-ranked candidate
    const feed = new SwipeFeed(TERMS, () => 0.1);
    feed.enqueue("a");
    feed.recordDwell("a", 10_000);
    // b and c each inherited 5000; ties broken by order → b first, then c
    expect(feed.next()?.id).toBe("b");
    expect(feed.next()?.id).toBe("c");
  });

  it("explores randomly when rand exceeds the exploit threshold", () => {
    // rand ≥ 0.7 → uniform pick; 0.99 * 5 unseen → index 4 → "e"
    const feed = new SwipeFeed(TERMS, () => 0.99);
    expect(feed.next()?.id).toBe("e");
  });

  it("never serves a card twice and drains to null", () => {
    const feed = new SwipeFeed(TERMS, () => 0.99);
    const served = new Set<string>();
    for (let i = 0; i < TERMS.length; i++) {
      const t = feed.next();
      expect(t).not.toBeNull();
      expect(served.has(t!.id)).toBe(false);
      served.add(t!.id);
    }
    expect(feed.next()).toBeNull();
  });

  it("enqueue reserves a term and rejects duplicates and unknowns", () => {
    const feed = new SwipeFeed(TERMS);
    expect(feed.enqueue("d")).toBe(true);
    expect(feed.enqueue("d")).toBe(false);
    expect(feed.enqueue("nope")).toBe(false);
  });

  it("ignores dwell on unknown ids and non-positive durations", () => {
    const feed = new SwipeFeed(TERMS, () => 0.1);
    feed.recordDwell("nope", 5000);
    feed.recordDwell("a", 0);
    // no scores accumulated → exploration path even with rand < 0.7
    expect(feed.next()).not.toBeNull();
  });
});
