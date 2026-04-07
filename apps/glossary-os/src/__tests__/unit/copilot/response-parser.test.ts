import { describe, expect, it } from "vitest";

import { parseCopilotSchemaAnswer } from "@/lib/copilot/response-parser";

import { MOCK_EXPLAIN_RESPONSE } from "../../fixtures/mock-gemini";

describe("response-parser", () => {
  it("parses a valid Copilot schema response", () => {
    const parsed = parseCopilotSchemaAnswer(JSON.stringify(MOCK_EXPLAIN_RESPONSE));
    expect(parsed.summary).toBe(MOCK_EXPLAIN_RESPONSE.summary);
    expect(parsed.sections).toHaveLength(MOCK_EXPLAIN_RESPONSE.sections.length);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseCopilotSchemaAnswer("{invalid")).toThrow(/failed to parse JSON/i);
  });

  it("rejects non-object payloads", () => {
    expect(() => parseCopilotSchemaAnswer(JSON.stringify(["not", "an", "object"]))).toThrow(
      /payload must be an object/i,
    );
  });

  it("rejects missing required fields", () => {
    expect(() => parseCopilotSchemaAnswer(JSON.stringify({ summary: "Only summary" }))).toThrow(
      /sections/i,
    );
  });

  it("rejects malformed section entries", () => {
    expect(() =>
      parseCopilotSchemaAnswer(
        JSON.stringify({
          ...MOCK_EXPLAIN_RESPONSE,
          sections: [{ id: "a", title: "b", body: "c" }],
        }),
      ),
    ).toThrow(/sections\[0\]\.code/i);
  });

  it("rejects malformed glossary mention arrays", () => {
    expect(() =>
      parseCopilotSchemaAnswer(
        JSON.stringify({
          ...MOCK_EXPLAIN_RESPONSE,
          glossary_mentions: ["anchor", 1],
        }),
      ),
    ).toThrow(/glossary_mentions/i);
  });
});
