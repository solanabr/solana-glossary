import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateCopilotAnswer } from "@/lib/copilot";

import { ERROR_MESSAGES } from "../fixtures/error-messages";
import { LEGACY_DEBUG_RESPONSE, mockGeminiFetch } from "../fixtures/mock-gemini";

describe("generateCopilotAnswer - debug", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  it("maps debug responses and normalizes empty caveats", async () => {
    mockGeminiFetch(LEGACY_DEBUG_RESPONSE);

    const result = await generateCopilotAnswer({
      locale: "en",
      termSlug: "pda",
      question: ERROR_MESSAGES.constraintViolated,
      codeSnippet: "invoke_signed(&instruction, &accounts, &[&seeds])?;",
    });

    expect(result.mode).toBe("code");
    expect(result.caveat).toBe("none");
    expect(result.keyConcepts.map((item) => item.id)).toContain("pda");
    expect(result.explanation).toContain("PDA");
  });

  it("injects error pattern hints and failing code into the Gemini request", async () => {
    const fetchMock = mockGeminiFetch(LEGACY_DEBUG_RESPONSE);

    await generateCopilotAnswer({
      locale: "en",
      termSlug: "pda",
      question: ERROR_MESSAGES.constraintViolated,
      codeSnippet: "invoke_signed(&instruction, &accounts, &[&seeds])?;",
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(requestInit.body));
    const userPrompt = payload.contents[0].parts[0].text as string;

    expect(userPrompt).toContain("User question:");
    expect(userPrompt).toContain("Code snippet:");
    expect(userPrompt).toContain("ConstraintHasOne");
    expect(userPrompt).toContain("invoke_signed");
  });

  it("surfaces Gemini API errors cleanly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Bad API key" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      generateCopilotAnswer({
        locale: "en",
        termSlug: "pda",
        question: ERROR_MESSAGES.constraintViolated,
      }),
    ).rejects.toThrow("Bad API key");
  });
});
