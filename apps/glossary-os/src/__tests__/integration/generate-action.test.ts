import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateCopilotAnswer } from "@/lib/copilot";

import { LEGACY_GENERATE_RESPONSE, mockGeminiFetch } from "../fixtures/mock-gemini";

describe("generateCopilotAnswer - generate", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  it("returns structured generation guidance", async () => {
    mockGeminiFetch(LEGACY_GENERATE_RESPONSE);

    const result = await generateCopilotAnswer({
      locale: "en",
      termSlug: "pda",
      question: "Create a PDA with Anchor",
    });

    expect(result.mode).toBe("term");
    expect(result.explanation).toBeTruthy();
    expect(result.keyConcepts.map((item) => item.id)).toContain("pda");
    expect(result.suggestedNextTerms.map((item) => item.id)).toContain("seeds");
  });

  it("keeps placeholder instructions in the outgoing prompt", async () => {
    const fetchMock = mockGeminiFetch(LEGACY_GENERATE_RESPONSE);

    await generateCopilotAnswer({
      locale: "en",
      termSlug: "pda",
      question: "Create a PDA with Anchor",
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(requestInit.body));
    const userPrompt = payload.contents[0].parts[0].text as string;

    expect(userPrompt).toContain("User question:");
    expect(userPrompt).toContain("Create a PDA with Anchor");
  });
});
