import { describe, it, expect, vi } from "vitest";
import { createMockCtx } from "../helpers.js";
import {
  handleCatPageCallback,
  handlePathStepCallback,
} from "../../src/handlers/callbacks.js";

describe("callback handlers", () => {
  it("localizes invalid category pagination callbacks", async () => {
    const ctx = createMockCtx({ match: "cat_page:broken", chatType: "private" });
    await handleCatPageCallback(ctx);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith({
      text: "[internal-error]",
    });
  });

  it("localizes invalid path step callbacks", async () => {
    const ctx = createMockCtx({ match: "path_step:broken", chatType: "private" });
    await handlePathStepCallback(ctx);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith({
      text: "[internal-error]",
    });
  });
});
