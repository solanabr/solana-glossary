#!/usr/bin/env tsx
import {
  OUTPUT_FILE,
  RagChunk,
  cosine,
  embedTexts,
  finalScore,
  parseFlag,
  parseIntFlag,
  parseLang,
  readIndex,
} from "./rag-shared";

type Ranked = {
  chunk: RagChunk;
  semantic: number;
  score: number;
};

function usage() {
  console.log(`
Usage:
  npm run rag:query -- "your question" [--lang en|pt-BR|es] [--k 8] [--max-chars 1800] [--index .rag/index.json] [--json]

Examples:
  npm run rag:query -- "how do PDAs and CPIs relate?"
  npm run rag:query -- "o que e fine tuning?" --lang pt-BR --k 6 --max-chars 1400
`);
}

function buildMarkdownContext(items: Ranked[], maxChars: number): string {
  const lines: string[] = [];
  let used = 0;

  for (const { chunk, score } of items) {
    const block =
      `- **${chunk.term}** (${chunk.category}, ${chunk.lang})\n` +
      `  - id: \`${chunk.termId}\`\n` +
      `  - score: ${score.toFixed(4)}\n` +
      `  - ${chunk.text.replace(/\n/g, "\n  - ")}\n`;

    if (used + block.length > maxChars) break;
    lines.push(block);
    used += block.length;
  }

  return lines.join("\n").trim();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }

  const query = args[0]?.trim();
  if (!query) {
    usage();
    throw new Error("Missing query string.");
  }

  const lang = parseLang(args);
  const k = parseIntFlag(args, "--k", 8);
  const maxChars = parseIntFlag(args, "--max-chars", 1800);
  const topSemanticPool = Math.max(k * 3, 15);
  const asJson = args.includes("--json");
  const indexPath = parseFlag(args, "--index") ?? OUTPUT_FILE;

  const index = await readIndex(indexPath);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Query uses embedding search, so the query must be embedded too.",
    );
  }

  const [queryVec] = await embedTexts([query], index.model, apiKey, 1);
  const candidates: Ranked[] = [];

  for (let i = 0; i < index.chunks.length; i++) {
    const chunk = index.chunks[i];
    if (lang && chunk.lang !== lang) continue;
    const semantic = cosine(queryVec, index.vectors[i]);
    candidates.push({
      chunk,
      semantic,
      score: semantic,
    });
  }

  const semanticTop = candidates
    .sort((a, b) => b.semantic - a.semantic)
    .slice(0, topSemanticPool);

  const reranked = semanticTop
    .map((item) => ({
      ...item,
      score: finalScore(query, item.chunk, item.semantic),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  const context = buildMarkdownContext(reranked, maxChars);
  const payload = {
    query,
    model: index.model,
    indexCreatedAt: index.createdAt,
    lang: lang ?? "all",
    requestedTopK: k,
    maxChars,
    hits: reranked.map((x) => ({
      termId: x.chunk.termId,
      term: x.chunk.term,
      category: x.chunk.category,
      lang: x.chunk.lang,
      score: Number(x.score.toFixed(6)),
      semantic: Number(x.semantic.toFixed(6)),
      related: x.chunk.related,
    })),
    contextMarkdown: context,
  };

  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`# Retrieved Glossary Context`);
  console.log(`- Query: ${query}`);
  console.log(`- Lang: ${lang ?? "all"}`);
  console.log(`- Model: ${index.model}`);
  console.log(`- Hits: ${payload.hits.length}`);
  console.log(`\n## Prompt-ready Context\n`);
  console.log(context);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
