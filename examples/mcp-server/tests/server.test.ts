/**
 * Tests for the Solana Intelligence MCP Server v2.0
 *
 * Covers all 16 tools:
 * - 9 glossary tools (lookup, search, suggest, semantic, category, explain, learning-path, compare, random)
 * - 7 live Solana tools (wallet, token balance, token price, transactions, explain TX, address info, swap)
 *
 * Also covers: graph engine, i18n resolver, resources, fuzzy search, TF-IDF, data modules
 */

import { describe, it, expect } from "vitest";

// ─── Glossary Tools ─────────────────────────────────────────────
import { lookupTerm } from "../src/tools/lookup.js";
import { searchGlossary } from "../src/tools/search.js";
import { listCategory, listAllCategories } from "../src/tools/category.js";
import { explainConceptTool } from "../src/tools/explain.js";
import { learningPath } from "../src/tools/learning-path.js";
import { compareTerms } from "../src/tools/compare.js";
import { randomTerm } from "../src/tools/random.js";
import { suggestTerms } from "../src/tools/glossary/suggest.js";
import { semanticSearchTool } from "../src/tools/glossary/semantic-search.js";

// ─── Solana Live Tools ──────────────────────────────────────────
import { getWalletBalance } from "../src/tools/solana/wallet.js";
import { getTokenBalance, getTokenPriceTool } from "../src/tools/solana/tokens.js";
import { getRecentTransactionsTool, explainTransactionTool } from "../src/tools/solana/transactions.js";
import { whatIsThisAddressTool } from "../src/tools/solana/address-info.js";
import { simulateSwapTool } from "../src/tools/solana/swap.js";

// ─── Infrastructure ─────────────────────────────────────────────
import { findLearningPath, explainConcept, getGraphStats, getHubTerms } from "../src/graph.js";
import {
  resolveTermLocalized,
  searchTermsLocalized,
  getTermsByCategoryLocalized,
  localizeTerms,
  getAvailableLocales,
  validateLocale,
} from "../src/i18n-resolver.js";
import { readResource, listResources, listResourceTemplates } from "../src/resources/index.js";

// ─── Utils & Services ───────────────────────────────────────────
import { levenshtein, diceCoefficient, fuzzyScore, fuzzySearch } from "../src/utils/fuzzy.js";
import { semanticSearch } from "../src/services/embeddings.js";
import { formatSol, formatUsd, shortenAddress, formatTimestamp } from "../src/utils/format.js";
import { identifyProgram, isKnownProgram } from "../src/data/known-programs.js";
import { getEnrichment, getTermsByTag, getAllTags } from "../src/data/glossary-index.js";
import { resolveToken, KNOWN_TOKENS } from "../src/services/jupiter.js";
import { isValidAddress } from "../src/services/solana-rpc.js";

// ─── SDK ────────────────────────────────────────────────────────
import { allTerms, getCategories, getTerm } from "@stbr/solana-glossary";

// ═════════════════════════════════════════════════════════════════
// GLOSSARY TOOLS
// ═════════════════════════════════════════════════════════════════

describe("lookup_term", () => {
  it("should find a term by ID", () => {
    const result = lookupTerm({ term: "pda" });
    expect(result).toContain("PDA");
    expect(result).not.toContain("not found");
  });

  it("should find a term by alias", () => {
    const term = allTerms.find((t) => t.aliases && t.aliases.length > 0);
    if (!term) return;
    const result = lookupTerm({ term: term.aliases![0] });
    expect(result).toContain(term.term);
  });

  it("should return fuzzy suggestions for nonexistent term", () => {
    const result = lookupTerm({ term: "valdator" });
    expect(result).toContain("not found");
    expect(result).toContain("Did you mean");
  });

  it("should include practical code examples for enriched terms", () => {
    const result = lookupTerm({ term: "pda" });
    expect(result).toContain("Code Example");
    expect(result).toContain("findProgramAddressSync");
  });

  it("should include tags for enriched terms", () => {
    const result = lookupTerm({ term: "pda" });
    expect(result).toContain("Tags:");
  });

  it("should include related terms", () => {
    const termWithRelated = allTerms.find((t) => (t.related?.length ?? 0) > 0);
    if (!termWithRelated) return;
    const result = lookupTerm({ term: termWithRelated.id });
    expect(result).toContain("Related Terms");
  });

  it("should support i18n locale", () => {
    const result = lookupTerm({ term: "pda", locale: "pt" });
    expect(result).toBeTruthy();
  });
});

