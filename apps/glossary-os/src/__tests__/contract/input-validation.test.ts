import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/copilot", () => ({
  generateCopilotAnswer: vi.fn(),
}));

import { POST } from "@/app/api/copilot/route";
import { generateCopilotAnswer } from "@/lib/copilot";

function createRequest(body: unknown) {
  return new Request("http://localhost/api/copilot", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/copilot input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unsupported locales", async () => {
    const response = await POST(
      createRequest({
        locale: "fr",
        termSlug: "pda",
        question: "Explain PDA",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Unsupported locale." });
  });

  it("rejects missing termSlug", async () => {
    const response = await POST(
      createRequest({
        locale: "en",
        question: "Explain PDA",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "termSlug is required." });
  });

  it("rejects missing question", async () => {
    const response = await POST(
      createRequest({
        locale: "en",
        termSlug: "pda",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "question is required." });
  });

  it("returns 503 when the Gemini key is missing downstream", async () => {
    vi.mocked(generateCopilotAnswer).mockRejectedValueOnce(new Error("GEMINI_API_KEY is not configured."));

    const response = await POST(
      createRequest({
        locale: "en",
        termSlug: "pda",
        question: "Explain PDA",
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "GEMINI_API_KEY is not configured." });
  });

  it("trims and truncates inputs before calling the core generator", async () => {
    vi.mocked(generateCopilotAnswer).mockResolvedValueOnce({
      explanation: "ok",
      keyConcepts: [],
      suggestedNextTerms: [],
      highlightTerms: [],
      caveat: "",
      mode: "term",
    });

    const largeQuestion = `   ${"a".repeat(1000)}   `;
    const largeCode = "b".repeat(9000);

    const response = await POST(
      createRequest({
        locale: "en",
        termSlug: "pda",
        question: largeQuestion,
        codeSnippet: largeCode,
      }),
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(generateCopilotAnswer)).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en",
        termSlug: "pda",
        question: "a".repeat(800),
        codeSnippet: "b".repeat(6000),
      }),
    );
  });
});
