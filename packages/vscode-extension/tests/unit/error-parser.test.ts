import { describe, expect, it } from "vitest";

import { parseErrorMessage } from "../../src/utils/error-parser";

describe("parseErrorMessage", () => {
  it("maps seed-related errors to PDA hints", () => {
    expect(parseErrorMessage("ConstraintSeeds failed for vault PDA")).toMatchObject({
      anchorHint: "pda",
      title: "PDA constraint issue",
    });
  });

  it("maps signer failures to signer hints", () => {
    expect(parseErrorMessage("missing required signature")).toMatchObject({
      anchorHint: "signer",
      title: "Signer issue",
    });
  });

  it("falls back to a generic runtime issue", () => {
    expect(parseErrorMessage("unexpected runtime failure")).toMatchObject({
      anchorHint: "account",
      title: "Solana runtime issue",
    });
  });
});