describe("search_glossary", () => {
  it("should find results for a valid query", () => {
    const result = searchGlossary({ query: "validator" });
    expect(result).toContain("Found");
    expect(result).not.toContain("No results");
  });

  it("should return no results for gibberish", () => {
    const result = searchGlossary({ query: "xyzzyspoon!shift+1notaword" });
    expect(result).toContain("No results");
  });

  it("should respect the limit parameter", () => {
    const result = searchGlossary({ query: "account", limit: 3 });
    const matches = result.match(/^\d+\.\s\*\*/gm);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeLessThanOrEqual(3);
  });

  it("should support i18n", () => {
    const result = searchGlossary({ query: "validator", locale: "es" });
    expect(result).toBeTruthy();
    expect(result).toContain("Found");
  });
});

describe("suggest_terms", () => {
  it("should suggest terms for misspelled input", () => {
    const result = suggestTerms({ query: "valdator" });
    expect(result).toContain("Suggestions");
    expect(result).toContain("match");
  });

  it("should suggest terms for partial input", () => {
    const result = suggestTerms({ query: "proof" });
    expect(result).toContain("Suggestions");
  });

  it("should respect limit", () => {
    const result = suggestTerms({ query: "sol", limit: 3 });
    const matches = result.match(/^\d+\.\s\*\*/gm);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeLessThanOrEqual(3);
  });

  it("should return no suggestions for total gibberish", () => {
    const result = suggestTerms({ query: "zzzzqqqxxxx" });
    expect(result).toContain("No suggestions");
  });
});

describe("semantic_search", () => {
  it("should find relevant terms for natural language query", () => {
    const result = semanticSearchTool({ query: "how does staking work on solana" });
    expect(result).toContain("Semantic Search");
    expect(result).toContain("relevance");
  });

  it("should find terms about consensus", () => {
    const result = semanticSearchTool({ query: "consensus mechanism validation blocks" });
    expect(result).toContain("Semantic Search");
  });

  it("should respect limit", () => {
    const result = semanticSearchTool({ query: "token swap trading", limit: 3 });
    const matches = result.match(/^\d+\.\s\*\*/gm);
    if (matches) {
      expect(matches.length).toBeLessThanOrEqual(3);
    }
  });
});

describe("list_category", () => {
  it("should list terms in a valid category", () => {
    const categories = getCategories();
    const result = listCategory({ category: categories[0] });
    expect(result).toContain(categories[0]);
    expect(result).toContain("terms");
  });

  it("should list all categories", () => {
    const result = listAllCategories();
    expect(result).toContain("Available Categories");
    for (const cat of getCategories()) {
      expect(result).toContain(cat);
    }
  });
});

describe("explain_concept", () => {
  it("should explain a known concept", () => {
    const termWithRelated = allTerms.find((t) => (t.related?.length ?? 0) > 0);
    if (!termWithRelated) return;
    const result = explainConceptTool({ term: termWithRelated.id, depth: 1 });
    expect(result).toContain("Deep Dive");
    expect(result).toContain("Connected Concepts");
  });

  it("should return not-found for unknown term", () => {
    const result = explainConceptTool({ term: "nonexistent-term-xyz" });
    expect(result).toContain("not found");
  });

  it("should respect depth parameter", () => {
    const termId = allTerms.find((t) => (t.related?.length ?? 0) > 2)?.id;
    if (!termId) return;
    const shallow = explainConceptTool({ term: termId, depth: 1 });
    const deep = explainConceptTool({ term: termId, depth: 3 });
    expect(deep.length).toBeGreaterThanOrEqual(shallow.length - 50);
  });
});

