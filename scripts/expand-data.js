#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const termsDir = path.join(rootDir, "data", "terms");
const defaultManifestPath = path.join(rootDir, "data", "expansion", "sources.json");
const defaultOutPath = path.join(rootDir, "data", "expansion", "last-report.json");

const STOP_PHRASES = new Set([
  "Solana",
  "GitHub",
  "README",
  "Getting Started",
  "Introduction",
  "Overview",
  "Documentation",
  "Guides",
  "Reference",
  "Learn More",
  "Quick Start",
  "Mainnet Beta",
]);

function parseArgs(argv) {
  const args = {
    manifest: defaultManifestPath,
    out: defaultOutPath,
    limit: 25,
    minScore: 4,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--manifest") args.manifest = argv[index + 1];
    if (value === "--out") args.out = argv[index + 1];
    if (value === "--limit") args.limit = Number(argv[index + 1]);
    if (value === "--min-score") args.minScore = Number(argv[index + 1]);
  }

  return args;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function stripHtml(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractStructuredText(rawText) {
  const headings = [];
  const markdownHeadings = rawText.matchAll(/^\s{0,3}#{1,6}\s+(.+)$/gm);
  for (const match of markdownHeadings) {
    headings.push(match[1].trim());
  }

  const htmlHeadings = rawText.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gims);
  for (const match of htmlHeadings) {
    headings.push(stripHtml(match[1]));
  }

  const titleMatch = rawText.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : "";
  const text = rawText.includes("<html") || rawText.includes("<!DOCTYPE")
    ? stripHtml(rawText)
    : rawText.replace(/\r/g, "");

  return { headings, text, title };
}

function loadGlossaryTerms() {
  const files = fs.readdirSync(termsDir).filter((file) => file.endsWith(".json"));
  const terms = [];
  for (const file of files) {
    terms.push(...JSON.parse(fs.readFileSync(path.join(termsDir, file), "utf8")));
  }
  return terms;
}

function buildExistingIndex(terms) {
  const index = new Set();
  for (const term of terms) {
    index.add(term.id.toLowerCase());
    index.add(term.term.toLowerCase());
    for (const alias of term.aliases ?? []) {
      index.add(alias.toLowerCase());
    }
  }
  return index;
}

function extractCandidatePhrases(structured, existingIndex) {
  const bag = new Map();
  const titleLikePhrases = [];

  for (const heading of structured.headings) {
    titleLikePhrases.push(heading);
  }
  if (structured.title) titleLikePhrases.push(structured.title);

  const phrasePattern = /\b(?:[A-Z][a-z0-9]+|[A-Z]{2,})(?:[ -](?:[A-Z][a-z0-9]+|[A-Z]{2,}|[0-9]{2,})){0,4}\b/g;
  const inlineMatches = structured.text.match(phrasePattern) ?? [];
  titleLikePhrases.push(...inlineMatches);

  for (const rawPhrase of titleLikePhrases) {
    const cleaned = rawPhrase
      .replace(/[`*_()[\]{}:;,.!?/\\]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned || cleaned.length < 4 || cleaned.length > 60) continue;
    if (STOP_PHRASES.has(cleaned)) continue;
    if (!cleaned.includes(" ") && !/[0-9]/.test(cleaned) && !/^[A-Z]{2,}$/.test(cleaned)) continue;

    const id = slugify(cleaned);
    if (!id || id.length < 3) continue;
    if (existingIndex.has(cleaned.toLowerCase()) || existingIndex.has(id)) continue;

    const current = bag.get(id) ?? {
      id,
      term: titleCase(cleaned),
      score: 0,
      occurrences: 0,
    };

    current.occurrences += 1;
    current.score += structured.headings.includes(rawPhrase) ? 4 : 1;
    if (structured.title && rawPhrase === structured.title) current.score += 3;
    bag.set(id, current);
  }

  return [...bag.values()];
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildReviewCandidates(terms, sourceText, sourceId) {
  const results = [];

  for (const term of terms) {
    const names = [term.term, ...(term.aliases ?? [])]
      .map((value) => value.trim())
      .filter(Boolean)
      .sort((left, right) => right.length - left.length);

    if (names.length === 0) continue;

    const regex = new RegExp(`\\b(${names.map(escapeRegex).join("|")})\\b`, "gi");
    const matches = sourceText.match(regex);
    if (!matches || matches.length === 0) continue;

    results.push({
      id: term.id,
      term: term.term,
      category: term.category,
      mentions: matches.length,
      sourceId,
      reviewReason:
        term.definition.length < 180
          ? "Frequently mentioned and definition is relatively short."
          : "Frequently mentioned in watched sources.",
    });
  }

  return results;
}

async function readInput(input, manifestDir) {
  if (/^https?:\/\//i.test(input)) {
    const response = await fetch(input, {
      headers: { "user-agent": "solana-glossary-expansion-bot/0.1" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.text();
  }

  const resolvedPath = path.isAbsolute(input) ? input : path.join(manifestDir, input);
  return fs.readFileSync(resolvedPath, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(args.manifest);
  const manifestDir = path.dirname(manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const terms = loadGlossaryTerms();
  const existingIndex = buildExistingIndex(terms);

  const candidateMap = new Map();
  const reviewMap = new Map();
  const fetchFailures = [];
  const scannedSources = [];

  for (const source of manifest.sources ?? []) {
    for (const input of source.inputs ?? []) {
      try {
        const rawText = await readInput(input, manifestDir);
        const structured = extractStructuredText(rawText);
        const extractedCandidates = extractCandidatePhrases(structured, existingIndex);
        const extractedReviews = buildReviewCandidates(terms, structured.text, source.id);

        scannedSources.push({
          id: source.id,
          label: source.label,
          input,
          candidateHits: extractedCandidates.length,
          reviewHits: extractedReviews.length,
        });

        for (const candidate of extractedCandidates) {
          const current = candidateMap.get(candidate.id) ?? {
            id: candidate.id,
            term: candidate.term,
            score: 0,
            occurrences: 0,
            categoryHint: source.categoryHint ?? null,
            sources: [],
          };

          current.score += candidate.score;
          current.occurrences += candidate.occurrences;
          current.sources.push({ id: source.id, label: source.label, input });
          candidateMap.set(candidate.id, current);
        }

        for (const review of extractedReviews) {
          const current = reviewMap.get(review.id) ?? {
            id: review.id,
            term: review.term,
            category: review.category,
            mentions: 0,
            sources: [],
            reviewReason: review.reviewReason,
          };

          current.mentions += review.mentions;
          current.sources.push({ id: source.id, label: source.label, mentions: review.mentions });
          reviewMap.set(review.id, current);
        }
      } catch (error) {
        fetchFailures.push({
          sourceId: source.id,
          label: source.label,
          input,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const candidates = [...candidateMap.values()]
    .filter((entry) => entry.score >= args.minScore)
    .sort((left, right) => right.score - left.score || left.term.localeCompare(right.term))
    .slice(0, args.limit);

  const reviewCandidates = [...reviewMap.values()]
    .filter((entry) => entry.mentions >= 2)
    .sort((left, right) => right.mentions - left.mentions || left.term.localeCompare(right.term))
    .slice(0, args.limit);

  const report = {
    generatedAt: new Date().toISOString(),
    manifest: path.relative(rootDir, manifestPath),
    summary: {
      glossaryTerms: terms.length,
      scannedSources: scannedSources.length,
      fetchFailures: fetchFailures.length,
      candidates: candidates.length,
      reviewCandidates: reviewCandidates.length,
    },
    scannedSources,
    candidates,
    reviewCandidates,
    fetchFailures,
  };

  ensureDir(args.out);
  fs.writeFileSync(args.out, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Expansion report written to ${path.relative(rootDir, path.resolve(args.out))}`);
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Review candidates: ${reviewCandidates.length}`);
  console.log(`Fetch failures: ${fetchFailures.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
