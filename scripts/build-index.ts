#!/usr/bin/env tsx
import {
  OUTPUT_FILE,
  buildChunks,
  embedTexts,
  parseFlag,
  parseIntFlag,
  writeIndex,
} from "./rag-shared";

async function main() {
  const args = process.argv.slice(2);
  const model = parseFlag(args, "--model") ?? "text-embedding-3-small";
  const batchSize = parseIntFlag(args, "--batch", 64);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Export it before running rag:build.",
    );
  }

  console.log("Building RAG chunks from glossary data...");
  const chunks = await buildChunks();
  console.log(`Built ${chunks.length} chunks (en + pt-BR + es).`);

  const vectors = await embedTexts(
    chunks.map((x) => x.text),
    model,
    apiKey,
    batchSize,
  );

  if (vectors.length === 0 || vectors[0].length === 0) {
    throw new Error("No embeddings returned by provider.");
  }

  const index = {
    model,
    createdAt: new Date().toISOString(),
    dims: vectors[0].length,
    chunks,
    vectors,
  };

  await writeIndex(index);
  console.log(`Index written to ${OUTPUT_FILE}`);
  console.log(`Vector dims: ${index.dims}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