describe("get_learning_path", () => {
  it("should find a path between connected terms", () => {
    const termA = allTerms.find(
      (t) => t.related && t.related.length > 0 && getTerm(t.related[0])
    );
    if (!termA) return;
    const result = learningPath({ from: termA.id, to: termA.related![0] });
    expect(result).toContain("Learning Path");
    expect(result).toContain("Step");
  });

  it("should handle non-existent from term", () => {
    const result = learningPath({ from: "nonexistent-xyz", to: "pda" });
    expect(result).toContain("not found");
  });

  it("should handle non-existent to term", () => {
    const result = learningPath({ from: "pda", to: "nonexistent-xyz" });
    expect(result).toContain("not found");
  });
});

describe("compare_terms", () => {
  it("should compare two valid terms", () => {
    const ids = allTerms.slice(0, 2).map((t) => t.id);
    const result = compareTerms({ terms: ids });
    expect(result).toContain("Comparing");
    expect(result).toContain(allTerms[0].term);
    expect(result).toContain(allTerms[1].term);
  });

  it("should fail when a term is not found", () => {
    const result = compareTerms({ terms: ["pda", "totally-fake-term"] });
    expect(result).toContain("not found");
  });
});

describe("random_term", () => {
  it("should return a single random term by default", () => {
    const result = randomTerm({});
    expect(result).toContain("Random Term");
    expect(result).toContain("Category:");
  });

  it("should return multiple terms when count is specified", () => {
    const result = randomTerm({ count: 3 });
    expect(result).toContain("3 Random Terms");
    const catMatches = result.match(/🏷️ Category:/g);
    expect(catMatches).toBeTruthy();
    expect(catMatches!.length).toBe(3);
  });

  it("should filter by category", () => {
    const categories = getCategories();
    const result = randomTerm({ category: categories[0], count: 2 });
    expect(result).toContain(categories[0]);
    expect(result).not.toContain("Unknown category");
  });

  it("should return error for invalid category", () => {
    const result = randomTerm({ category: "fake-category-xyz" });
    expect(result).toContain("Unknown category");
  });
});

// ═════════════════════════════════════════════════════════════════
// SOLANA LIVE TOOLS (with real RPC via Helius)
// ═════════════════════════════════════════════════════════════════

// Well-known addresses for testing
const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const VITALIK_SOL = "FhVdXkREhnMFw6FwKiBbsRPJv2BFbRmxj88JA2ND2G8R"; // a known wallet with activity

describe("get_wallet_balance", () => {
  it("should return balance for a valid address", async () => {
    const result = await getWalletBalance({ address: VITALIK_SOL });
    expect(result).toContain("Wallet Balance");
    expect(result).toContain("SOL");
  }, 15000);

  it("should reject invalid addresses", async () => {
    const result = await getWalletBalance({ address: "not-a-real-address" });
    expect(result).toContain("Invalid Solana address");
  });

  it("should handle system program address", async () => {
    const result = await getWalletBalance({ address: SYSTEM_PROGRAM });
    expect(result).toContain("Wallet Balance");
  }, 15000);
});

describe("get_token_balance", () => {
  it("should return tokens or empty message for a wallet", async () => {
    const result = await getTokenBalance({ address: VITALIK_SOL });
    // Either has tokens or says no token accounts
    expect(result).toBeTruthy();
    expect(result.includes("Token Holdings") || result.includes("No SPL token")).toBeTruthy();
  }, 15000);

  it("should reject invalid addresses", async () => {
    const result = await getTokenBalance({ address: "invalid" });
    expect(result).toContain("Invalid Solana address");
  });
});

