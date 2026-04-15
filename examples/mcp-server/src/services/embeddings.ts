/**
 * TF-IDF Semantic Search Engine
 *
 * Zero-dependency implementation that indexes glossary terms
 * and supports natural language queries.
 */

import { allTerms, type GlossaryTerm } from "@stbr/solana-glossary";

interface TermVector {
  termId: string;
  tfidf: Map<string, number>;
  magnitude: number;
}

// Stopwords to exclude from indexing
const STOPWORDS = new Set([
  "a", "an", "the", "is", "it", "in", "on", "of", "to", "for", "and", "or",
  "that", "this", "with", "as", "by", "at", "from", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "can", "which", "who", "what",
  "when", "where", "how", "not", "no", "but", "if", "than", "then", "so",
  "its", "they", "their", "them", "we", "us", "our", "you", "your",
  "he", "she", "his", "her", "all", "each", "every", "both", "more",
  "some", "any", "such", "only", "also", "very", "just", "about",
  "up", "out", "into", "over", "after", "between", "through",
]);

/** Tokenize and normalize a text string */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/** Compute term frequency for a document */
function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }
  // Normalize by document length
  for (const [key, val] of freq) {
    freq.set(key, val / tokens.length);
  }
  return freq;
}

/** Build the search index (runs once at import time) */
class TfIdfIndex {
  private documents: TermVector[] = [];
  private idf: Map<string, number> = new Map();
  private docCount: number = 0;

  constructor() {
    this.buildIndex();
  }

  private buildIndex(): void {
    const allTokenSets: Array<{ termId: string; tokens: string[] }> = [];
    const docFreq = new Map<string, number>();

    // Tokenize all documents
    for (const term of allTerms) {
      const text = [term.term, term.definition, ...(term.aliases ?? [])].join(" ");
      const tokens = tokenize(text);
      allTokenSets.push({ termId: term.id, tokens });

      // Count document frequency
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        docFreq.set(token, (docFreq.get(token) ?? 0) + 1);
      }
    }

    this.docCount = allTokenSets.length;

    // Compute IDF
    for (const [token, df] of docFreq) {
      this.idf.set(token, Math.log(this.docCount / (1 + df)));
    }

    // Compute TF-IDF vectors
    for (const { termId, tokens } of allTokenSets) {
      const tf = termFrequency(tokens);
      const tfidf = new Map<string, number>();
      let magnitude = 0;

      for (const [token, tfVal] of tf) {
        const idfVal = this.idf.get(token) ?? 0;
        const score = tfVal * idfVal;
        tfidf.set(token, score);
        magnitude += score * score;
      }

      magnitude = Math.sqrt(magnitude);
      this.documents.push({ termId, tfidf, magnitude });
    }
  }

  /** Search with a natural language query, returns scored results */
  search(query: string, limit = 10): Array<{ termId: string; score: number }> {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryTf = termFrequency(queryTokens);
    const queryTfidf = new Map<string, number>();
    let queryMagnitude = 0;

    for (const [token, tfVal] of queryTf) {
      const idfVal = this.idf.get(token) ?? Math.log(this.docCount);
      const score = tfVal * idfVal;
      queryTfidf.set(token, score);
      queryMagnitude += score * score;
    }
    queryMagnitude = Math.sqrt(queryMagnitude);

    if (queryMagnitude === 0) return [];

    // Cosine similarity
    const results: Array<{ termId: string; score: number }> = [];

    for (const doc of this.documents) {
      if (doc.magnitude === 0) continue;

      let dotProduct = 0;
      for (const [token, qScore] of queryTfidf) {
        const dScore = doc.tfidf.get(token);
        if (dScore !== undefined) {
          dotProduct += qScore * dScore;
        }
      }

      const similarity = dotProduct / (queryMagnitude * doc.magnitude);
      if (similarity > 0.01) {
        results.push({ termId: doc.termId, score: similarity });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}

// Singleton index — built once at startup
let _index: TfIdfIndex | null = null;

function getIndex(): TfIdfIndex {
  if (!_index) {
    _index = new TfIdfIndex();
  }
  return _index;
}

export interface SemanticResult {
  term: GlossaryTerm;
  score: number;
}

/**
 * Semantic search across the glossary using TF-IDF + cosine similarity.
 * Accepts natural language queries like "how does staking work on solana?"
 */
export function semanticSearch(query: string, limit = 10): SemanticResult[] {
  const index = getIndex();
  const results = index.search(query, limit);

  const termMap = new Map(allTerms.map((t) => [t.id, t]));

  return results
    .map((r) => {
      const term = termMap.get(r.termId);
      if (!term) return null;
      return { term, score: r.score };
    })
    .filter((r): r is SemanticResult => r !== null);
}
