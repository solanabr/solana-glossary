import { describe, expect, it } from "vitest";

import { classifyDomain, getLearningPathForDomain } from "@/lib/copilot/domain-classifier";

import { CODE_SAMPLES } from "../../fixtures/code-samples";

describe("domain-classifier", () => {
  it("classifies Anchor code as anchor", () => {
    expect(classifyDomain(CODE_SAMPLES.anchorBasic)).toBe("anchor");
  });

  it("classifies SPL token transfer snippets as token", () => {
    expect(classifyDomain(CODE_SAMPLES.splTokenTransfer)).toBe("token");
  });

  it("classifies DeFi, agents, and NFT prompts correctly", () => {
    expect(classifyDomain("I want to build an AMM with liquidity pools and slippage controls.")).toBe("defi");
    expect(classifyDomain("Build an autonomous agent with MCP tools and RAG.")).toBe("agents");
    expect(classifyDomain("Create an NFT collection with metadata and royalties.")).toBe("nft");
  });

  it("falls back to general for vague input", () => {
    expect(classifyDomain("I want to learn Solana development.")).toBe("general");
    expect(classifyDomain("")).toBe("general");
  });

  it("is case-insensitive", () => {
    expect(classifyDomain("anchor program account")).toBe(classifyDomain("ANCHOR PROGRAM ACCOUNT"));
  });

  it("returns non-empty learning paths for every domain", () => {
    const domains = ["anchor", "runtime", "defi", "agents", "token", "nft", "general"] as const;

    for (const domain of domains) {
      expect(getLearningPathForDomain(domain).length).toBeGreaterThan(0);
    }
  });

  it("keeps anchor and defi path anchors stable", () => {
    expect(getLearningPathForDomain("anchor")).toContain("anchor");
    expect(getLearningPathForDomain("defi")).toContain("amm");
  });
});
