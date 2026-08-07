import { describe, it, expect } from "vitest";
import { allTerms, getTerm } from "../src/index";

// getTerm() checks the id map before the alias map, so an alias equal to a
// *different* term's canonical id would silently resolve to the wrong term.
describe("alias integrity", () => {
  const ids = new Set(allTerms.map((t) => t.id));

  it("no alias collides with another term's canonical id", () => {
    const collisions = allTerms.flatMap((t) =>
      (t.aliases ?? [])
        .filter((a) => a !== t.id && ids.has(a))
        .map((a) => `${t.id}: alias "${a}" is another term's id`),
    );
    expect(collisions).toEqual([]);
  });

  it("every alias resolves to its owning term via getTerm", () => {
    const mismatches = allTerms.flatMap((t) =>
      (t.aliases ?? [])
        .filter((a) => getTerm(a)?.id !== t.id)
        .map((a) => `${t.id}: getTerm("${a}") did not resolve to it`),
    );
    expect(mismatches).toEqual([]);
  });
});
