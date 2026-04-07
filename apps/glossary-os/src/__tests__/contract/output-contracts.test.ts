import { describe, expect, it } from "vitest";

import { parseCopilotSchemaAnswer } from "@/lib/copilot/response-parser";

import {
  MOCK_DEBUG_RESPONSE,
  MOCK_EXPLAIN_RESPONSE,
  MOCK_GENERATE_RESPONSE,
  MOCK_PLAN_RESPONSE,
} from "../fixtures/mock-gemini";

describe("copilot output contracts", () => {
  it("accepts explain contract payloads", () => {
    const parsed = parseCopilotSchemaAnswer(JSON.stringify(MOCK_EXPLAIN_RESPONSE));
    expect(parsed.key_concepts.length).toBeGreaterThan(0);
    expect(parsed.sections.length).toBeGreaterThan(0);
  });

  it("accepts debug contract payloads with code sections", () => {
    const parsed = parseCopilotSchemaAnswer(JSON.stringify(MOCK_DEBUG_RESPONSE));
    expect(parsed.sections.some((section) => section.code.length > 0)).toBe(true);
  });

  it("accepts generate and plan contract payloads", () => {
    expect(parseCopilotSchemaAnswer(JSON.stringify(MOCK_GENERATE_RESPONSE)).summary).toBeTruthy();
    expect(parseCopilotSchemaAnswer(JSON.stringify(MOCK_PLAN_RESPONSE)).summary).toBeTruthy();
  });
});
