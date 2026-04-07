import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateCopilotAnswer } from "@/lib/copilot";

import { LEGACY_PLAN_RESPONSE, mockGeminiFetch } from "../fixtures/mock-gemini";

describe("generateCopilotAnswer - plan", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  it("returns a learning and build plan grounded in glossary clusters", async () => {
    mockGeminiFetch(LEGACY_PLAN_RESPONSE);

    const result = await generateCopilotAnswer({
      locale: "en",
      termSlug: "amm",
      question: "I want to build a Solana DeFi app with swaps and liquidity pools.",
    });

    expect(result.mode).toBe("term");
    expect(result.explanation).toBeTruthy();
    expect(result.keyConcepts.map((item) => item.id)).toContain("amm");
    expect(result.suggestedNextTerms.map((item) => item.id)).toContain("slippage");
    expect(result.highlightTerms.map((item) => item.id)).toContain("amm");
  });

  it("builds prompts with user-goal framing", async () => {
    const fetchMock = mockGeminiFetch(LEGACY_PLAN_RESPONSE);

    await generateCopilotAnswer({
      locale: "en",
      termSlug: "amm",
      question: "I want to build a Solana DeFi app with swaps and liquidity pools.",
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(requestInit.body));
    const userPrompt = payload.contents[0].parts[0].text as string;

    expect(userPrompt).toContain("User question:");
    expect(userPrompt).toContain("swaps and liquidity pools");
  });
});
