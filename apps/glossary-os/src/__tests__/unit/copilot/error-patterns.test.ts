import { describe, expect, it } from "vitest";

import { ERROR_PATTERNS, matchErrorPattern } from "@/lib/copilot/error-patterns";

import { ERROR_MESSAGES } from "../../fixtures/error-messages";

describe("error-patterns", () => {
  it("matches account-not-found errors", () => {
    const match = matchErrorPattern(ERROR_MESSAGES.accountNotFound);
    expect(match?.errorType).toBe("AccountNotFound");
    expect(match?.relatedSlugs).toContain("account");
    expect(match?.relatedSlugs).toContain("pda");
  });

  it("matches Anchor constraint errors", () => {
    const match = matchErrorPattern(ERROR_MESSAGES.constraintViolated);
    expect(match?.errorType).toBe("ConstraintViolated");
    expect(match?.relatedSlugs).toContain("seeds");
  });

  it("matches insufficient funds patterns", () => {
    const match = matchErrorPattern(ERROR_MESSAGES.insufficientFunds);
    expect(match?.errorType).toBe("InsufficientFunds");
    expect(match?.relatedSlugs).toContain("rent");
  });

  it("matches invalid account data and discriminator mismatches", () => {
    expect(matchErrorPattern(ERROR_MESSAGES.invalidAccountData)?.errorType).toBe("InvalidAccountData");
    expect(matchErrorPattern(ERROR_MESSAGES.anchorPanic)?.relatedSlugs).toContain("discriminator");
  });

  it("matches custom program errors", () => {
    expect(matchErrorPattern(ERROR_MESSAGES.customProgram)?.errorType).toBe("CustomProgramError");
  });

  it("matches CPI errors in multiple phrasings", () => {
    const variations = [
      ERROR_MESSAGES.cpiFailure,
      "Cross-program invocation failed",
      "invoke_signed failed",
    ];

    for (const message of variations) {
      expect(matchErrorPattern(message)?.errorType).toBe("CPIError");
    }
  });

  it("returns null for unrelated errors", () => {
    expect(matchErrorPattern("SomeRandomNonSolanaError: something went wrong")).toBeNull();
  });

  it("gives every error pattern a quick fix and glossary links", () => {
    for (const pattern of ERROR_PATTERNS) {
      expect(pattern.quickFix.length).toBeGreaterThan(10);
      expect(pattern.relatedSlugs.length).toBeGreaterThan(0);
    }
  });
});
