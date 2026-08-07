import { describe, it, expect } from "vitest";
import type { GlossaryTerm } from "@stbr/solana-glossary";
import { generateLearningPath, generateTopicPath } from "@/lib/learning-path";

function term(id: string, related: string[] = []): GlossaryTerm {
  return {
    id,
    term: id.toUpperCase(),
    definition: `${id} definition`,
    category: "core-protocol",
    depth: 1,
    related,
  };
}

// a → b,c ; b → a(seen),d ; c → c(self-cycle), x(dangling) ; d → (none)
const terms: GlossaryTerm[] = [
  term("a", ["b", "c"]),
  term("b", ["a", "d"]),
  term("c", ["c", "x"]),
  term("d", []),
];

const ids = (ts: GlossaryTerm[]) => ts.map((t) => t.id);

describe("generateLearningPath", () => {
  it("returns [] for an unknown start term", () => {
    expect(generateLearningPath("nope", terms)).toEqual([]);
  });

  it("returns BFS order with the start term first", () => {
    expect(ids(generateLearningPath("a", terms))).toEqual(["a", "b", "c", "d"]);
  });

  it("caps the path at maxSteps", () => {
    expect(ids(generateLearningPath("a", terms, 2))).toEqual(["a", "b"]);
  });

  it("is cycle-safe and never revisits a term", () => {
    const path = generateLearningPath("a", terms);
    expect(new Set(ids(path)).size).toBe(path.length);
  });

  it("skips dangling related ids absent from the corpus", () => {
    expect(ids(generateLearningPath("a", terms))).not.toContain("x");
  });
});

describe("generateTopicPath", () => {
  it("numbers steps from 1 and flags the start", () => {
    const { steps } = generateTopicPath(terms[0], terms);
    expect(steps.map((s) => s.term.id)).toEqual(["a", "b", "c", "d"]);
    expect(steps[0]).toMatchObject({ number: 1, isStart: true });
    expect(steps[1]).toMatchObject({ number: 2, isStart: false });
  });
});