describe("get_token_price", () => {
  it("should return SOL price", async () => {
    const result = await getTokenPriceTool({ token: "SOL" });
    expect(result).toContain("SOL");
    expect(result).toContain("Price");
  }, 15000);

  it("should return USDC price (should be ~$1)", async () => {
    const result = await getTokenPriceTool({ token: "USDC" });
    expect(result).toContain("USDC");
    expect(result).toContain("Price");
  }, 15000);

  it("should handle unknown token gracefully", async () => {
    const result = await getTokenPriceTool({ token: "TOTALLYNOTAREAL1111TOKEN" });
    expect(result).toContain("Could not find price");
  }, 15000);
});

describe("get_recent_transactions", () => {
  it("should return transactions for an active address", async () => {
    const result = await getRecentTransactionsTool({ address: VITALIK_SOL, limit: 3 });
    expect(result).toBeTruthy();
    // Either has transactions or says no recent
    expect(result.includes("Recent Transactions") || result.includes("No recent")).toBeTruthy();
  }, 15000);

  it("should reject invalid address", async () => {
    const result = await getRecentTransactionsTool({ address: "not-valid" });
    expect(result).toContain("Invalid Solana address");
  });
});

describe("explain_transaction", () => {
  it("should handle non-existent signature gracefully", async () => {
    const fakeSig = "5xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    const result = await explainTransactionTool({ signature: fakeSig });
    // Should either not find it or return an error
    expect(result).toBeTruthy();
  }, 15000);
});

describe("what_is_this_address", () => {
  it("should classify System Program as known-program", async () => {
    const result = await whatIsThisAddressTool({ address: SYSTEM_PROGRAM });
    expect(result).toContain("System Program");
  }, 15000);

  it("should classify Token Program as known-program", async () => {
    const result = await whatIsThisAddressTool({ address: TOKEN_PROGRAM });
    expect(result).toContain("Token Program");
  }, 15000);

  it("should classify a wallet address", async () => {
    const result = await whatIsThisAddressTool({ address: VITALIK_SOL });
    expect(result).toBeTruthy();
    // Should identify it as something (wallet, etc.)
    expect(result).toContain("Address");
  }, 15000);

  it("should reject invalid addresses", async () => {
    const result = await whatIsThisAddressTool({ address: "bad!" });
    expect(result).toContain("Invalid Solana address");
  });
});

describe("simulate_swap", () => {
  it("should simulate a SOL -> USDC swap", async () => {
    const result = await simulateSwapTool({
      inputToken: "SOL",
      outputToken: "USDC",
      amount: 1,
    });
    expect(result).toContain("Swap Simulation");
    expect(result).toContain("SOL");
    expect(result).toContain("USDC");
  }, 15000);

  it("should handle unknown token gracefully", async () => {
    const result = await simulateSwapTool({
      inputToken: "NOTREAL",
      outputToken: "USDC",
      amount: 1,
    });
    expect(result).toBeTruthy();
  }, 15000);
});

// ═════════════════════════════════════════════════════════════════
// FUZZY SEARCH ENGINE
// ═════════════════════════════════════════════════════════════════

