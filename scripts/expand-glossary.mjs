#!/usr/bin/env node
/**
 * Solana Glossary — Data Expansion Script
 * 
 * Fetches content from Solana docs/repos and uses Claude AI to identify
 * missing terms and generate new glossary entries in the correct format.
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data/terms");
const OUTPUT_FILE = path.join(__dirname, "../data/terms/expansion-candidates.json");

// ── Load existing terms ──────────────────────────────────────────────────────
function loadExistingTerms() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json") && f !== "expansion-candidates.json");
  const terms = [];
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
    terms.push(...raw);
  }
  return terms;
}

// ── Fetch from URL ───────────────────────────────────────────────────────────
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "solana-glossary-expansion/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

// ── Call Claude API ──────────────────────────────────────────────────────────
async function callClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const body = JSON.stringify({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content[0].text);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Sources to fetch ─────────────────────────────────────────────────────────
const SOURCES = [
  {
    name: "Solana Docs — Core Concepts",
    url: "https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/core/accounts.mdx",
    category: "core-protocol",
  },
  {
    name: "Anchor Book — Programs",
    url: "https://raw.githubusercontent.com/coral-xyz/anchor/master/docs/src/pages/docs/the-program-model.md",
    category: "programming-model",
  },
  {
    name: "Solana Docs — Terminology",
    url: "https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/terminology.mdx",
    category: "core-protocol",
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔍 Loading existing terms...");
  const existing = loadExistingTerms();
  const existingIds = new Set(existing.map(t => t.id));
  const existingTermNames = existing.map(t => t.term.toLowerCase());
  console.log(`   Found ${existing.length} existing terms\n`);

  const categories = [...new Set(existing.map(t => t.category))];
  const allNewTerms = [];

  for (const source of SOURCES) {
    console.log(`📥 Fetching: ${source.name}`);
    let content = "";
    try {
      content = await fetchUrl(source.url);
      content = content.slice(0, 8000); // limit context
      console.log(`   Got ${content.length} chars\n`);
    } catch (e) {
      console.log(`   ⚠️  Failed to fetch: ${e.message}\n`);
      continue;
    }

    const existingList = existing.slice(0, 50).map(t => t.id).join(", ");

    const prompt = `You are expanding a Solana developer glossary. The glossary currently has ${existing.length} terms.

Here is content from "${source.name}":
---
${content}
---

Existing term IDs (sample): ${existingList}

Your task: Identify 5-10 Solana/blockchain concepts mentioned in the content above that are NOT already in the glossary, and generate proper glossary entries for them.

Rules:
- Only include terms genuinely relevant to Solana developers
- Skip terms already covered by the existing glossary
- Each term must be precise and technical
- Definitions should be 2-4 sentences, technical but clear
- Use kebab-case IDs
- Category must be one of: ${categories.join(", ")}
- related[] must reference existing term IDs when possible
- aliases[] for common abbreviations only

Respond with ONLY a JSON array, no markdown, no explanation:
[
  {
    "id": "kebab-case-id",
    "term": "Display Name",
    "definition": "Technical definition 2-4 sentences.",
    "category": "category-name",
    "aliases": ["ABBR"],
    "related": ["existing-term-id"]
  }
]`;

    console.log(`🤖 Asking Claude to identify new terms from ${source.name}...`);
    try {
      const response = await callClaude(prompt);
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const newTerms = JSON.parse(cleaned);

      // filter out duplicates
      const filtered = newTerms.filter(t => {
        if (existingIds.has(t.id)) return false;
        if (existingTermNames.includes(t.term.toLowerCase())) return false;
        return true;
      });

      console.log(`   ✅ Found ${filtered.length} new terms\n`);
      filtered.forEach(t => {
        console.log(`   + ${t.id} (${t.category})`);
        existingIds.add(t.id);
        existingTermNames.push(t.term.toLowerCase());
      });

      allNewTerms.push(...filtered);
      console.log();
    } catch (e) {
      console.log(`   ⚠️  Claude error: ${e.message}\n`);
    }

    // small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  // save results
  console.log(`\n💾 Saving ${allNewTerms.length} new term candidates to expansion-candidates.json`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allNewTerms, null, 2));

  console.log("\n✅ Done! Review expansion-candidates.json and merge into the appropriate category files.");
  console.log("\nSample output:");
  if (allNewTerms.length > 0) {
    console.log(JSON.stringify(allNewTerms[0], null, 2));
  }
}

main().catch(console.error);
