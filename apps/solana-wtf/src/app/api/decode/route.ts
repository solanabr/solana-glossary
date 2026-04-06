import { NextRequest } from "next/server";
import {
  getAllTerms,
  getRelatedTerms,
  CATEGORY_LABELS,
} from "@/lib/glossary";
import type { GlossaryTerm } from "@/lib/glossary";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MatchedTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  categoryLabel: string;
  related: Array<{ id: string; term: string }>;
  matchType: "exact" | "alias" | "partial";
  /** character indices in the original text where this term was found */
  positions: Array<{ start: number; end: number }>;
}

interface DecodeResponse {
  terms: MatchedTerm[];
  explanation: string;
  highlightedText: string;
}

/* ------------------------------------------------------------------ */
/*  Personality templates                                              */
/* ------------------------------------------------------------------ */

type PersonalityId = "maid" | "degen" | "glados" | "dm";

interface PersonalityTemplate {
  prefix: string;
  perTerm: (term: string, definition: string) => string;
  suffix: string;
  noTerms: string;
}

const PERSONALITIES: Record<PersonalityId, PersonalityTemplate> = {
  maid: {
    prefix:
      "Master~ let me help you understand this! \u2661\n\n",
    perTerm: (term, def) =>
      `So, **${term}** is like... ${def} Does that make sense? \u2728`,
    suffix:
      "\n\nI hope that helps, Master! Let me know if you need anything else~ \u2661",
    noTerms:
      "Hmm~ I looked really hard but I couldn't find any Solana terms in there, Master! Maybe try pasting an error message or a Solana concept? I believe in you! \u2728\u2661",
  },
  degen: {
    prefix:
      "ser, let me break this down for you. few understand this.\n\n",
    perTerm: (term, def) =>
      `**${term}** \u2014 ${def} this is actually based knowledge.`,
    suffix:
      "\n\nnfa, dyor. but now you're one step closer to not being ngmi. gm.",
    noTerms:
      "ser... there are no Solana terms here. are you sure you're not lost? paste an error, some code, or a tx and I'll decode it. wagmi.",
  },
  glados: {
    prefix:
      "Oh. You don't understand this. How... predictable. Let me explain with small words.\n\n",
    perTerm: (term, def) =>
      `**${term}**: ${def} I trust even you can grasp this elementary concept.`,
    suffix:
      "\n\nCongratulations. You are now marginally less ignorant. The Enrichment Center reminds you that understanding Solana does not make you a good person.",
    noTerms:
      "I searched the entire glossary and found absolutely nothing relevant in your input. This is somehow both impressive and deeply disappointing. Perhaps try pasting actual Solana content next time? Just a thought.",
  },
  dm: {
    prefix:
      "Brave adventurer! You have encountered ancient runes etched into the blockchain. Let me decipher them...\n\n",
    perTerm: (term, def) =>
      `The scroll reveals: **${term}** \u2014 ${def} Your Wisdom increases by +1.`,
    suffix:
      "\n\nYour quest log has been updated. May the validators smile upon your transactions, traveler!",
    noTerms:
      "Alas, adventurer! The runes you have presented contain no known blockchain incantations. Perhaps you have copied from the wrong scroll? Try bringing me a Solana error, spell fragment, or transaction rune.",
  },
};

/* ------------------------------------------------------------------ */
/*  Term-finding algorithm                                             */
/* ------------------------------------------------------------------ */

