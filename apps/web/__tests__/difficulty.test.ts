import { describe, it, expect } from "vitest";
import { getDifficulty } from "../lib/difficulty";

describe("difficulty", () => {
  it("marks known beginner terms", () => {
    expect(getDifficulty("account")).toBe("Beginner");
  });
  it("marks known advanced terms", () => {
    expect(getDifficulty("zk-proof")).toBe("Advanced");
  });
  it("marks known intermediate terms", () => {
    expect(getDifficulty("pda")).toBe("Intermediate");
  });
  it("falls back to category heuristic", () => {
    expect(getDifficulty("some-zk-term", "zk-compression")).toBe("Advanced");
  });
  it("falls back to Intermediate for unknown with no category", () => {
    expect(getDifficulty("completely-unknown")).toBe("Intermediate");
  });
});