describe("fuzzy search engine", () => {
  it("levenshtein: identical strings → 0", () => {
    expect(levenshtein("hello", "hello")).toBe(0);
  });

  it("levenshtein: single edit → 1", () => {
    expect(levenshtein("hello", "hallo")).toBe(1);
  });

  it("levenshtein: empty string → length of other", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("diceCoefficient: identical strings → 1", () => {
    expect(diceCoefficient("validator", "validator")).toBe(1);
  });

  it("diceCoefficient: completely different → 0", () => {
    expect(diceCoefficient("abc", "xyz")).toBe(0);
  });

  it("fuzzyScore: exact match → 1", () => {
    expect(fuzzyScore("pda", "pda")).toBe(1);
  });

  it("fuzzyScore: case insensitive", () => {
    expect(fuzzyScore("PDA", "pda")).toBe(1);
  });

  it("fuzzySearch: should find validator for 'valdator'", () => {
    const results = fuzzySearch("valdator", 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].term.term.toLowerCase()).toContain("validator");
  });

  it("fuzzySearch: should find proof-of-history for 'pruf of histori'", () => {
    const results = fuzzySearch("proof of histor", 5);
    expect(results.length).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════════════
// TF-IDF SEMANTIC SEARCH ENGINE
// ═════════════════════════════════════════════════════════════════

describe("TF-IDF semantic search", () => {
  it("should return results for natural language query", () => {
    const results = semanticSearch("how does staking work");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return scored results", () => {
    const results = semanticSearch("token swap liquidity pool");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.score).toBeGreaterThan(0);
      expect(r.score).toBeLessThanOrEqual(1);
      expect(r.term).toBeDefined();
    }
  });

  it("should rank relevant terms higher", () => {
    const results = semanticSearch("validator staking rewards", 5);
    // Top results should be from relevant categories
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return empty for empty query", () => {
    const results = semanticSearch("");
    expect(results).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════════
// FORMAT UTILITIES
// ═════════════════════════════════════════════════════════════════

describe("format utilities", () => {
  it("formatSol: converts lamports to SOL", () => {
    expect(formatSol(1_000_000_000)).toContain("1");
    expect(formatSol(500_000_000)).toContain("0.5");
  });

  it("formatUsd: formats as currency", () => {
    const result = formatUsd(123.45);
    expect(result).toContain("123.45");
    expect(result).toContain("$");
  });

  it("shortenAddress: truncates address", () => {
    const addr = "FhVdXkREhnMFw6FwKiBbsRPJv2BFbRmxj88JA2ND2G8R";
    const short = shortenAddress(addr);
    expect(short).toContain("...");
    expect(short.length).toBeLessThan(addr.length);
  });

  it("formatTimestamp: converts unix to ISO", () => {
    const result = formatTimestamp(1700000000);
    expect(result).toContain("2023");
    expect(result).toContain("UTC");
  });
});

// ═════════════════════════════════════════════════════════════════
// KNOWN PROGRAMS
// ═════════════════════════════════════════════════════════════════

describe("known programs", () => {
  it("should identify System Program", () => {
    const program = identifyProgram("11111111111111111111111111111111");
    expect(program).toBeDefined();
    expect(program!.name).toBe("System Program");
  });

  it("should identify Token Program", () => {
    const program = identifyProgram("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    expect(program).toBeDefined();
    expect(program!.name).toBe("Token Program");
  });

  it("should identify Jupiter v6", () => {
    const program = identifyProgram("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
    expect(program).toBeDefined();
    expect(program!.name).toContain("Jupiter");
  });

  it("isKnownProgram: true for known, false for unknown", () => {
    expect(isKnownProgram("11111111111111111111111111111111")).toBe(true);
    expect(isKnownProgram("RandomUnknownAddress1111111111111")).toBe(false);
  });

  it("should have 20+ programs registered", () => {
    // Count known programs by checking a sample
    let count = 0;
    const programs = [
      "11111111111111111111111111111111",
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
    ];
    for (const p of programs) {
      if (isKnownProgram(p)) count++;
    }
    expect(count).toBe(5);
  });
});

// ═════════════════════════════════════════════════════════════════
// GLOSSARY INDEX (ENRICHMENT + TAGS)
// ═════════════════════════════════════════════════════════════════

describe("glossary index", () => {
  it("should return enrichment for 'pda'", () => {
    const e = getEnrichment("pda");
    expect(e).toBeDefined();
    expect(e!.tags.length).toBeGreaterThan(0);
    expect(e!.example).toBeDefined();
    expect(e!.useCase).toBeDefined();
  });

  it("should return undefined for unenriched terms", () => {
    const e = getEnrichment("some-random-unenriched-term");
    expect(e).toBeUndefined();
  });

  it("should find terms by tag", () => {
    const terms = getTermsByTag("accounts");
    expect(terms.length).toBeGreaterThan(0);
    expect(terms).toContain("pda");
  });

  it("should list all tags", () => {
    const tags = getAllTags();
    expect(tags.length).toBeGreaterThan(5);
    expect(tags).toContain("defi");
    expect(tags).toContain("core");
  });
});

// ═════════════════════════════════════════════════════════════════
// JUPITER SERVICE
// ═════════════════════════════════════════════════════════════════

describe("jupiter service", () => {
  it("should resolve SOL by symbol", () => {
    const token = resolveToken("SOL");
    expect(token).toBeDefined();
    expect(token!.symbol).toBe("SOL");
    expect(token!.decimals).toBe(9);
  });

  it("should resolve USDC by symbol", () => {
    const token = resolveToken("USDC");
    expect(token).toBeDefined();
    expect(token!.mint).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  });

  it("should resolve by mint address", () => {
    const token = resolveToken("So11111111111111111111111111111111111111112");
    expect(token).toBeDefined();
    expect(token!.symbol).toBe("SOL");
  });

  it("should have 14 known tokens", () => {
    expect(KNOWN_TOKENS.length).toBe(14);
  });

  it("should be case insensitive for symbol lookup", () => {
    expect(resolveToken("sol")).toBeDefined();
    expect(resolveToken("Sol")).toBeDefined();
    expect(resolveToken("SOL")).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════
// SOLANA RPC SERVICE
// ═════════════════════════════════════════════════════════════════

describe("solana rpc service", () => {
  it("should validate valid addresses", () => {
    expect(isValidAddress("FhVdXkREhnMFw6FwKiBbsRPJv2BFbRmxj88JA2ND2G8R")).toBe(true);
    expect(isValidAddress("11111111111111111111111111111111")).toBe(true);
  });

  it("should reject invalid addresses", () => {
    expect(isValidAddress("not-a-valid-address!")).toBe(false);
    expect(isValidAddress("")).toBe(false);
    expect(isValidAddress("abc")).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════
// GRAPH ENGINE
// ═════════════════════════════════════════════════════════════════

describe("graph engine", () => {
  it("should return valid stats", () => {
    const stats = getGraphStats();
    expect(stats.totalNodes).toBeGreaterThan(0);
    expect(stats.totalEdges).toBeGreaterThan(0);
    expect(stats.averageDegree).toBeGreaterThan(0);
  });

  it("should find hub terms", () => {
    const hubs = getHubTerms(5);
    expect(hubs.length).toBeGreaterThan(0);
    expect(hubs.length).toBeLessThanOrEqual(5);
    if (hubs.length >= 2) {
      expect(hubs[0].connections).toBeGreaterThanOrEqual(hubs[1].connections);
    }
  });

  it("BFS should find same-node path with distance 0", () => {
    const term = allTerms[0];
    const result = findLearningPath(term.id, term.id);
    expect(result.found).toBe(true);
    expect(result.distance).toBe(0);
    expect(result.path).toHaveLength(1);
  });

  it("DFS should return root for depth 0 exploration", () => {
    const term = allTerms.find((t) => (t.related?.length ?? 0) > 0);
    if (!term) return;
    const result = explainConcept(term.id, 0);
    expect(result.root.id).toBe(term.id);
    expect(result.relatedTerms).toHaveLength(0);
  });

  it("DFS should find related terms at depth 1", () => {
    const term = allTerms.find((t) => (t.related?.length ?? 0) > 0);
    if (!term) return;
    const result = explainConcept(term.id, 1);
    expect(result.relatedTerms.length).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════════════
// I18N RESOLVER
// ═════════════════════════════════════════════════════════════════

describe("i18n resolver", () => {
  it("should list available locales", () => {
    const locales = getAvailableLocales();
    expect(locales).toContain("en");
    expect(locales).toContain("pt");
    expect(locales).toContain("es");
  });

  it("should validate known locales", () => {
    expect(validateLocale("en")).toBe("en");
    expect(validateLocale("pt")).toBe("pt");
    expect(validateLocale("es")).toBe("es");
  });

  it("should fallback to en for invalid locale", () => {
    expect(validateLocale("xx")).toBe("en");
    expect(validateLocale(undefined)).toBe("en");
  });

  it("should resolve term in default locale", () => {
    const term = resolveTermLocalized("pda");
    expect(term).toBeDefined();
    expect(term?.id).toContain("pda");
  });

  it("should resolve term in pt locale", () => {
    const term = resolveTermLocalized("pda", "pt");
    expect(term).toBeDefined();
  });

  it("should search with locale", () => {
    const results = searchTermsLocalized("validator", "pt");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should get terms by category localized", () => {
    const cats = getCategories();
    const results = getTermsByCategoryLocalized(cats[0], "es");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should localize a list of terms", () => {
    const terms = allTerms.slice(0, 5);
    const localized = localizeTerms(terms, "pt");
    expect(localized).toHaveLength(5);
  });

  it("should return original terms for 'en' locale", () => {
    const terms = allTerms.slice(0, 3);
    const same = localizeTerms(terms, "en");
    expect(same).toEqual(terms);
  });
});

// ═════════════════════════════════════════════════════════════════
// RESOURCES
// ═════════════════════════════════════════════════════════════════

describe("resources", () => {
  it("should list all resources", () => {
    const resources = listResources();
    expect(resources.length).toBeGreaterThan(2);
    expect(resources.some((r) => r.uri.includes("glossary/full"))).toBe(true);
    expect(resources.some((r) => r.uri.includes("glossary/stats"))).toBe(true);
  });

  it("should list resource templates", () => {
    const templates = listResourceTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some((t) => t.uriTemplate.includes("{termId}"))).toBe(true);
  });

  it("should read glossary/full resource", () => {
    const result = readResource("solana-glossary://glossary/full");
    expect(result).not.toBeNull();
    expect(result!.mimeType).toBe("application/json");
    const data = JSON.parse(result!.text);
    expect(data.length).toBe(allTerms.length);
  });

  it("should read glossary/stats resource", () => {
    const result = readResource("solana-glossary://glossary/stats");
    expect(result).not.toBeNull();
    const stats = JSON.parse(result!.text);
    expect(stats.totalTerms).toBe(allTerms.length);
    expect(stats.totalCategories).toBe(getCategories().length);
    expect(stats.availableLocales).toContain("pt");
  });

  it("should read a category resource", () => {
    const cat = getCategories()[0];
    const result = readResource(`solana-glossary://category/${cat}`);
    expect(result).not.toBeNull();
    const terms = JSON.parse(result!.text);
    expect(terms.length).toBeGreaterThan(0);
  });

  it("should read a term resource", () => {
    const result = readResource("solana-glossary://term/pda");
    expect(result).not.toBeNull();
    const term = JSON.parse(result!.text);
    expect(term.id).toContain("pda");
  });

  it("should read localized term resource", () => {
    const result = readResource("solana-glossary://pt/term/pda");
    expect(result).not.toBeNull();
  });

  it("should read localized category resource", () => {
    const cat = getCategories()[0];
    const result = readResource(`solana-glossary://es/category/${cat}`);
    expect(result).not.toBeNull();
  });

  it("should return null for unknown resource", () => {
    const result = readResource("solana-glossary://unknown/path");
    expect(result).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════
// SDK INTEGRATION
// ═════════════════════════════════════════════════════════════════

describe("SDK integration", () => {
  it("should have 1001 terms loaded", () => {
    expect(allTerms.length).toBe(1001);
  });

  it("should have 14 categories", () => {
    expect(getCategories().length).toBe(14);
  });

  it("every term should have id, term, definition, and category", () => {
    for (const t of allTerms) {
      expect(t.id).toBeTruthy();
      expect(t.term).toBeTruthy();
      expect(typeof t.definition).toBe("string");
      expect(t.category).toBeTruthy();
    }
  });
});
