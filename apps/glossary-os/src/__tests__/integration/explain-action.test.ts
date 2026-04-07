import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateCopilotAnswer } from "@/lib/copilot";

import { CODE_SAMPLES } from "../fixtures/code-samples";
import { LEGACY_RUNTIME_RESPONSE, mockGeminiFetch } from "../fixtures/mock-gemini";

describe("generateCopilotAnswer - explain", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  it("returns a grounded structured answer", async () => {
    mockGeminiFetch(LEGACY_RUNTIME_RESPONSE);

    const result = await generateCopilotAnswer({
      locale: "en",
      termSlug: "anchor",
      question: "Explain this code",
      codeSnippet: CODE_SAMPLES.anchorBasic,
    });

    expect(result.mode).toBe("code");
    expect(result.explanation).toBeTruthy();
    expect(result.keyConcepts.map((item) => item.id)).toContain("anchor");
    expect(result.suggestedNextTerms.map((item) => item.id)).toContain("pda");
    expect(result.highlightTerms.map((item) => item.id)).toContain("anchor");
  });

  it("sends glossary context and the developer code to Gemini", async () => {
    const fetchMock = mockGeminiFetch(LEGACY_RUNTIME_RESPONSE);

    await generateCopilotAnswer({
      locale: "en",
      termSlug: "anchor",
      question: "Explain this code",
      codeSnippet: CODE_SAMPLES.anchorBasic,
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(requestInit.body));
    const userPrompt = payload.contents[0].parts[0].text as string;

    expect(userPrompt).toContain("Glossary context:");
    expect(userPrompt).toContain("User question:");
    expect(userPrompt).toContain("#[program]");
  });
});
