import { describe, it, expect } from "vitest";
import { isRestingBody } from "@/lib/ai-session";

// Regression guard for the canned/disabled blank-UI fix: the client must treat
// every non-answer mode body as "resting" so a budget-driven canned/disabled
// response renders the resting state instead of an empty quiz / broken card.
describe("isRestingBody", () => {
  it("matches every non-answer mode body", () => {
    expect(isRestingBody({ mode: "resting" })).toBe(true);
    expect(isRestingBody({ mode: "canned" })).toBe(true);
    expect(isRestingBody({ mode: "disabled" })).toBe(true);
  });

  it("rejects real answer bodies and non-objects", () => {
    expect(isRestingBody({ questions: [{ options: [] }] })).toBe(false);
    expect(isRestingBody({ title: "x", code: "y" })).toBe(false);
    expect(isRestingBody({ mode: "on" })).toBe(false);
    expect(isRestingBody(null)).toBe(false);
    expect(isRestingBody("resting")).toBe(false);
    expect(isRestingBody(undefined)).toBe(false);
  });
});