function findTermsInText(inputText: string): MatchedTerm[] {
  const allTerms = getAllTerms();
  const text = inputText;
  const textLower = text.toLowerCase();

  /**
   * We build a list of candidate phrases from the glossary:
   *   - the term name itself
   *   - each alias
   *   - the id (kebab-case, useful for error strings like "rent-exempt")
   *
   * Each candidate maps back to its source GlossaryTerm.
   */
  interface Candidate {
    phrase: string;
    phraseLower: string;
    source: GlossaryTerm;
    type: "exact" | "alias" | "partial";
  }

  const candidates: Candidate[] = [];

  for (const t of allTerms) {
    // Term name
    candidates.push({
      phrase: t.term,
      phraseLower: t.term.toLowerCase(),
      source: t,
      type: "exact",
    });

    // Aliases
    if (t.aliases) {
      for (const alias of t.aliases) {
        candidates.push({
          phrase: alias,
          phraseLower: alias.toLowerCase(),
          source: t,
          type: "alias",
        });
      }
    }

    // ID (kebab-case — useful for matching error strings)
    candidates.push({
      phrase: t.id,
      phraseLower: t.id.toLowerCase(),
      source: t,
      type: "partial",
    });
  }

  // Sort by phrase length descending so longer matches take precedence
  candidates.sort((a, b) => b.phraseLower.length - a.phraseLower.length);

  // Track which term IDs we've already matched, and all positions already claimed
  const matchedMap = new Map<string, MatchedTerm>();
  const claimedRanges: Array<{ start: number; end: number }> = [];

  function overlaps(start: number, end: number): boolean {
    return claimedRanges.some(
      (r) => start < r.end && end > r.start
    );
  }

  for (const candidate of candidates) {
    // Skip very short candidates (1-2 chars) to avoid noise — unless it's a known abbreviation
    if (candidate.phraseLower.length < 3) continue;

    // Find all occurrences of this candidate phrase in the text
    let searchStart = 0;
    const positions: Array<{ start: number; end: number }> = [];

    while (searchStart < textLower.length) {
      const idx = textLower.indexOf(candidate.phraseLower, searchStart);
      if (idx === -1) break;

      const end = idx + candidate.phraseLower.length;

      // Word boundary check: ensure we're matching whole words/phrases
      const charBefore = idx > 0 ? textLower[idx - 1] : " ";
      const charAfter = end < textLower.length ? textLower[end] : " ";
      const isBoundaryBefore = /[\s\-_.,;:!?()"'\[\]{}/\\`]/.test(charBefore) || idx === 0;
      const isBoundaryAfter = /[\s\-_.,;:!?()"'\[\]{}/\\`]/.test(charAfter) || end === textLower.length;

      if (isBoundaryBefore && isBoundaryAfter && !overlaps(idx, end)) {
        positions.push({ start: idx, end });
        claimedRanges.push({ start: idx, end });
      }

      searchStart = idx + 1;
    }

    if (positions.length > 0) {
      const termId = candidate.source.id;

      if (matchedMap.has(termId)) {
        // Merge positions into existing match
        const existing = matchedMap.get(termId)!;
        existing.positions.push(...positions);
        // Upgrade match type if this is a better match
        if (candidate.type === "exact" && existing.matchType !== "exact") {
          existing.matchType = "exact";
        } else if (candidate.type === "alias" && existing.matchType === "partial") {
          existing.matchType = "alias";
        }
      } else {
        // Resolve related terms
        const relatedTerms = getRelatedTerms(termId);
        const related = relatedTerms.map((rt) => ({
          id: rt.id,
          term: rt.term,
        }));

        matchedMap.set(termId, {
          id: termId,
          term: candidate.source.term,
          definition: candidate.source.definition,
          category: candidate.source.category,
          categoryLabel:
            CATEGORY_LABELS[candidate.source.category] ||
            candidate.source.category,
          related,
          matchType: candidate.type,
          positions,
        });
      }
    }
  }

  // Convert to array and score/sort
  const results = Array.from(matchedMap.values());

  results.sort((a, b) => {
    // Exact matches first
    const typeScore: Record<string, number> = {
      exact: 3,
      alias: 2,
      partial: 1,
    };
    const scoreDiff =
      (typeScore[b.matchType] || 0) - (typeScore[a.matchType] || 0);
    if (scoreDiff !== 0) return scoreDiff;

    // More occurrences = more relevant
    return b.positions.length - a.positions.length;
  });

  // Return max 10 terms
  return results.slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Build highlighted text                                             */
/* ------------------------------------------------------------------ */

function buildHighlightedText(
  originalText: string,
  terms: MatchedTerm[]
): string {
  // Collect all positions with their term IDs
  const markers: Array<{ start: number; end: number; termId: string }> = [];

  for (const t of terms) {
    for (const pos of t.positions) {
      markers.push({ start: pos.start, end: pos.end, termId: t.id });
    }
  }

  // Sort by start position
  markers.sort((a, b) => a.start - b.start);

  // Build the output with markers: [[termId::matched text]]
  let result = "";
  let cursor = 0;

  for (const marker of markers) {
    if (marker.start < cursor) continue; // skip overlapping
    result += originalText.slice(cursor, marker.start);
    const matchedText = originalText.slice(marker.start, marker.end);
    result += `[[${marker.termId}::${matchedText}]]`;
    cursor = marker.end;
  }

  result += originalText.slice(cursor);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Build personality explanation                                      */
/* ------------------------------------------------------------------ */

function buildExplanation(
  terms: MatchedTerm[],
  personalityId: string
): string {
  const personality =
    PERSONALITIES[personalityId as PersonalityId] || PERSONALITIES.degen;

  if (terms.length === 0) {
    return personality.noTerms;
  }

  const parts: string[] = [personality.prefix];

  for (const t of terms) {
    parts.push(personality.perTerm(t.term, t.definition));
    parts.push(""); // blank line between terms
  }

  parts.push(personality.suffix);
  return parts.join("\n");
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, personality } = body as {
      text: string;
      personality: string;
    };

    if (!text || typeof text !== "string") {
      return Response.json(
        { error: "Missing or invalid 'text' field." },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return Response.json(
        { error: "Input text is too long. Max 5000 characters." },
        { status: 400 }
      );
    }

    const VALID_PERSONALITIES: PersonalityId[] = ["maid", "dm", "degen", "glados"];
    const personalityId: PersonalityId =
      VALID_PERSONALITIES.includes(personality as PersonalityId)
        ? (personality as PersonalityId)
        : "maid";

    // Find terms
    const terms = findTermsInText(text);

    // Build response
    const explanation = buildExplanation(terms, personalityId);
    const highlightedText = buildHighlightedText(text, terms);

    const response: DecodeResponse = {
      terms,
      explanation,
      highlightedText,
    };

    return Response.json(response);
  } catch (err) {
    console.error("Decode API error:", err);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
